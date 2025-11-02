import { app, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { Logger } from './logger';
import { FileSystemManager } from './file-system-manager';
import { PathSecurity } from './ipc/path-security';
import {
  WorkspaceMetadata,
  WorkspaceMetadataSchema,
  WorkspacePipeline,
  WorkspacePipelineStep,
} from '../schemas';
import { GitStatusService } from './lib/git/git-status-service';
import { GitPatchService } from './lib/git/git-patch-service';
import { GitFileOpener } from './lib/git/git-file-opener';
import { Lifecycle } from './lifecycle';

const WorkspaceStateSchema = z.object({
  activeWorkspaceId: z.string().optional(),
  workspaces: z.array(WorkspaceMetadataSchema),
});

type WorkspaceStateFile = z.infer<typeof WorkspaceStateSchema>;

type ApplyMode = 'overwrite' | 'append' | 'patch';

interface PipelineApplyStep extends WorkspacePipelineStep {
  type: 'applySpec' | 'applyCode';
  targetPath: string;
  content: string;
  encoding?: BufferEncoding;
  applyMode?: ApplyMode;
  openInEditor?: boolean;
  openInPreview?: boolean;
}

interface PipelineRunOptions {
  stepId?: string;
}

export interface WorkspaceFileAppliedEvent {
  workspaceId: string;
  absolutePath: string;
  openInEditor?: boolean;
  openInPreview?: boolean;
  step: WorkspacePipelineStep;
}

export class WorkspaceManager implements Lifecycle {
  private readonly logger = new Logger('WorkspaceManager');
  private readonly gitStatusService = new GitStatusService(this.logger);
  private readonly gitPatchService = new GitPatchService(this.logger);
  private readonly fileOpener = new GitFileOpener(this.logger);
  private metadataPath: string | null = null;
  private workspaces: WorkspaceMetadata[] = [];
  private activeWorkspaceId: string | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(
    private readonly fileSystemManager: FileSystemManager,
    private readonly pathSecurity: PathSecurity
  ) {}

  async init(): Promise<void> {
    try {
      this.metadataPath = path.join(app.getPath('userData'), 'workspaces.json');
      await this.ensureMetadataDirectory();
      await this.loadState();

      if (this.workspaces.length === 0) {
        const defaultPath = process.cwd();
        const defaultWorkspace: WorkspaceMetadata = {
          id: 'default',
          name: 'Default Workspace',
          rootPath: defaultPath,
          repository: {
            path: defaultPath,
            branch: 'main',
          },
          pipelines: [],
        };
        this.workspaces = [defaultWorkspace];
        this.activeWorkspaceId = defaultWorkspace.id;
        await this.saveState();
      }

      if (!this.activeWorkspaceId && this.workspaces.length > 0) {
        this.activeWorkspaceId = this.workspaces[0].id;
      }

      await this.refreshActiveWorkspaceContext();
    } catch (error) {
      this.logger.error('Failed to initialize workspace manager', error as Error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // No resources to dispose currently
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
    if (window) {
      const active = this.getActiveWorkspace();
      if (active) {
        this.emitWorkspaceContextUpdate(active);
      }
    }
  }

  getWorkspaces(): WorkspaceMetadata[] {
    return this.workspaces.map(ws => ({ ...ws }));
  }

  getActiveWorkspace(): WorkspaceMetadata | undefined {
    if (!this.activeWorkspaceId) return undefined;
    return this.workspaces.find(ws => ws.id === this.activeWorkspaceId);
  }

  async switchWorkspace(workspaceId: string): Promise<WorkspaceMetadata> {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    if (this.activeWorkspaceId === workspaceId) {
      await this.refreshActiveWorkspaceContext();
      return workspace;
    }

    this.activeWorkspaceId = workspaceId;
    workspace.lastActiveAt = new Date().toISOString();
    await this.updateWorkspaceRoots(workspace);
    await this.refreshActiveWorkspaceContext();
    await this.saveState();

    this.emitWorkspaceContextUpdate(workspace);
    return workspace;
  }

  async runPipeline(
    workspaceId: string,
    pipelineId: string,
    options: PipelineRunOptions = {}
  ): Promise<void> {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const pipeline = workspace.pipelines?.find(pl => pl.id === pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found for workspace ${workspaceId}`);
    }

    const steps = this.selectSteps(pipeline, options.stepId);
    for (const step of steps) {
      await this.executeStep(workspace, step);
    }

    await this.refreshWorkspaceContext(workspace);
    await this.saveState();
    this.emitWorkspaceContextUpdate(workspace);
  }

  private async executeStep(workspace: WorkspaceMetadata, step: WorkspacePipelineStep): Promise<void> {
    if (step.type === 'applySpec' || step.type === 'applyCode') {
      await this.handleApplyStep(workspace, step as PipelineApplyStep);
      return;
    }

    this.logger.warn(`Unsupported pipeline step type: ${step.type}`);
  }

  private async handleApplyStep(workspace: WorkspaceMetadata, step: PipelineApplyStep): Promise<void> {
    if (!workspace.repository?.path) {
      throw new Error('Workspace repository path is not configured');
    }

    const repoRoot = path.resolve(workspace.repository.path);
    const targetAbsolutePath = path.resolve(repoRoot, step.targetPath);

    if (!targetAbsolutePath.startsWith(repoRoot)) {
      throw new Error(`Target path ${targetAbsolutePath} is outside of workspace repository`);
    }

    const mode: ApplyMode = step.applyMode ?? 'overwrite';
    if (mode === 'patch') {
      await this.gitPatchService.applyPatch(repoRoot, step.content);
    } else {
      const existingContent = mode === 'append' ? await this.readFileSafe(targetAbsolutePath) : '';
      const content = mode === 'append' ? `${existingContent}${step.content}` : step.content;
      await this.fileSystemManager.writeFileText(targetAbsolutePath, content, step.encoding);
    }

    if (step.openInEditor || step.openInPreview) {
      if (step.openInPreview) {
        await this.fileOpener.openFile(targetAbsolutePath);
      }
      this.emitFileApplied({
        workspaceId: workspace.id,
        absolutePath: targetAbsolutePath,
        openInEditor: step.openInEditor,
        openInPreview: step.openInPreview,
        step,
      });
    }
  }

  private async readFileSafe(filePath: string): Promise<string> {
    try {
      return await this.fileSystemManager.readFileText(filePath);
    } catch {
      return '';
    }
  }

  private selectSteps(pipeline: WorkspacePipeline, stepId?: string): WorkspacePipelineStep[] {
    if (!stepId) {
      return pipeline.steps ?? [];
    }

    const step = pipeline.steps?.find(st => st.id === stepId);
    if (!step) {
      throw new Error(`Pipeline step ${stepId} not found`);
    }
    return [step];
  }

  private async refreshActiveWorkspaceContext(): Promise<void> {
    const workspace = this.getActiveWorkspace();
    if (!workspace) return;

    await this.updateWorkspaceRoots(workspace);
    await this.refreshWorkspaceContext(workspace);
    await this.saveState();
    this.emitWorkspaceContextUpdate(workspace);
  }

  private async refreshWorkspaceContext(workspace: WorkspaceMetadata): Promise<void> {
    const repository = workspace.repository;
    if (!repository?.path) {
      return;
    }

    const status = await this.gitStatusService.getStatus(repository.path);
    if (!status) {
      return;
    }

    repository.branch = status.branch;
    repository.status = {
      branch: status.branch,
      ahead: status.ahead,
      behind: status.behind,
      dirty: status.dirty,
      changedFiles: status.changedFiles,
      lastChecked: new Date().toISOString(),
      upstream: status.upstream,
    };
  }

  private async updateWorkspaceRoots(workspace: WorkspaceMetadata): Promise<void> {
    const repoPath = workspace.repository?.path ?? workspace.rootPath;
    if (repoPath) {
      this.pathSecurity.updateWorkspaceRoots([repoPath]);
    }
  }

  private async ensureMetadataDirectory(): Promise<void> {
    if (!this.metadataPath) return;
    const directory = path.dirname(this.metadataPath);
    await fs.mkdir(directory, { recursive: true });
  }

  private async loadState(): Promise<void> {
    if (!this.metadataPath) return;

    try {
      const data = await fs.readFile(this.metadataPath, 'utf-8');
      const parsed = WorkspaceStateSchema.parse(JSON.parse(data)) as WorkspaceStateFile;
      this.workspaces = parsed.workspaces.map(ws => ({ ...ws }));
      this.activeWorkspaceId = parsed.activeWorkspaceId ?? null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.workspaces = [];
        this.activeWorkspaceId = null;
        return;
      }

      this.logger.error('Failed to load workspace metadata, starting fresh', error as Error);
      this.workspaces = [];
      this.activeWorkspaceId = null;
    }
  }

  private async saveState(): Promise<void> {
    if (!this.metadataPath) return;

    const state: WorkspaceStateFile = {
      activeWorkspaceId: this.activeWorkspaceId ?? undefined,
      workspaces: this.workspaces,
    };

    await fs.writeFile(this.metadataPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  private emitWorkspaceContextUpdate(workspace: WorkspaceMetadata): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.webContents.send('workspace:context-updated', workspace);
  }

  private emitFileApplied(event: WorkspaceFileAppliedEvent): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.webContents.send('workspace:file-applied', event);
  }
}
