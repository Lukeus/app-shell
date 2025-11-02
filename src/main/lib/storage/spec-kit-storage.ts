import { app } from 'electron';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../logger';
import {
  ArchiveSpecKitWorkspaceInput,
  CreateSpecKitWorkspaceInput,
  SpecKitWorkspace,
  SpecKitWorkspaceId,
  SpecKitWorkspaceKey,
  SpecKitWorkspaceMetadata,
} from '../../../common/spec-kit';

const INVALID_SEGMENT = /[\\/]/g;

function sanitizeSegment(segment: string): string {
  return segment.replace(INVALID_SEGMENT, '_');
}

function ensureMetadata(metadata?: Partial<SpecKitWorkspaceMetadata>): SpecKitWorkspaceMetadata {
  return {
    promptHistory: metadata?.promptHistory ? [...metadata.promptHistory] : [],
    specRevisions: metadata?.specRevisions ? [...metadata.specRevisions] : [],
    generatedPatchPointers: metadata?.generatedPatchPointers
      ? [...metadata.generatedPatchPointers]
      : [],
  };
}

function workspaceIdFromKey(key: SpecKitWorkspaceKey): SpecKitWorkspaceId {
  return `${key.org}/${key.repo}/${key.feature}`;
}

function parseWorkspaceId(id: SpecKitWorkspaceId): SpecKitWorkspaceKey {
  const [org, repo, feature] = id.split('/');
  if (!org || !repo || !feature) {
    throw new Error(`Invalid workspace identifier: ${id}`);
  }
  return { org, repo, feature };
}

export class SpecKitStorage {
  private basePath: string;
  private logger: Logger;

  constructor(logger = new Logger('SpecKitStorage')) {
    this.logger = logger;
    this.basePath = path.join(app.getPath('userData'), 'specKits');
  }

  async init(): Promise<void> {
    await fsp.mkdir(this.basePath, { recursive: true });
  }

  static toId(key: SpecKitWorkspaceKey): SpecKitWorkspaceId {
    return workspaceIdFromKey(key);
  }

  static fromId(id: SpecKitWorkspaceId): SpecKitWorkspaceKey {
    return parseWorkspaceId(id);
  }

  private getWorkspaceDirectory(key: SpecKitWorkspaceKey): string {
    return path.join(
      this.basePath,
      sanitizeSegment(key.org),
      sanitizeSegment(key.repo)
    );
  }

  private getWorkspaceFilePath(key: SpecKitWorkspaceKey): string {
    return path.join(this.getWorkspaceDirectory(key), `${sanitizeSegment(key.feature)}.json`);
  }

  private async readWorkspaceFile(filePath: string): Promise<SpecKitWorkspace | null> {
    try {
      const content = await fsp.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content) as SpecKitWorkspace;
      return this.normalizeWorkspace(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      this.logger.warn(`Failed to read workspace file at ${filePath}`, error);
      return null;
    }
  }

  private normalizeWorkspace(raw: SpecKitWorkspace): SpecKitWorkspace {
    const metadata = ensureMetadata(raw.metadata);
    const key = raw.key ?? SpecKitStorage.fromId(raw.id);
    const id = raw.id ?? SpecKitStorage.toId(key);
    return {
      id,
      key,
      title: raw.title,
      description: raw.description,
      createdAt: raw.createdAt ?? new Date().toISOString(),
      updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
      archived: Boolean(raw.archived),
      metadata,
    };
  }

  async listWorkspaces(): Promise<SpecKitWorkspace[]> {
    const results: SpecKitWorkspace[] = [];

    let orgDirs: string[] = [];
    try {
      orgDirs = await fsp.readdir(this.basePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return results;
      }
      throw error;
    }

    for (const orgDir of orgDirs) {
      const orgPath = path.join(this.basePath, orgDir);
      const stat = await fsp.stat(orgPath);
      if (!stat.isDirectory()) {
        continue;
      }

      const repoDirs = await fsp.readdir(orgPath);
      for (const repoDir of repoDirs) {
        const repoPath = path.join(orgPath, repoDir);
        const repoStat = await fsp.stat(repoPath);
        if (!repoStat.isDirectory()) {
          continue;
        }

        const featureFiles = await fsp.readdir(repoPath);
        for (const fileName of featureFiles) {
          if (!fileName.endsWith('.json')) {
            continue;
          }

          const filePath = path.join(repoPath, fileName);
          const workspace = await this.readWorkspaceFile(filePath);
          if (workspace) {
            results.push(workspace);
          }
        }
      }
    }

    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return results;
  }

  async getWorkspace(key: SpecKitWorkspaceKey): Promise<SpecKitWorkspace | null> {
    const filePath = this.getWorkspaceFilePath(key);
    return this.readWorkspaceFile(filePath);
  }

  async getWorkspaceById(id: SpecKitWorkspaceId): Promise<SpecKitWorkspace | null> {
    try {
      const key = SpecKitStorage.fromId(id);
      return this.getWorkspace(key);
    } catch (error) {
      this.logger.warn(`Failed to parse workspace id ${id}`, error);
      return null;
    }
  }

  async createWorkspace(input: CreateSpecKitWorkspaceInput): Promise<SpecKitWorkspace> {
    const existing = await this.getWorkspace(input.key);
    if (existing) {
      throw new Error(`Workspace already exists for ${SpecKitStorage.toId(input.key)}`);
    }

    const now = new Date().toISOString();
    const metadata = ensureMetadata(input.metadata);
    const workspace: SpecKitWorkspace = {
      id: SpecKitStorage.toId(input.key),
      key: input.key,
      title: input.title,
      description: input.description,
      createdAt: now,
      updatedAt: now,
      archived: false,
      metadata,
    };

    await this.persist(workspace);
    return workspace;
  }

  async updateMetadata(
    key: SpecKitWorkspaceKey,
    metadata: SpecKitWorkspaceMetadata
  ): Promise<SpecKitWorkspace> {
    const existing = await this.getWorkspace(key);
    if (!existing) {
      throw new Error(`Workspace not found for ${SpecKitStorage.toId(key)}`);
    }

    const updated: SpecKitWorkspace = {
      ...existing,
      metadata: ensureMetadata(metadata),
      updatedAt: new Date().toISOString(),
    };

    await this.persist(updated);
    return updated;
  }

  async archiveWorkspace(
    input: ArchiveSpecKitWorkspaceInput
  ): Promise<SpecKitWorkspace> {
    const existing = await this.getWorkspace(input.key);
    if (!existing) {
      throw new Error(`Workspace not found for ${SpecKitStorage.toId(input.key)}`);
    }

    const updated: SpecKitWorkspace = {
      ...existing,
      archived: input.archived ?? true,
      updatedAt: new Date().toISOString(),
    };

    await this.persist(updated);
    return updated;
  }

  private async persist(workspace: SpecKitWorkspace): Promise<void> {
    const filePath = this.getWorkspaceFilePath(workspace.key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
    }

    const data = JSON.stringify(workspace, null, 2);
    await fsp.writeFile(filePath, data, 'utf8');
  }
}

export function createDefaultWorkspaceMetadata(): SpecKitWorkspaceMetadata {
  return ensureMetadata();
}
