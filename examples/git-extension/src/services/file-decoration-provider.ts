/**
 * FileDecorationProvider - Provides visual decorations for files based on Git status
 */

import { GitService } from './git-service';
import type { GitFileStatus, GitFileStatusType } from '../types';
import * as path from 'path';

export interface FileDecoration {
  badge?: string;
  color?: string;
  tooltip?: string;
  iconPath?: string;
}

export class FileDecorationProvider {
  private gitService: GitService;
  private decorations: Map<string, FileDecoration> = new Map();
  private onDidChangeFileDecorationsEmitter: ((uri: string) => void)[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(gitService: GitService) {
    this.gitService = gitService;
    this.setupAutoRefresh();
  }

  private setupAutoRefresh(): void {
    // Refresh decorations every 3 seconds
    this.refreshTimer = setInterval(() => {
      this.refreshDecorations().catch(error => {
        console.warn('Auto-refresh decorations failed:', error);
      });
    }, 3000);
  }

  async initialize(): Promise<void> {
    try {
      await this.refreshDecorations();
      console.log('FileDecorationProvider initialized');
    } catch (error) {
      console.warn('Failed to initialize FileDecorationProvider:', error);
    }
  }

  async refreshDecorations(): Promise<void> {
    try {
      if (!(await this.gitService.isRepository())) {
        this.clearDecorations();
        return;
      }

      const status = await this.gitService.getStatus();
      const newDecorations = new Map<string, FileDecoration>();

      // Process all file statuses
      const allFiles = [
        ...status.staged,
        ...status.unstaged,
        ...status.untracked,
        ...status.conflicted,
      ];

      for (const file of allFiles) {
        const decoration = this.createDecoration(file);
        newDecorations.set(file.path, decoration);
      }

      // Update decorations and notify changes
      const changedFiles = new Set<string>();

      // Check for changed decorations
      newDecorations.forEach((decoration, filePath) => {
        const existing = this.decorations.get(filePath);
        if (!this.decorationsEqual(existing, decoration)) {
          changedFiles.add(filePath);
        }
      });

      // Check for removed decorations
      this.decorations.forEach((_, filePath) => {
        if (!newDecorations.has(filePath)) {
          changedFiles.add(filePath);
        }
      });

      // Update the decorations map
      this.decorations = newDecorations;

      // Notify changes
      changedFiles.forEach(filePath => {
        this.notifyDecorationChange(filePath);
      });

      // Emit event
      appShell.events.emit('git.decorationsChanged', {
        changedFiles: Array.from(changedFiles),
        decorations: Object.fromEntries(this.decorations),
      });
    } catch (error) {
      console.error('Failed to refresh decorations:', error);
    }
  }

  private createDecoration(file: GitFileStatus): FileDecoration {
    const decoration: FileDecoration = {
      tooltip: this.getTooltip(file),
      color: this.getColor(file),
      badge: this.getBadge(file.status),
      iconPath: this.getIconPath(file.status),
    };

    return decoration;
  }

  private getTooltip(file: GitFileStatus): string {
    const statusText = this.getStatusText(file.status);
    const stagingText = file.staged ? ' (Staged)' : '';

    if (file.originalPath) {
      return `${statusText}: ${file.originalPath} → ${file.path}${stagingText}`;
    }

    return `${statusText}: ${file.path}${stagingText}`;
  }

  private getStatusText(status: GitFileStatusType): string {
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

  private getColor(file: GitFileStatus): string {
    if (file.staged) {
      return '#00ff00'; // Green for staged files
    }

    switch (file.status) {
      case 'M':
        return '#ff8c00'; // Orange for modified
      case 'A':
        return '#00ff00'; // Green for added
      case 'D':
        return '#ff0000'; // Red for deleted
      case 'R':
        return '#0066cc'; // Blue for renamed
      case 'C':
        return '#9966cc'; // Purple for copied
      case 'U':
        return '#ff0000'; // Red for conflicted
      case '??':
        return '#999999'; // Gray for untracked
      default:
        return '#ff8c00';
    }
  }

  private getBadge(status: GitFileStatusType): string {
    switch (status) {
      case 'M':
        return 'M';
      case 'A':
        return 'A';
      case 'D':
        return 'D';
      case 'R':
        return 'R';
      case 'C':
        return 'C';
      case 'U':
        return 'U';
      case '??':
        return '?';
      default:
        return 'M';
    }
  }

  private getIconPath(status: GitFileStatusType): string {
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

  private decorationsEqual(a: FileDecoration | undefined, b: FileDecoration): boolean {
    if (!a) return false;

    return (
      a.badge === b.badge &&
      a.color === b.color &&
      a.tooltip === b.tooltip &&
      a.iconPath === b.iconPath
    );
  }

  private clearDecorations(): void {
    const changedFiles = Array.from(this.decorations.keys());
    this.decorations.clear();

    // Notify that all files lost their decorations
    changedFiles.forEach(filePath => {
      this.notifyDecorationChange(filePath);
    });
  }

  getDecoration(filePath: string): FileDecoration | undefined {
    return this.decorations.get(filePath);
  }

  getAllDecorations(): Map<string, FileDecoration> {
    return new Map(this.decorations);
  }

  getDecorationsForDirectory(directoryPath: string): Map<string, FileDecoration> {
    const result = new Map<string, FileDecoration>();

    this.decorations.forEach((decoration, filePath) => {
      if (filePath.startsWith(directoryPath)) {
        result.set(filePath, decoration);
      }
    });

    return result;
  }

  onDidChangeFileDecorations(callback: (uri: string) => void): { dispose(): void } {
    this.onDidChangeFileDecorationsEmitter.push(callback);
    return {
      dispose: () => {
        const index = this.onDidChangeFileDecorationsEmitter.indexOf(callback);
        if (index !== -1) {
          this.onDidChangeFileDecorationsEmitter.splice(index, 1);
        }
      },
    };
  }

  private notifyDecorationChange(filePath: string): void {
    this.onDidChangeFileDecorationsEmitter.forEach(callback => {
      try {
        callback(filePath);
      } catch (error) {
        console.error('Error in onDidChangeFileDecorations callback:', error);
      }
    });
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.onDidChangeFileDecorationsEmitter.length = 0;
    this.decorations.clear();
    console.log('FileDecorationProvider disposed');
  }
}
