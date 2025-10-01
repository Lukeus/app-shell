/**
 * SourceControlProvider - Integrates Git with App Shell's source control system
 */

import { GitService } from './git-service';
import type { GitRepository, GitStatus, GitFileStatus } from '../types';

export interface SourceControlResourceGroup {
  id: string;
  label: string;
  resources: SourceControlResource[];
}

export interface SourceControlResource {
  resourceUri: string;
  decorations: SourceControlResourceDecorations;
}

export interface SourceControlResourceDecorations {
  tooltip?: string;
  strikeThrough?: boolean;
  faded?: boolean;
  iconPath?: string;
  color?: string;
}

export class SourceControlProvider {
  private gitService: GitService;
  private repository: GitRepository | null = null;
  private status: GitStatus | null = null;
  private onDidChangeEmitter: ((groups: SourceControlResourceGroup[]) => void)[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(gitService: GitService) {
    this.gitService = gitService;
    this.setupAutoRefresh();
  }

  private setupAutoRefresh(): void {
    // Refresh status every 5 seconds
    this.refreshTimer = setInterval(() => {
      this.refresh().catch(error => {
        console.warn('Auto-refresh failed:', error);
      });
    }, 5000);
  }

  async initialize(): Promise<void> {
    try {
      await this.refresh();
      console.log('SourceControlProvider initialized');
    } catch (error) {
      console.warn('Failed to initialize SourceControlProvider:', error);
    }
  }

  async refresh(): Promise<void> {
    try {
      if (!(await this.gitService.isRepository())) {
        this.repository = null;
        this.status = null;
        this.notifyChange([]);
        return;
      }

      const [repository, status] = await Promise.all([
        this.gitService.getRepository(),
        this.gitService.getStatus(),
      ]);

      this.repository = repository;
      this.status = status;

      const groups = this.createResourceGroups(status);
      this.notifyChange(groups);

      // Emit event for other components
      appShell.events.emit('git.statusChanged', { repository, status });
    } catch (error) {
      console.error('Failed to refresh source control:', error);
      this.repository = null;
      this.status = null;
      this.notifyChange([]);
    }
  }

  private createResourceGroups(status: GitStatus): SourceControlResourceGroup[] {
    const groups: SourceControlResourceGroup[] = [];

    // Staged changes group
    if (status.staged.length > 0) {
      groups.push({
        id: 'staged',
        label: `Staged Changes (${status.staged.length})`,
        resources: status.staged.map(file => this.createResource(file, true)),
      });
    }

    // Unstaged changes group
    const unstagedCount = status.unstaged.length + status.untracked.length;
    if (unstagedCount > 0) {
      const unstaged = [...status.unstaged, ...status.untracked];
      groups.push({
        id: 'unstaged',
        label: `Changes (${unstagedCount})`,
        resources: unstaged.map(file => this.createResource(file, false)),
      });
    }

    // Conflicted changes group
    if (status.conflicted.length > 0) {
      groups.push({
        id: 'conflicted',
        label: `Merge Conflicts (${status.conflicted.length})`,
        resources: status.conflicted.map(file => this.createResource(file, false)),
      });
    }

    return groups;
  }

  private createResource(file: GitFileStatus, staged: boolean): SourceControlResource {
    return {
      resourceUri: file.path,
      decorations: {
        tooltip: this.getTooltip(file),
        iconPath: this.getIconPath(file.status),
        color: this.getColor(file.status, staged),
        strikeThrough: file.status === 'D',
        faded: false,
      },
    };
  }

  private getTooltip(file: GitFileStatus): string {
    const statusText = this.getStatusText(file.status);
    if (file.originalPath) {
      return `${statusText}: ${file.originalPath} → ${file.path}`;
    }
    return `${statusText}: ${file.path}`;
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'M':
        return 'Modified';
      case 'A':
        return 'Added';
      case 'D':
        return 'Deleted';
      case 'R':
        return 'Renamed';
      case 'C':
        return 'Copied';
      case 'U':
        return 'Unmerged';
      case '??':
        return 'Untracked';
      default:
        return 'Changed';
    }
  }

  private getIconPath(status: string): string {
    switch (status) {
      case 'M':
        return 'modified';
      case 'A':
        return 'added';
      case 'D':
        return 'deleted';
      case 'R':
        return 'renamed';
      case 'C':
        return 'copied';
      case 'U':
        return 'conflicted';
      case '??':
        return 'untracked';
      default:
        return 'modified';
    }
  }

  private getColor(status: string, staged: boolean): string {
    if (staged) {
      return '#00ff00'; // Green for staged
    }

    switch (status) {
      case 'M':
        return '#ffa500'; // Orange for modified
      case 'A':
        return '#00ff00'; // Green for added
      case 'D':
        return '#ff0000'; // Red for deleted
      case 'R':
        return '#0000ff'; // Blue for renamed
      case 'C':
        return '#800080'; // Purple for copied
      case 'U':
        return '#ff0000'; // Red for conflicted
      case '??':
        return '#808080'; // Gray for untracked
      default:
        return '#ffa500';
    }
  }

  getRepository(): GitRepository | null {
    return this.repository;
  }

  getStatus(): GitStatus | null {
    return this.status;
  }

  getResourceGroups(): SourceControlResourceGroup[] {
    if (!this.status) {
      return [];
    }
    return this.createResourceGroups(this.status);
  }

  onDidChangeResources(callback: (groups: SourceControlResourceGroup[]) => void): {
    dispose(): void;
  } {
    this.onDidChangeEmitter.push(callback);
    return {
      dispose: () => {
        const index = this.onDidChangeEmitter.indexOf(callback);
        if (index !== -1) {
          this.onDidChangeEmitter.splice(index, 1);
        }
      },
    };
  }

  private notifyChange(groups: SourceControlResourceGroup[]): void {
    this.onDidChangeEmitter.forEach(callback => {
      try {
        callback(groups);
      } catch (error) {
        console.error('Error in onDidChangeResources callback:', error);
      }
    });
  }

  async stageResource(resourceUri: string): Promise<void> {
    try {
      await this.gitService.stageFile(resourceUri);
      await this.refresh();
    } catch (error) {
      console.error('Failed to stage resource:', error);
      throw error;
    }
  }

  async unstageResource(resourceUri: string): Promise<void> {
    try {
      await this.gitService.unstageFile(resourceUri);
      await this.refresh();
    } catch (error) {
      console.error('Failed to unstage resource:', error);
      throw error;
    }
  }

  async stageAll(): Promise<void> {
    try {
      await this.gitService.stageAll();
      await this.refresh();
    } catch (error) {
      console.error('Failed to stage all:', error);
      throw error;
    }
  }

  async unstageAll(): Promise<void> {
    try {
      await this.gitService.unstageAll();
      await this.refresh();
    } catch (error) {
      console.error('Failed to unstage all:', error);
      throw error;
    }
  }

  async commit(message: string): Promise<void> {
    try {
      await this.gitService.commit(message);
      await this.refresh();
    } catch (error) {
      console.error('Failed to commit:', error);
      throw error;
    }
  }

  async discardChanges(resourceUri: string): Promise<void> {
    try {
      await this.gitService.discardChanges(resourceUri);
      await this.refresh();
    } catch (error) {
      console.error('Failed to discard changes:', error);
      throw error;
    }
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.onDidChangeEmitter.length = 0;
    this.repository = null;
    this.status = null;
    console.log('SourceControlProvider disposed');
  }
}
