/**
 * GitService - Core Git operations using simple-git
 */

import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import * as path from 'path';
import type {
  GitRepository,
  GitStatus,
  GitFileStatus,
  GitFileStatusType,
  GitCommit,
  GitBranch,
  GitDiff,
  GitCloneOptions,
  GitConfig,
} from '../types';

export class GitService {
  private git: SimpleGit | null = null;
  private repositoryPath: string | null = null;
  private config: GitConfig;

  constructor() {
    this.config = this.loadConfig();
    this.initializeRepository();
  }

  private loadConfig(): GitConfig {
    try {
      const gitConfig = appShell.workspace.getConfiguration('git');
      return {
        enabled: gitConfig.get('enabled', true),
        path: gitConfig.get('path', 'git'),
        autoFetch: gitConfig.get('autoFetch', true),
        autoPush: gitConfig.get('autoPush', false),
        confirmSync: gitConfig.get('confirmSync', true),
        defaultCloneDirectory: gitConfig.get('defaultCloneDirectory', ''),
        decorations: {
          enabled: gitConfig.get('decorations.enabled', true),
        },
      };
    } catch (error) {
      console.warn('Failed to load Git configuration, using defaults:', error);
      return {
        enabled: true,
        path: 'git',
        autoFetch: true,
        autoPush: false,
        confirmSync: true,
        defaultCloneDirectory: '',
        decorations: { enabled: true },
      };
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      if (!this.config.enabled) {
        return;
      }

      const workspaceFolders = appShell.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspacePath = workspaceFolders[0].uri.fsPath;
      await this.setRepository(workspacePath);
    } catch (error) {
      console.warn('Failed to initialize Git repository:', error);
    }
  }

  async setRepository(repositoryPath: string): Promise<void> {
    try {
      this.repositoryPath = repositoryPath;
      this.git = simpleGit({
        baseDir: repositoryPath,
        binary: this.config.path,
        maxConcurrentProcesses: 10,
        trimmed: false,
      });

      // Check if it's a valid Git repository
      await this.git.status();
      console.log(`Git repository initialized at: ${repositoryPath}`);
    } catch (error) {
      console.warn(`Not a Git repository: ${repositoryPath}`, error);
      this.git = null;
      this.repositoryPath = null;
      throw error;
    }
  }

  async isRepository(): Promise<boolean> {
    if (!this.git || !this.repositoryPath) {
      return false;
    }

    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRepository(): Promise<GitRepository | null> {
    if (!this.git || !this.repositoryPath) {
      return null;
    }

    try {
      const [status, branches, remotes] = await Promise.all([
        this.getStatus(),
        this.getBranches(),
        this.getRemotes(),
      ]);

      const currentBranch = branches.find(b => b.current);

      return {
        path: this.repositoryPath,
        name: path.basename(this.repositoryPath),
        branch: currentBranch?.name || 'main',
        remotes,
        status,
      };
    } catch (error) {
      console.error('Failed to get repository info:', error);
      return null;
    }
  }

  async getStatus(): Promise<GitStatus> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      const status: StatusResult = await this.git.status();

      const mapFileStatus = (file: any, staged: boolean): GitFileStatus => ({
        path: file.path || file,
        status: this.mapStatusType(file.index || file.working_dir || '??'),
        staged,
        originalPath: file.from,
      });

      return {
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged.map((f: any) => mapFileStatus(f, true)),
        unstaged: [
          ...status.modified.map((f: any) => mapFileStatus(f, false)),
          ...status.deleted.map((f: any) => mapFileStatus(f, false)),
        ],
        untracked: status.not_added.map((f: any) => mapFileStatus(f, false)),
        conflicted: status.conflicted.map((f: any) => mapFileStatus(f, false)),
      };
    } catch (error) {
      console.error('Failed to get Git status:', error);
      throw error;
    }
  }

  private mapStatusType(gitStatus: string): GitFileStatusType {
    switch (gitStatus.charAt(0)) {
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
      case '?':
        return '??';
      default:
        return 'M';
    }
  }

  async stageFile(filePath: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.add(filePath);
      console.log(`Staged file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to stage file: ${filePath}`, error);
      throw error;
    }
  }

  async stageAll(): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.add('.');
      console.log('Staged all changes');
    } catch (error) {
      console.error('Failed to stage all changes', error);
      throw error;
    }
  }

  async unstageFile(filePath: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.reset(['HEAD', filePath]);
      console.log(`Unstaged file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to unstage file: ${filePath}`, error);
      throw error;
    }
  }

  async unstageAll(): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.reset(['--hard', 'HEAD']);
      console.log('Unstaged all changes');
    } catch (error) {
      console.error('Failed to unstage all changes', error);
      throw error;
    }
  }

  async commit(message: string): Promise<string> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    if (!message.trim()) {
      throw new Error('Commit message cannot be empty');
    }

    try {
      const result = await this.git.commit(message);
      console.log(`Created commit: ${result.commit}`);
      return result.commit;
    } catch (error) {
      console.error('Failed to create commit:', error);
      throw error;
    }
  }

  async push(remote?: string, branch?: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      if (remote && branch) {
        await this.git.push(remote, branch);
      } else {
        await this.git.push();
      }
      console.log(`Pushed to ${remote || 'origin'}`);
    } catch (error) {
      console.error('Failed to push:', error);
      throw error;
    }
  }

  async pull(remote?: string, branch?: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      if (remote && branch) {
        await this.git.pull(remote, branch);
      } else {
        await this.git.pull();
      }
      console.log(`Pulled from ${remote || 'origin'}`);
    } catch (error) {
      console.error('Failed to pull:', error);
      throw error;
    }
  }

  async fetch(remote?: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      if (remote) {
        await this.git.fetch(remote);
      } else {
        await this.git.fetch();
      }
      console.log(`Fetched from ${remote || 'all remotes'}`);
    } catch (error) {
      console.error('Failed to fetch:', error);
      throw error;
    }
  }

  async getBranches(): Promise<GitBranch[]> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      const branches = await this.git.branch(['-a']);
      return branches.all.map((name: string) => ({
        name: name.replace(/^origin\//, ''),
        current: name === branches.current,
        remote: name.startsWith('remotes/') ? name.split('/')[1] : undefined,
      }));
    } catch (error) {
      console.error('Failed to get branches:', error);
      throw error;
    }
  }

  async switchBranch(branchName: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.checkout(branchName);
      console.log(`Switched to branch: ${branchName}`);
    } catch (error) {
      console.error(`Failed to switch to branch: ${branchName}`, error);
      throw error;
    }
  }

  async createBranch(branchName: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.checkoutLocalBranch(branchName);
      console.log(`Created and switched to branch: ${branchName}`);
    } catch (error) {
      console.error(`Failed to create branch: ${branchName}`, error);
      throw error;
    }
  }

  async getRemotes(): Promise<any[]> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      const remotes = await this.git.getRemotes(true);
      return remotes.map((remote: any) => ({
        name: remote.name,
        url: remote.refs.fetch || remote.refs.push,
        type: 'both' as const,
      }));
    } catch (error) {
      console.error('Failed to get remotes:', error);
      throw error;
    }
  }

  async getCommitHistory(limit = 20): Promise<GitCommit[]> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      const log = await this.git.log({ maxCount: limit });
      return log.all.map((commit: any) => ({
        hash: commit.hash,
        date: new Date(commit.date),
        message: commit.message,
        author: {
          name: commit.author_name,
          email: commit.author_email,
        },
        parents: commit.parents,
      }));
    } catch (error) {
      console.error('Failed to get commit history:', error);
      throw error;
    }
  }

  async discardChanges(filePath: string): Promise<void> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      await this.git.checkout(['HEAD', filePath]);
      console.log(`Discarded changes in: ${filePath}`);
    } catch (error) {
      console.error(`Failed to discard changes in: ${filePath}`, error);
      throw error;
    }
  }

  async clone(options: GitCloneOptions): Promise<void> {
    try {
      const git = simpleGit({
        binary: this.config.path,
        maxConcurrentProcesses: 10,
      });

      const cloneOptions: string[] = [];
      if (options.depth) {
        cloneOptions.push('--depth', options.depth.toString());
      }
      if (options.branch) {
        cloneOptions.push('--branch', options.branch);
      }

      await git.clone(options.url, options.directory, cloneOptions);
      console.log(`Cloned repository from ${options.url} to ${options.directory}`);
    } catch (error) {
      console.error('Failed to clone repository:', error);
      throw error;
    }
  }

  async initRepository(path: string): Promise<void> {
    try {
      const git = simpleGit({
        baseDir: path,
        binary: this.config.path,
      });

      await git.init();
      console.log(`Initialized Git repository at: ${path}`);

      // Set this as the current repository
      await this.setRepository(path);
    } catch (error) {
      console.error('Failed to initialize repository:', error);
      throw error;
    }
  }

  async getDiff(filePath?: string): Promise<string> {
    if (!this.git) {
      throw new Error('Git not initialized');
    }

    try {
      if (filePath) {
        return await this.git.diff([filePath]);
      } else {
        return await this.git.diff();
      }
    } catch (error) {
      console.error('Failed to get diff:', error);
      throw error;
    }
  }

  getConfig(): GitConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<GitConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize if path changed
    if (newConfig.path && this.repositoryPath) {
      this.setRepository(this.repositoryPath).catch(console.error);
    }
  }

  dispose(): void {
    this.git = null;
    this.repositoryPath = null;
    console.log('GitService disposed');
  }
}
