/**
 * Git Configuration Manager - Handles Git user configuration and settings
 */

import { GitService } from '../services/git-service';
import { appShell, ExtensionContext } from '../types';

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
      // In a real implementation, this would read from .gitconfig or git config
      // For now, we'll use extension settings as a fallback
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

  async ensureUserConfig(): Promise<boolean> {
    try {
      const userConfig = await this.getUserConfig();

      if (!userConfig.name || !userConfig.email) {
        const confirm = await appShell.window.showQuickPick(['Yes', 'Later'], {
          placeholder: 'Git user configuration is incomplete. Set it now?',
        });

        if (confirm === 'Yes') {
          const newConfig = await this.promptForUserConfig();
          if (newConfig) {
            await this.setUserConfig(newConfig);
            return true;
          }
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to ensure user config:', error);
      return false;
    }
  }

  async getRemoteConfigs(): Promise<GitRemoteConfig[]> {
    try {
      const remotes = await this.gitService.getRemotes();
      return remotes.map(remote => ({
        name: remote.name,
        url: remote.url,
      }));
    } catch (error) {
      console.error('Failed to get remote configs:', error);
      return [];
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
      const remotes = await this.getRemoteConfigs();
      const gitConfig = this.gitService.getConfig();

      const configInfo = [
        '=== Git Configuration ===',
        '',
        'User Configuration:',
        `  Name: ${userConfig.name || 'Not set'}`,
        `  Email: ${userConfig.email || 'Not set'}`,
        '',
        'Remote Repositories:',
        ...remotes.map(r => `  ${r.name}: ${r.url}`),
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
