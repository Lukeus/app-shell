/**
 * Git Configuration Manager - Handles Git user configuration and settings
 */

import { GitService } from '../services/git-service';
import type { ExtensionContext } from '../types';

export interface GitUserConfig {
  name?: string;
  email?: string;
}

export interface GitRemoteConfig {
  name: string;
  url: string;
}

export class GitConfigManager {
  private gitService: GitService;
  private context: ExtensionContext;

  constructor(gitService: GitService, context: ExtensionContext) {
    this.gitService = gitService;
    this.context = context;
  }

  async getUserConfig(): Promise<GitUserConfig> {
    try {
      const config = appShell.workspace.getConfiguration('git');

      return {
        name: config.get('user.name', ''),
        email: config.get('user.email', ''),
      };
    } catch (error) {
      console.error('Failed to get user config:', error);
      return {};
    }
  }

  async setUserConfig(userConfig: GitUserConfig): Promise<void> {
    try {
      const config = appShell.workspace.getConfiguration('git');

      if (userConfig.name) {
        await config.update('user.name', userConfig.name);
      }

      if (userConfig.email) {
        await config.update('user.email', userConfig.email);
      }

      console.log('User config updated:', userConfig);
      appShell.window.showInformationMessage('Git user configuration updated');
    } catch (error) {
      console.error('Failed to set user config:', error);
      appShell.window.showErrorMessage('Failed to update Git user configuration');
      throw error;
    }
  }

  async promptForUserConfig(): Promise<GitUserConfig | null> {
    try {
      const currentConfig = await this.getUserConfig();

      const name = await appShell.window.showInputBox({
        prompt: 'Enter your Git user name',
        value: currentConfig.name || '',
      });

      if (!name) {
        return null;
      }

      const email = await appShell.window.showInputBox({
        prompt: 'Enter your Git email address',
        value: currentConfig.email || '',
      });

      if (!email) {
        return null;
      }

      return { name, email };
    } catch (error) {
      console.error('Failed to prompt for user config:', error);
      return null;
    }
  }

  async configureGitSettings(): Promise<void> {
    try {
      const options = ['Set User Name and Email', 'View Current Configuration'];

      const selected = await appShell.window.showQuickPick(options, {
        placeholder: 'Select Git configuration option',
      });

      switch (selected) {
        case 'Set User Name and Email':
          const userConfig = await this.promptForUserConfig();
          if (userConfig) {
            await this.setUserConfig(userConfig);
          }
          break;

        case 'View Current Configuration':
          await this.showCurrentConfiguration();
          break;
      }
    } catch (error) {
      console.error('Failed to configure Git settings:', error);
      appShell.window.showErrorMessage('Failed to configure Git settings');
    }
  }

  async showCurrentConfiguration(): Promise<void> {
    try {
      const userConfig = await this.getUserConfig();
      const gitConfig = this.gitService.getConfig();

      const configInfo = [
        '=== Git Configuration ===',
        '',
        'User Configuration:',
        `  Name: ${userConfig.name || 'Not set'}`,
        `  Email: ${userConfig.email || 'Not set'}`,
        '',
        'Extension Settings:',
        `  Enabled: ${gitConfig.enabled}`,
        `  Git Path: ${gitConfig.path}`,
        `  Auto Fetch: ${gitConfig.autoFetch}`,
        `  Auto Push: ${gitConfig.autoPush}`,
        `  Confirm Sync: ${gitConfig.confirmSync}`,
        `  Decorations: ${gitConfig.decorations.enabled}`,
        '',
      ].join('\n');

      console.log(configInfo);
      appShell.window.showInformationMessage(
        'Git configuration displayed in console. Check the developer tools.'
      );
    } catch (error) {
      console.error('Failed to show configuration:', error);
      appShell.window.showErrorMessage('Failed to display Git configuration');
    }
  }

  dispose(): void {
    console.log('GitConfigManager disposed');
  }
}
