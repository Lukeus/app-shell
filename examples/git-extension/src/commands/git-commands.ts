/**
 * Git Commands - Command handlers for Git operations
 */

import { GitService } from '../services/git-service';
import { SourceControlProvider } from '../services/source-control-provider';
import { appShell, ExtensionContext } from '../types';
import * as path from 'path';

export class GitCommands {
  private gitService: GitService;
  private sourceControlProvider: SourceControlProvider;
  private context: ExtensionContext;

  constructor(
    gitService: GitService,
    sourceControlProvider: SourceControlProvider,
    context: ExtensionContext
  ) {
    this.gitService = gitService;
    this.sourceControlProvider = sourceControlProvider;
    this.context = context;
  }

  registerCommands(): void {
    // Stage file command
    const stageDisposable = appShell.commands.registerCommand(
      'git.stage',
      this.handleStage.bind(this),
      'Stage Changes',
      'Git'
    );
    this.context.subscriptions.push(stageDisposable);

    // Unstage file command
    const unstageDisposable = appShell.commands.registerCommand(
      'git.unstage',
      this.handleUnstage.bind(this),
      'Unstage Changes',
      'Git'
    );
    this.context.subscriptions.push(unstageDisposable);

    // Commit command
    const commitDisposable = appShell.commands.registerCommand(
      'git.commit',
      this.handleCommit.bind(this),
      'Commit',
      'Git'
    );
    this.context.subscriptions.push(commitDisposable);

    // Push command
    const pushDisposable = appShell.commands.registerCommand(
      'git.push',
      this.handlePush.bind(this),
      'Push',
      'Git'
    );
    this.context.subscriptions.push(pushDisposable);

    // Pull command
    const pullDisposable = appShell.commands.registerCommand(
      'git.pull',
      this.handlePull.bind(this),
      'Pull',
      'Git'
    );
    this.context.subscriptions.push(pullDisposable);

    // Refresh command
    const refreshDisposable = appShell.commands.registerCommand(
      'git.refresh',
      this.handleRefresh.bind(this),
      'Refresh',
      'Git'
    );
    this.context.subscriptions.push(refreshDisposable);

    // Open file command
    const openFileDisposable = appShell.commands.registerCommand(
      'git.openFile',
      this.handleOpenFile.bind(this),
      'Open File',
      'Git'
    );
    this.context.subscriptions.push(openFileDisposable);

    // Open diff command
    const openDiffDisposable = appShell.commands.registerCommand(
      'git.openDiff',
      this.handleOpenDiff.bind(this),
      'Open Changes',
      'Git'
    );
    this.context.subscriptions.push(openDiffDisposable);

    // Discard changes command
    const discardDisposable = appShell.commands.registerCommand(
      'git.discardChanges',
      this.handleDiscardChanges.bind(this),
      'Discard Changes',
      'Git'
    );
    this.context.subscriptions.push(discardDisposable);

    // Clone repository command
    const cloneDisposable = appShell.commands.registerCommand(
      'git.clone',
      this.handleClone.bind(this),
      'Clone Repository',
      'Git'
    );
    this.context.subscriptions.push(cloneDisposable);

    // Initialize repository command
    const initDisposable = appShell.commands.registerCommand(
      'git.init',
      this.handleInit.bind(this),
      'Initialize Repository',
      'Git'
    );
    this.context.subscriptions.push(initDisposable);

    // Switch branch command
    const switchBranchDisposable = appShell.commands.registerCommand(
      'git.switchBranch',
      this.handleSwitchBranch.bind(this),
      'Switch Branch',
      'Git'
    );
    this.context.subscriptions.push(switchBranchDisposable);

    console.log('Git commands registered successfully');
  }

  async handleStage(resourceUri?: string): Promise<void> {
    try {
      if (resourceUri) {
        await this.gitService.stageFile(resourceUri);
        appShell.window.showInformationMessage(`Staged: ${path.basename(resourceUri)}`);
      } else {
        await this.gitService.stageAll();
        appShell.window.showInformationMessage('Staged all changes');
      }
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Stage failed:', error);
      appShell.window.showErrorMessage(
        `Stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleUnstage(resourceUri?: string): Promise<void> {
    try {
      if (resourceUri) {
        await this.gitService.unstageFile(resourceUri);
        appShell.window.showInformationMessage(`Unstaged: ${path.basename(resourceUri)}`);
      } else {
        await this.gitService.unstageAll();
        appShell.window.showInformationMessage('Unstaged all changes');
      }
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Unstage failed:', error);
      appShell.window.showErrorMessage(
        `Unstage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleCommit(): Promise<void> {
    try {
      const message = await appShell.window.showInputBox({
        prompt: 'Enter commit message',
        value: '',
      });

      if (!message) {
        return;
      }

      const commitHash = await this.gitService.commit(message);
      appShell.window.showInformationMessage(`Committed: ${commitHash.substring(0, 8)}`);
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Commit failed:', error);
      appShell.window.showErrorMessage(
        `Commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handlePush(): Promise<void> {
    try {
      const config = this.gitService.getConfig();

      if (config.confirmSync) {
        const confirm = await appShell.window.showQuickPick(['Yes', 'No'], {
          placeholder: 'Push commits to remote repository?',
        });

        if (confirm !== 'Yes') {
          return;
        }
      }

      await this.gitService.push();
      appShell.window.showInformationMessage('Pushed successfully');
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Push failed:', error);
      appShell.window.showErrorMessage(
        `Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handlePull(): Promise<void> {
    try {
      const config = this.gitService.getConfig();

      if (config.confirmSync) {
        const confirm = await appShell.window.showQuickPick(['Yes', 'No'], {
          placeholder: 'Pull changes from remote repository?',
        });

        if (confirm !== 'Yes') {
          return;
        }
      }

      await this.gitService.pull();
      appShell.window.showInformationMessage('Pulled successfully');
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Pull failed:', error);
      appShell.window.showErrorMessage(
        `Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRefresh(): Promise<void> {
    try {
      await this.sourceControlProvider.refresh();
      appShell.window.showInformationMessage('Git status refreshed');
    } catch (error) {
      console.error('Refresh failed:', error);
      appShell.window.showErrorMessage('Failed to refresh Git status');
    }
  }

  async handleOpenFile(resourceUri: string): Promise<void> {
    try {
      // This would typically open the file in the editor
      // For now, we'll just show a message
      appShell.window.showInformationMessage(`Opening file: ${path.basename(resourceUri)}`);

      // In a real implementation, this would be:
      // await appShell.commands.executeCommand('vscode.open', Uri.file(resourceUri));
    } catch (error) {
      console.error('Failed to open file:', error);
      appShell.window.showErrorMessage('Failed to open file');
    }
  }

  async handleOpenDiff(resourceUri: string): Promise<void> {
    try {
      const diff = await this.gitService.getDiff(resourceUri);

      if (diff) {
        // In a real implementation, this would open a diff view
        console.log('Diff for', resourceUri, diff);
        appShell.window.showInformationMessage(`Showing diff for: ${path.basename(resourceUri)}`);
      } else {
        appShell.window.showInformationMessage('No changes to show');
      }
    } catch (error) {
      console.error('Failed to open diff:', error);
      appShell.window.showErrorMessage('Failed to open diff');
    }
  }

  async handleDiscardChanges(resourceUri: string): Promise<void> {
    try {
      const confirm = await appShell.window.showQuickPick(['Yes', 'Cancel'], {
        placeholder: `Discard changes in ${path.basename(resourceUri)}? This cannot be undone.`,
      });

      if (confirm !== 'Yes') {
        return;
      }

      await this.gitService.discardChanges(resourceUri);
      appShell.window.showInformationMessage(`Discarded changes in: ${path.basename(resourceUri)}`);
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Discard changes failed:', error);
      appShell.window.showErrorMessage('Failed to discard changes');
    }
  }

  async handleClone(): Promise<void> {
    try {
      const url = await appShell.window.showInputBox({
        prompt: 'Enter repository URL to clone',
        value: '',
      });

      if (!url) {
        return;
      }

      const config = this.gitService.getConfig();
      let directory = config.defaultCloneDirectory;

      if (!directory) {
        const inputDirectory = await appShell.window.showInputBox({
          prompt: 'Enter directory to clone into',
          value: '',
        });

        if (!inputDirectory) {
          return;
        }

        directory = inputDirectory;
      }

      // Extract repository name from URL
      const repoName = url.split('/').pop()?.replace('.git', '') || 'repository';
      const fullPath = path.join(directory, repoName);

      await this.gitService.clone({ url, directory: fullPath });
      appShell.window.showInformationMessage(`Repository cloned to: ${fullPath}`);
    } catch (error) {
      console.error('Clone failed:', error);
      appShell.window.showErrorMessage(
        `Clone failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleInit(): Promise<void> {
    try {
      const workspaceFolders = appShell.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        appShell.window.showErrorMessage('No workspace folder open');
        return;
      }

      const workspacePath = workspaceFolders[0].uri.fsPath;
      const confirm = await appShell.window.showQuickPick(['Yes', 'Cancel'], {
        placeholder: `Initialize Git repository in ${path.basename(workspacePath)}?`,
      });

      if (confirm !== 'Yes') {
        return;
      }

      await this.gitService.initRepository(workspacePath);
      appShell.window.showInformationMessage('Git repository initialized');
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Init failed:', error);
      appShell.window.showErrorMessage(
        `Init failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleSwitchBranch(): Promise<void> {
    try {
      const branches = await this.gitService.getBranches();
      const branchNames = branches.map(b => (b.current ? `* ${b.name}` : b.name));

      const selectedBranch = await appShell.window.showQuickPick(branchNames, {
        placeholder: 'Select branch to switch to',
      });

      if (!selectedBranch) {
        return;
      }

      const branchName = selectedBranch.replace('* ', '');
      const currentBranch = branches.find(b => b.current);

      if (currentBranch && branchName === currentBranch.name) {
        appShell.window.showInformationMessage('Already on this branch');
        return;
      }

      await this.gitService.switchBranch(branchName);
      appShell.window.showInformationMessage(`Switched to branch: ${branchName}`);
      await this.sourceControlProvider.refresh();
    } catch (error) {
      console.error('Switch branch failed:', error);
      appShell.window.showErrorMessage(
        `Switch branch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  dispose(): void {
    // Disposal is handled by the extension system via context.subscriptions
    console.log('GitCommands disposed');
  }
}
