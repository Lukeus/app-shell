import { Logger } from './logger';
import { SettingsManager } from './settings-manager';
import {
  ArchiveSpecKitWorkspaceInput,
  CreateSpecKitWorkspaceInput,
  SpecKitWorkspace,
  SpecKitWorkspaceId,
  SpecKitWorkspaceKey,
  SpecKitWorkspaceMetadata,
} from '../common/spec-kit';
import { SpecKitStorage } from './lib/storage/spec-kit-storage';

const CURRENT_WORKSPACE_SETTING_KEY = 'specKit.currentWorkspaceId';

export class SpecKitWorkspaceManager {
  private readonly logger = new Logger('SpecKitWorkspaceManager');
  private readonly storage: SpecKitStorage;

  constructor(private readonly settingsManager: SettingsManager) {
    this.storage = new SpecKitStorage(this.logger);
  }

  async init(): Promise<void> {
    await this.storage.init();
  }

  async listWorkspaces(): Promise<SpecKitWorkspace[]> {
    return this.storage.listWorkspaces();
  }

  async getWorkspace(key: SpecKitWorkspaceKey): Promise<SpecKitWorkspace | null> {
    return this.storage.getWorkspace(key);
  }

  async getWorkspaceById(id: SpecKitWorkspaceId): Promise<SpecKitWorkspace | null> {
    return this.storage.getWorkspaceById(id);
  }

  async createWorkspace(input: CreateSpecKitWorkspaceInput): Promise<SpecKitWorkspace> {
    const workspace = await this.storage.createWorkspace(input);
    await this.setCurrentWorkspaceId(workspace.id);
    return workspace;
  }

  async updateWorkspaceMetadata(
    key: SpecKitWorkspaceKey,
    metadata: SpecKitWorkspaceMetadata
  ): Promise<SpecKitWorkspace> {
    const workspace = await this.storage.updateMetadata(key, metadata);
    return workspace;
  }

  async archiveWorkspace(input: ArchiveSpecKitWorkspaceInput): Promise<SpecKitWorkspace> {
    const workspace = await this.storage.archiveWorkspace(input);
    const currentId = await this.getCurrentWorkspaceId();
    if (workspace.archived && currentId === workspace.id) {
      await this.setCurrentWorkspaceId(null);
    }
    return workspace;
  }

  async selectWorkspace(key: SpecKitWorkspaceKey): Promise<SpecKitWorkspace> {
    const workspace = await this.storage.getWorkspace(key);
    if (!workspace) {
      throw new Error(`Workspace not found for ${SpecKitStorage.toId(key)}`);
    }
    if (workspace.archived) {
      throw new Error('Cannot select an archived workspace');
    }
    await this.setCurrentWorkspaceId(workspace.id);
    return workspace;
  }

  async getCurrentWorkspace(): Promise<SpecKitWorkspace | null> {
    const currentId = await this.getCurrentWorkspaceId();
    if (!currentId) {
      return null;
    }
    const workspace = await this.storage.getWorkspaceById(currentId);
    if (!workspace || workspace.archived) {
      await this.setCurrentWorkspaceId(null);
      return null;
    }
    return workspace;
  }

  private async getCurrentWorkspaceId(): Promise<SpecKitWorkspaceId | null> {
    const value = await this.settingsManager.get<string>(CURRENT_WORKSPACE_SETTING_KEY);
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    return null;
  }

  private async setCurrentWorkspaceId(id: SpecKitWorkspaceId | null): Promise<void> {
    if (id) {
      await this.settingsManager.set(CURRENT_WORKSPACE_SETTING_KEY, id);
    } else {
      await this.settingsManager.set(CURRENT_WORKSPACE_SETTING_KEY, null);
    }
  }
}
