import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { Logger } from './logger';
import {
  SpecKitPipelineState,
  SpecKitState,
  SpecKitWorkspace,
  createEmptySpecKitState,
} from '../types';

interface SpecKitManagerOptions {
  logger?: Logger;
}

export class SpecKitManager extends EventEmitter {
  private workspaces: SpecKitWorkspace[];
  private activeWorkspaceId: string | null;
  private mainWindow: BrowserWindow | null = null;
  private readonly logger: Logger;

  constructor(options: SpecKitManagerOptions = {}) {
    super();
    this.logger = options.logger ?? new Logger('SpecKitManager');
    this.workspaces = this.createInitialWorkspaces();
    this.activeWorkspaceId = this.workspaces[0]?.id ?? null;
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;

    if (this.mainWindow) {
      this.mainWindow.webContents.once('did-finish-load', () => {
        this.broadcastState();
      });
    }
  }

  public getState(): SpecKitState {
    return {
      workspaces: this.workspaces.map(workspace => ({
        ...workspace,
        pipeline: { ...workspace.pipeline },
      })),
      activeWorkspaceId: this.activeWorkspaceId,
      lastBroadcast: Date.now(),
    };
  }

  public getActiveWorkspace(): SpecKitWorkspace | null {
    if (!this.activeWorkspaceId) {
      return null;
    }
    return this.findWorkspace(this.activeWorkspaceId) ?? null;
  }

  public switchWorkspace(workspaceId: string): SpecKitState {
    const workspace = this.findWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    this.activeWorkspaceId = workspace.id;
    this.touchWorkspace(workspace, 'Switched workspace');
    return this.finalizeUpdate();
  }

  public resumePipeline(workspaceId?: string): SpecKitState {
    const targetId = workspaceId ?? this.activeWorkspaceId;
    if (!targetId) {
      throw new Error('No active workspace to resume');
    }

    const workspace = this.findWorkspace(targetId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${targetId}`);
    }

    workspace.pipeline.status = 'running';
    workspace.pipeline.completedSteps = Math.min(
      workspace.pipeline.completedSteps + 1,
      workspace.pipeline.totalSteps
    );
    workspace.pipeline.updatedAt = Date.now();

    this.touchWorkspace(workspace, 'Resumed pipeline');
    return this.finalizeUpdate();
  }

  public saveContext(workspaceId?: string): SpecKitState {
    const targetId = workspaceId ?? this.activeWorkspaceId;
    if (!targetId) {
      throw new Error('No active workspace to save');
    }

    const workspace = this.findWorkspace(targetId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${targetId}`);
    }

    this.touchWorkspace(workspace, 'Saved context');
    return this.finalizeUpdate();
  }

  public setPipelineStatus(
    workspaceId: string,
    status: SpecKitPipelineState['status']
  ): SpecKitState {
    const workspace = this.findWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    workspace.pipeline.status = status;
    workspace.pipeline.updatedAt = Date.now();
    this.touchWorkspace(workspace, `Pipeline status updated to ${status}`);
    return this.finalizeUpdate();
  }

  public reset(): void {
    this.workspaces = this.createInitialWorkspaces();
    this.activeWorkspaceId = this.workspaces[0]?.id ?? null;
    this.broadcastState();
  }

  private finalizeUpdate(): SpecKitState {
    const state = this.getState();
    this.broadcastState(state);
    return state;
  }

  private broadcastState(state: SpecKitState = this.getState()): void {
    this.emit('state-changed', state);

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send('speckit:state-changed', state);
      } catch (error) {
        this.logger.error('Failed to broadcast Spec Kit state', error);
      }
    }
  }

  private findWorkspace(workspaceId: string): SpecKitWorkspace | undefined {
    return this.workspaces.find(workspace => workspace.id === workspaceId);
  }

  private touchWorkspace(workspace: SpecKitWorkspace, reason: string): void {
    workspace.lastModified = Date.now();
    workspace.pipeline.updatedAt = workspace.lastModified;
    this.logger.info(`${reason}: ${workspace.name}`);
  }

  private createInitialWorkspaces(): SpecKitWorkspace[] {
    const now = Date.now();
    const createPipeline = (
      currentStep: string,
      status: SpecKitPipelineState['status'],
      completedSteps: number,
      totalSteps: number
    ): SpecKitPipelineState => ({
      currentStep,
      status,
      completedSteps,
      totalSteps,
      updatedAt: now,
    });

    return [
      {
        id: 'speckit-core',
        name: 'Core Product Specs',
        description: 'System specifications and design documentation for the core platform.',
        lastModified: now - 1000 * 60 * 60 * 2,
        pipeline: createPipeline('Define Success Metrics', 'running', 2, 5),
        tags: ['core', 'product'],
      },
      {
        id: 'speckit-ai',
        name: 'AI Pilot Workspace',
        description: 'Experiments and rollout planning for AI-assisted features.',
        lastModified: now - 1000 * 60 * 45,
        pipeline: createPipeline('Align Stakeholders', 'paused', 1, 6),
        tags: ['ai', 'pilot'],
      },
      {
        id: 'speckit-infra',
        name: 'Infrastructure Readiness',
        description: 'Scalability and reliability specifications for upcoming launch.',
        lastModified: now - 1000 * 60 * 10,
        pipeline: createPipeline('Capacity Forecast', 'idle', 0, 4),
        tags: ['infrastructure'],
      },
    ];
  }
}

export const createSpecKitState = (): SpecKitState => createEmptySpecKitState();
