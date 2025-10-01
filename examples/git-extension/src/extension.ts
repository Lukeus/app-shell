/**
 * Git Extension for App Shell
 *
 * Provides comprehensive Git source control integration similar to VS Code.
 * Features include staging, committing, pushing, pulling, branch management,
 * and visual diff viewing.
 */

import { GitService } from './services/git-service';
import { SourceControlProvider } from './services/source-control-provider';
import { FileDecorationProvider } from './services/file-decoration-provider';
import { GitCommands } from './commands/git-commands';
import { ExtensionContext, appShell } from './types';

// Global extension services
let gitService: GitService;
let sourceControlProvider: SourceControlProvider;
let fileDecorationProvider: FileDecorationProvider;
let gitCommands: GitCommands;
let extensionContext: ExtensionContext;

/**
 * Extension activation function
 * Called when the extension is loaded and activated
 */
export async function activate(context: ExtensionContext): Promise<void> {
  extensionContext = context;

  console.log('Git Extension: Activating...');
  console.log(`Extension ID: ${context.extensionId}`);
  console.log(`Extension path: ${context.extensionPath}`);

  try {
    // Initialize core services
    await initializeServices(context);

    // Register commands
    registerCommands();

    // Set up event listeners
    setupEventListeners();

    // Check if we're in a Git repository and show appropriate message
    await checkRepositoryStatus();

    console.log('Git Extension: Activated successfully');

    // Show activation notification if enabled
    const config = appShell.workspace.getConfiguration('git');
    if (config.get('showActivationMessage', false)) {
      appShell.window.showInformationMessage('Git Extension activated successfully!');
    }
  } catch (error) {
    console.error('Git Extension: Failed to activate', error);
    appShell.window.showErrorMessage(
      `Git Extension failed to activate: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

/**
 * Extension deactivation function
 * Called when the extension is unloaded
 */
export function deactivate(): void {
  console.log('Git Extension: Deactivating...');

  try {
    // Dispose of services
    if (gitCommands) {
      gitCommands.dispose();
    }

    if (fileDecorationProvider) {
      fileDecorationProvider.dispose();
    }

    if (sourceControlProvider) {
      sourceControlProvider.dispose();
    }

    if (gitService) {
      gitService.dispose();
    }

    console.log('Git Extension: Deactivated successfully');

    // Show deactivation notification if enabled
    const config = appShell.workspace.getConfiguration('git');
    if (config.get('showActivationMessage', false)) {
      appShell.window.showInformationMessage('Git Extension deactivated');
    }
  } catch (error) {
    console.error('Git Extension: Error during deactivation', error);
  }
}

/**
 * Initialize core extension services
 */
async function initializeServices(context: ExtensionContext): Promise<void> {
  try {
    // Initialize Git service
    gitService = new GitService();
    console.log('Git Extension: GitService initialized');

    // Initialize source control provider
    sourceControlProvider = new SourceControlProvider(gitService);
    await sourceControlProvider.initialize();
    console.log('Git Extension: SourceControlProvider initialized');

    // Initialize file decoration provider
    fileDecorationProvider = new FileDecorationProvider(gitService);
    await fileDecorationProvider.initialize();
    console.log('Git Extension: FileDecorationProvider initialized');

    // Initialize commands
    gitCommands = new GitCommands(gitService, sourceControlProvider, context);
    console.log('Git Extension: GitCommands initialized');

    // Add cleanup subscriptions
    context.subscriptions.push({
      dispose: () => {
        console.log('Git Extension: Core services cleanup completed');
      },
    });
  } catch (error) {
    console.error('Git Extension: Failed to initialize services', error);
    throw error;
  }
}

/**
 * Register all extension commands
 */
function registerCommands(): void {
  try {
    gitCommands.registerCommands();
    console.log('Git Extension: Commands registered');
  } catch (error) {
    console.error('Git Extension: Failed to register commands', error);
    throw error;
  }
}

/**
 * Set up event listeners for workspace and configuration changes
 */
function setupEventListeners(): void {
  try {
    // Listen for workspace folder changes
    const workspaceDisposable = appShell.workspace.onDidChangeWorkspaceFolders(async () => {
      console.log('Git Extension: Workspace folders changed, reinitializing...');
      try {
        await sourceControlProvider.refresh();
      } catch (error) {
        console.error('Git Extension: Failed to handle workspace change', error);
      }
    });
    extensionContext.subscriptions.push(workspaceDisposable);

    // Listen for Git-specific events
    appShell.events.on('git.statusChanged', (event: any) => {
      console.log('Git Extension: Status changed', event);
    });

    appShell.events.on('git.repositoryChanged', async (event: any) => {
      console.log('Git Extension: Repository changed', event);
      try {
        await sourceControlProvider.refresh();
      } catch (error) {
        console.error('Git Extension: Failed to handle repository change', error);
      }
    });

    console.log('Git Extension: Event listeners set up');
  } catch (error) {
    console.error('Git Extension: Failed to setup event listeners', error);
  }
}

/**
 * Check initial repository status and provide user feedback
 */
async function checkRepositoryStatus(): Promise<void> {
  try {
    const isRepo = await gitService.isRepository();

    if (isRepo) {
      const repository = await gitService.getRepository();
      if (repository) {
        console.log(
          `Git Extension: Active repository - ${repository.name} on branch ${repository.branch}`
        );

        // Emit repository activated event
        appShell.events.emit('git.repositoryActivated', {
          repository,
          extensionId: extensionContext.extensionId,
        });
      }
    } else {
      console.log('Git Extension: No Git repository detected in workspace');

      // Emit no repository event
      appShell.events.emit('git.noRepository', {
        extensionId: extensionContext.extensionId,
      });
    }
  } catch (error) {
    console.warn('Git Extension: Could not check repository status', error);
  }
}

/**
 * Get the current Git service instance
 * Useful for other extensions or components that need Git functionality
 */
export function getGitService(): GitService | undefined {
  return gitService;
}

/**
 * Get the current source control provider instance
 */
export function getSourceControlProvider(): SourceControlProvider | undefined {
  return sourceControlProvider;
}

/**
 * Get the current file decoration provider instance
 */
export function getFileDecorationProvider(): FileDecorationProvider | undefined {
  return fileDecorationProvider;
}

/**
 * Get extension information
 */
export function getExtensionInfo() {
  return {
    id: extensionContext?.extensionId,
    path: extensionContext?.extensionPath,
    isActive: !!(gitService && sourceControlProvider && fileDecorationProvider && gitCommands),
    hasRepository: gitService?.isRepository(),
    version: '1.0.0',
  };
}

// Export command handlers for external use
export const commands = {
  stage: (resourceUri?: string) => gitCommands?.handleStage(resourceUri),
  unstage: (resourceUri?: string) => gitCommands?.handleUnstage(resourceUri),
  commit: () => gitCommands?.handleCommit(),
  push: () => gitCommands?.handlePush(),
  pull: () => gitCommands?.handlePull(),
  refresh: () => gitCommands?.handleRefresh(),
  openFile: (resourceUri: string) => gitCommands?.handleOpenFile(resourceUri),
  openDiff: (resourceUri: string) => gitCommands?.handleOpenDiff(resourceUri),
  discardChanges: (resourceUri: string) => gitCommands?.handleDiscardChanges(resourceUri),
  clone: () => gitCommands?.handleClone(),
  init: () => gitCommands?.handleInit(),
  switchBranch: () => gitCommands?.handleSwitchBranch(),
};

// Export extension API for other extensions
export const api = {
  getGitService,
  getSourceControlProvider,
  getFileDecorationProvider,
  getExtensionInfo,
  commands,
};

console.log('Git Extension: Module loaded');
