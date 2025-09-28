/**
 * Command Manager
 *
 * Manages command registration, execution, and keybinding integration.
 * Provides a centralized system for handling all app commands.
 */

import { ipcMain, BrowserWindow, IpcMainInvokeEvent, dialog } from 'electron';
import { Command, CommandRegistration } from '../../types';
import { Logger } from '../logger';

export class CommandManager {
  private commands: Map<string, CommandRegistration> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupIPC();
    this.registerBuiltinCommands();
  }

  /**
   * Register a command with its handler
   */
  public registerCommand(
    command: Command & { accelerator?: string },
    callback: (...args: unknown[]) => Promise<unknown> | unknown
  ): void {
    // If there's an accelerator, register it as a menu shortcut
    if (command.accelerator) {
      // Register with menu
      this.logger.debug(
        `Registering accelerator: ${command.accelerator} for command: ${command.command}`
      );
    }
    const registration: CommandRegistration = {
      ...command,
      callback,
    };

    this.commands.set(command.command, registration);
    this.logger.info(`Registered command: ${command.command}`);
  }

  /**
   * Execute a command by ID
   */
  public async executeCommand(commandId: string, ...args: unknown[]): Promise<unknown> {
    const command = this.commands.get(commandId);
    if (!command) {
      const error = `Command '${commandId}' not found`;
      this.logger.error(error);
      throw new Error(error);
    }

    try {
      this.logger.debug(`Executing command: ${commandId}`, { args });
      return await command.callback(...args);
    } catch (error) {
      this.logger.error(`Failed to execute command '${commandId}':`, error);
      throw error;
    }
  }

  /**
   * Get all registered commands (filtered for display)
   */
  public getAllCommands(): Command[] {
    return Array.from(this.commands.values()).map(cmd => ({
      command: cmd.command,
      title: cmd.title,
      category: cmd.category,
      icon: cmd.icon,
      when: cmd.when,
    }));
  }

  /**
   * Get commands filtered by category
   */
  public getCommandsByCategory(category: string): Command[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Check if a command exists
   */
  public hasCommand(commandId: string): boolean {
    return this.commands.has(commandId);
  }

  /**
   * Unregister a command
   */
  public unregisterCommand(commandId: string): boolean {
    const removed = this.commands.delete(commandId);
    if (removed) {
      this.logger.info(`Unregistered command: ${commandId}`);
    }
    return removed;
  }

  /**
   * Clear all commands from a specific extension
   */
  public clearExtensionCommands(extensionId: string): void {
    const commandsToRemove: string[] = [];

    for (const [commandId, command] of this.commands) {
      // Check if command has extensionId property (it would need to be added to CommandRegistration)
      if (
        'extensionId' in command &&
        (command as { extensionId: string }).extensionId === extensionId
      ) {
        commandsToRemove.push(commandId);
      }
    }

    commandsToRemove.forEach(commandId => {
      this.unregisterCommand(commandId);
    });

    this.logger.info(`Cleared ${commandsToRemove.length} commands from extension: ${extensionId}`);
  }

  private setupIPC(): void {
    // Register IPC handlers directly without using IPCChannel interface
    ipcMain.handle(
      'command:execute',
      async (event: IpcMainInvokeEvent, commandId: string, ...args: unknown[]) => {
        return this.executeCommand(commandId, ...args);
      }
    );

    ipcMain.handle('command:getAllCommands', async () => {
      return this.getAllCommands();
    });

    ipcMain.handle('command:getByCategory', async (event: IpcMainInvokeEvent, category: string) => {
      return this.getCommandsByCategory(category);
    });

    this.logger.info('Command manager IPC channels registered');
  }

  private getKeybindingForPlatform(keybinding: string): string {
    // Replace Mod with the platform-specific modifier
    const platform = process.platform;
    const modKey = platform === 'darwin' ? 'Cmd' : 'Ctrl';
    return keybinding.replace('Mod', modKey);
  }

  private registerBuiltinCommands(): void {
    // Application commands
    // Don't register quit in command palette - handle it through menu only

    this.registerCommand(
      {
        command: 'app.reload',
        title: 'Reload Window',
        category: 'Application',
        icon: 'refresh',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.reload();
        }
      }
    );

    this.registerCommand(
      {
        command: 'app.toggleDevTools',
        title: 'Toggle Developer Tools',
        category: 'Application',
        icon: 'debug',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.toggleDevTools();
        }
      }
    );

    this.registerCommand(
      {
        command: 'app.about',
        title: 'About Application',
        category: 'Application',
        icon: 'info',
      },
      async () => {
        // Show about dialog - could be enhanced with a proper dialog
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.executeJavaScript(`
          alert('App Shell v1.0.0\\nBuilt with Electron and TypeScript');
        `);
        }
      }
    );

    // Window commands
    this.registerCommand(
      {
        command: 'window.minimize',
        title: 'Minimize Window',
        category: 'Window',
        icon: 'minimize',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.minimize();
        }
      }
    );

    this.registerCommand(
      {
        command: 'window.maximize',
        title: 'Maximize Window',
        category: 'Window',
        icon: 'maximize',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          if (focusedWindow.isMaximized()) {
            focusedWindow.unmaximize();
          } else {
            focusedWindow.maximize();
          }
        }
      }
    );

    this.registerCommand(
      {
        command: 'window.close',
        title: 'Close Window',
        category: 'Window',
        icon: 'close',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.close();
        }
      }
    );

    this.registerCommand(
      {
        command: 'window.toggleFullScreen',
        title: 'Toggle Full Screen',
        category: 'Window',
        icon: 'fullscreen',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      }
    );

    // Terminal commands
    this.registerCommand(
      {
        command: 'terminal.new',
        title: 'New Terminal',
        category: 'Terminal',
        icon: 'terminal',
        accelerator: 'CommandOrControl+Shift+T',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('terminal:create');
        }
      }
    );

    this.registerCommand(
      {
        command: 'terminal.clear',
        title: 'Clear Terminal',
        category: 'Terminal',
        icon: 'clear',
        accelerator: 'CommandOrControl+K',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('terminal:clear');
        }
      }
    );

    this.registerCommand(
      {
        command: 'terminal.killAll',
        title: 'Kill All Terminals',
        category: 'Terminal',
        icon: 'close-all',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('terminal:killAll');
        }
      }
    );

    // View commands
    this.registerCommand(
      {
        command: 'view.commandPalette',
        title: 'Show Command Palette',
        category: 'View',
        icon: 'search',
        accelerator:
          process.platform === 'darwin' ? 'CommandOrControl+Shift+P' : 'CommandOrControl+Shift+P',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('commandPalette:toggle');
        }
      }
    );

    this.registerCommand(
      {
        command: 'view.extensions',
        title: 'Show Extensions',
        category: 'View',
        icon: 'extensions',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('view:showExtensions');
        }
      }
    );

    this.registerCommand(
      {
        command: 'view.settings',
        title: 'Show Settings',
        category: 'View',
        icon: 'settings',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('view:showSettings');
        }
      }
    );

    // Theme commands
    this.registerCommand(
      {
        command: 'theme.selectLight',
        title: 'Light Theme',
        category: 'Theme',
        icon: 'sun',
        accelerator: 'CommandOrControl+Shift+L',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('theme:change', 'light');
        }
      }
    );

    this.registerCommand(
      {
        command: 'theme.selectDark',
        title: 'Dark Theme',
        category: 'Theme',
        icon: 'moon',
        accelerator: 'CommandOrControl+Shift+D',
      },
      async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('theme:change', 'dark');
        }
      }
    );

    // File commands
    this.registerCommand(
      {
        command: 'file.openFolder',
        title: 'Open Folder',
        category: 'File',
        icon: 'folder-open',
      },
      async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.webContents.send('folder:opened', result.filePaths[0]);
          }
        }
      }
    );

    this.logger.info(`Registered ${this.commands.size} built-in commands`);
  }

  public dispose(): void {
    // Remove IPC handlers
    ipcMain.removeHandler('command:execute');
    ipcMain.removeHandler('command:getAllCommands');
    ipcMain.removeHandler('command:getByCategory');

    this.commands.clear();
    this.logger.info('Command manager disposed');
  }
}
