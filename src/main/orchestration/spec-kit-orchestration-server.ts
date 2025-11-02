import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { URL } from 'url';
import { gzipSync } from 'zlib';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../logger';
import { CommandManager } from '../managers/command-manager';
import { SettingsManager } from '../settings-manager';
import { FileSystemManager } from '../file-system-manager';
import { PathSecurity } from '../ipc/path-security';
import { SpecKitAuthManager } from '../security/auth-manager';

interface StartPipelineRequest {
  pipelineId?: string;
  commandId?: string;
  args?: unknown[];
}

interface ExportWorkspaceRequest {
  workspaceRoot?: string;
  destinationPath?: string;
  includeHidden?: boolean;
  includeContent?: boolean;
  maxDepth?: number;
}

interface OrchestrationServerOptions {
  port?: number;
  host?: string;
}

interface WorkspaceEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: number;
  children?: WorkspaceEntry[];
  linkTarget?: string;
  contentBase64?: string;
  contentEncoding?: 'base64';
}

const DEFAULT_MAX_DEPTH = 3;

export class SpecKitOrchestrationServer {
  private readonly logger = new Logger('SpecKitOrchestrationServer');
  private readonly commandManager: CommandManager;
  private readonly settingsManager: SettingsManager;
  private readonly fileSystemManager: FileSystemManager;
  private readonly pathSecurity: PathSecurity;
  private readonly authManager: SpecKitAuthManager;
  private readonly options: Required<OrchestrationServerOptions>;
  private server?: Server;

  constructor(
    commandManager: CommandManager,
    settingsManager: SettingsManager,
    fileSystemManager: FileSystemManager,
    pathSecurity: PathSecurity,
    options: OrchestrationServerOptions = {}
  ) {
    this.commandManager = commandManager;
    this.settingsManager = settingsManager;
    this.fileSystemManager = fileSystemManager;
    this.pathSecurity = pathSecurity;
    this.authManager = new SpecKitAuthManager();
    this.options = {
      host: options.host ?? '127.0.0.1',
      port: options.port ?? Number(process.env.SPEC_KIT_API_PORT ?? 17653),
    };
  }

  public async start(): Promise<void> {
    if (this.server) {
      return;
    }

    this.server = createServer(async (request, response) => {
      try {
        const authResult = this.authManager.validateRequest(request);
        if (!authResult.ok) {
          this.respondJSON(response, 401, {
            error: 'unauthorized',
            reason: authResult.reason,
            strategy: authResult.strategy,
          });
          return;
        }

        await this.handleRequest(request, response);
      } catch (error) {
        this.logger.error('Unexpected orchestration server error', error);
        this.respondJSON(response, 500, { error: 'internal_error' });
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.server?.listen(this.options.port, this.options.host, () => {
        this.logger.info(
          `Spec Kit orchestration server listening on http://${this.options.host}:${this.options.port}`
        );
        resolve();
      });
      this.server?.once('error', error => {
        this.logger.error('Failed to start orchestration server', error);
        reject(error);
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server?.close(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    this.server = undefined;
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const method = request.method ?? 'GET';
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (method === 'POST' && pathname === '/spec-kit/startPipeline') {
      let payload: StartPipelineRequest | undefined;
      try {
        payload = await this.readJsonBody<StartPipelineRequest>(request);
      } catch (error) {
        this.respondJSON(response, 400, {
          error: 'invalid_json',
          message: error instanceof Error ? error.message : 'Invalid JSON payload',
        });
        return;
      }
      await this.handleStartPipeline(payload ?? {}, response);
      return;
    }

    if (method === 'GET' && pathname === '/spec-kit/workspaceState') {
      await this.handleWorkspaceState(response);
      return;
    }

    if (method === 'POST' && pathname === '/spec-kit/exportWorkspace') {
      let payload: ExportWorkspaceRequest | undefined;
      try {
        payload = await this.readJsonBody<ExportWorkspaceRequest>(request);
      } catch (error) {
        this.respondJSON(response, 400, {
          error: 'invalid_json',
          message: error instanceof Error ? error.message : 'Invalid JSON payload',
        });
        return;
      }
      await this.handleExportWorkspace(payload ?? {}, response);
      return;
    }

    this.respondJSON(response, 404, { error: 'not_found', path: pathname });
  }

  private async handleStartPipeline(payload: StartPipelineRequest, response: ServerResponse): Promise<void> {
    const commandId = payload.commandId ?? 'pipeline.start';
    const pipelineId = payload.pipelineId;
    const args: unknown[] = Array.isArray(payload.args) ? [...payload.args] : [];

    if (commandId === 'pipeline.start' && pipelineId) {
      args.unshift(pipelineId);
    }

    if (!this.commandManager.hasCommand(commandId)) {
      this.respondJSON(response, 404, {
        error: 'command_not_found',
        commandId,
      });
      return;
    }

    try {
      const result = await this.commandManager.executeCommand(commandId, ...args);
      this.respondJSON(response, 200, { status: 'ok', commandId, pipelineId, result });
    } catch (error) {
      this.logger.error('Failed to start pipeline', error);
      this.respondJSON(response, 500, {
        error: 'command_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleWorkspaceState(response: ServerResponse): Promise<void> {
    try {
      const settings = await this.settingsManager.getAll();
      const commands = this.commandManager.getAllCommands();
      const workspaceRoots = this.pathSecurity.getWorkspaceRoots();

      this.respondJSON(response, 200, {
        status: 'ok',
        workspaceRoots,
        settings,
        commands,
      });
    } catch (error) {
      this.logger.error('Failed to collect workspace state', error);
      this.respondJSON(response, 500, {
        error: 'workspace_state_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleExportWorkspace(payload: ExportWorkspaceRequest, response: ServerResponse): Promise<void> {
    const workspaceRoot = payload.workspaceRoot ?? this.pathSecurity.getWorkspaceRoots()[0];
    if (!workspaceRoot) {
      this.respondJSON(response, 400, {
        error: 'workspace_not_configured',
        message: 'No workspace root configured',
      });
      return;
    }

    try {
      this.pathSecurity.assertAllowed(workspaceRoot, 'read');
    } catch (error) {
      this.respondJSON(response, 403, {
        error: 'workspace_forbidden',
        message: error instanceof Error ? error.message : 'Workspace not allowed',
      });
      return;
    }

    const maxDepth = payload.maxDepth && payload.maxDepth > 0 ? payload.maxDepth : DEFAULT_MAX_DEPTH;

    try {
      const snapshot = await this.buildWorkspaceSnapshot(
        workspaceRoot,
        payload.includeHidden ?? false,
        payload.includeContent ?? false,
        maxDepth
      );

      if (payload.destinationPath) {
        try {
          const absoluteDestination = path.resolve(payload.destinationPath);
          this.pathSecurity.assertAllowed(absoluteDestination, 'write');
          const data = JSON.stringify(snapshot, null, 2);
          await this.fileSystemManager.writeFileText(absoluteDestination, data);

          this.respondJSON(response, 200, {
            status: 'written',
            workspaceRoot,
            destinationPath: absoluteDestination,
            entries: this.countEntries(snapshot),
          });
          return;
        } catch (error) {
          this.respondJSON(response, 500, {
            error: 'export_write_failed',
            message: error instanceof Error ? error.message : 'Failed to write export file',
          });
          return;
        }
      }

      const gzipBuffer = gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf-8'));
      const base64 = gzipBuffer.toString('base64');

      this.respondJSON(response, 200, {
        status: 'ok',
        workspaceRoot,
        format: 'json.gz',
        encoding: 'base64',
        entries: this.countEntries(snapshot),
        payload: base64,
      });
    } catch (error) {
      this.logger.error('Failed to export workspace', error);
      this.respondJSON(response, 500, {
        error: 'export_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async buildWorkspaceSnapshot(
    root: string,
    includeHidden: boolean,
    includeContent: boolean,
    maxDepth: number,
    depth = 0
  ): Promise<WorkspaceEntry> {
    const stats = await fs.promises.lstat(root);

    if (stats.isSymbolicLink()) {
      const entry: WorkspaceEntry = {
        name: path.basename(root),
        path: root,
        type: 'symlink',
        size: stats.size,
        modified: stats.mtimeMs,
        linkTarget: await fs.promises.readlink(root).catch(() => undefined),
      };
      return entry;
    }

    const entry: WorkspaceEntry = {
      name: path.basename(root),
      path: root,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modified: stats.mtimeMs,
    };

    if (!stats.isDirectory() || depth >= maxDepth) {
      if (includeContent && stats.isFile() && stats.size <= 1024 * 1024) {
        entry.children = undefined;
        entry.type = 'file';
        entry.size = stats.size;
        try {
          const contentBuffer = await fs.promises.readFile(root);
          entry.contentBase64 = contentBuffer.toString('base64');
          entry.contentEncoding = 'base64';
        } catch (error) {
          this.logger.warn(`Failed to read file content for ${root}`, error);
        }
      }
      return entry;
    }

    const directoryEntries = await fs.promises.readdir(root);
    const children: WorkspaceEntry[] = [];

    for (const childName of directoryEntries) {
      if (!includeHidden && childName.startsWith('.')) {
        continue;
      }

      const childPath = path.join(root, childName);
      try {
        const childSnapshot = await this.buildWorkspaceSnapshot(
          childPath,
          includeHidden,
          includeContent,
          maxDepth,
          depth + 1
        );
        children.push(childSnapshot);
      } catch (error) {
        this.logger.warn(`Failed to capture snapshot for ${childPath}`, error);
      }
    }

    entry.children = children;
    return entry;
  }

  private countEntries(entry: WorkspaceEntry): number {
    let count = 1;
    if (entry.children) {
      for (const child of entry.children) {
        count += this.countEntries(child);
      }
    }
    return count;
  }

  private async readJsonBody<T>(request: IncomingMessage): Promise<T | undefined> {
    const chunks: Uint8Array[] = [];

    for await (const chunk of request) {
      chunks.push(chunk as Uint8Array);
    }

    if (chunks.length === 0) {
      return undefined;
    }

    try {
      const text = Buffer.concat(chunks).toString('utf-8');
      if (!text) {
        return undefined;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      this.logger.warn('Failed to parse request body as JSON', error);
      throw new Error('Invalid JSON body');
    }
  }

  private respondJSON(response: ServerResponse, statusCode: number, payload: unknown): void {
    const body = JSON.stringify(payload, null, 2);
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Length', Buffer.byteLength(body));
    response.end(body);
  }
}
