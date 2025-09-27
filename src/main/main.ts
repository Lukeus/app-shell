import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import { WindowManager } from './window-manager';
import { ExtensionManager } from './extension-manager';
import { SettingsManager } from './settings-manager';
import { MockTerminalManager } from './mock-terminal-manager';
import { WebTerminalManager } from './web-terminal-manager';
import { IPCManager } from './ipc-manager';
import { CommandManager } from './managers/command-manager';
import { Logger } from './logger';
import { Platform } from '../types';

class AppShell {
  private windowManager: WindowManager;
  private extensionManager: ExtensionManager;
  private settingsManager: SettingsManager;
  private terminalManager: any; // TerminalManager | MockTerminalManager | WebTerminalManager
  private ipcManager: IPCManager;
  private commandManager: CommandManager;
  private logger: Logger;
  private platform: Platform;

  constructor() {
    this.platform = process.platform as Platform;
    this.logger = new Logger('AppShell');

    // Initialize managers
    this.settingsManager = new SettingsManager();
    this.windowManager = new WindowManager(this.settingsManager);
    this.extensionManager = new ExtensionManager(this.settingsManager);
    // Initialize terminal manager with fallback
    try {
      const { TerminalManager } = require('./terminal-manager');
      this.terminalManager = new TerminalManager();
      this.logger.info('Using node-pty TerminalManager');
    } catch (error) {
      this.logger.warn('TerminalManager (node-pty) initialization failed, using WebTerminalManager fallback', error);
      this.terminalManager = new WebTerminalManager();
    }
    this.ipcManager = new IPCManager();
    this.commandManager = new CommandManager(this.logger);

    this.setupAppEventListeners();
    this.setupIPCHandlers();
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing App Shell...');

      // Initialize settings
      await this.settingsManager.init();

      // Create main window
      await this.windowManager.createMainWindow();
      
      // Set main window reference in terminal manager if it's WebTerminalManager
      if (this.terminalManager instanceof WebTerminalManager) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
          this.terminalManager.setMainWindow(mainWindow);
        }
      }

      // Initialize extensions
      await this.extensionManager.init();

      // Setup application menu
      this.setupApplicationMenu();

      this.logger.info('App Shell initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize App Shell', error);
      throw error;
    }
  }

  private setupAppEventListeners(): void {
    app.whenReady().then(() => this.init());

    app.on('window-all-closed', () => {
      // On macOS, keep the app running even when all windows are closed
      if (this.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', async () => {
      // On macOS, re-create a window when the dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.windowManager.createMainWindow();
      }
    });

    app.on('before-quit', async _event => {
      try {
        // Save application state
        await this.settingsManager.saveAppState();

        // Dispose of all terminals
        this.terminalManager.disposeAll();

        // Dispose of extensions
        await this.extensionManager.dispose();

        // Dispose of command manager
        this.commandManager.dispose();
      } catch (error) {
        this.logger.error('Error during app shutdown', error);
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });

      contents.on('will-navigate', (navigationEvent, url) => {
        const parsedUrl = new URL(url);

        // Allow navigation to localhost in development
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (isDevelopment && parsedUrl.hostname === 'localhost') {
          return;
        }

        // Prevent navigation to external URLs
        navigationEvent.preventDefault();
      });
    });
  }

  private setupIPCHandlers(): void {
    // Window management
    this.ipcManager.handle('window:minimize', () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.minimize();
      }
    });

    this.ipcManager.handle('window:maximize', () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        if (focusedWindow.isMaximized()) {
          focusedWindow.unmaximize();
        } else {
          focusedWindow.maximize();
        }
      }
    });

    this.ipcManager.handle('window:close', () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.close();
      }
    });

    // Settings management
    this.ipcManager.handle('settings:get', async (event, key: string) => {
      return this.settingsManager.get(key);
    });

    this.ipcManager.handle('settings:set', async (event, key: string, value: any) => {
      await this.settingsManager.set(key, value);
    });

    this.ipcManager.handle('settings:getAll', async _event => {
      return this.settingsManager.getAll();
    });

    // Terminal management
    this.ipcManager.handle('terminal:create', async (event, options?: any) => {
      return this.terminalManager.createTerminal(options);
    });

    this.ipcManager.handle('terminal:write', async (event, terminalId: string, data: string) => {
      this.terminalManager.writeToTerminal(terminalId, data);
    });

    this.ipcManager.handle(
      'terminal:resize',
      async (event, terminalId: string, cols: number, rows: number) => {
        this.terminalManager.resizeTerminal(terminalId, cols, rows);
      }
    );

    this.ipcManager.handle('terminal:kill', async (event, terminalId: string) => {
      this.terminalManager.killTerminal(terminalId);
    });

    // Extension management
    this.ipcManager.handle('extensions:getAll', async _event => {
      return this.extensionManager.getAllExtensions();
    });

    this.ipcManager.handle('extensions:enable', async (event, extensionId: string) => {
      await this.extensionManager.enableExtension(extensionId);
    });

    this.ipcManager.handle('extensions:disable', async (event, extensionId: string) => {
      await this.extensionManager.disableExtension(extensionId);
    });

    this.ipcManager.handle('extensions:install', async (event, extensionPath: string) => {
      return this.extensionManager.installExtension(extensionPath);
    });

    this.ipcManager.handle('extensions:uninstall', async (event, extensionId: string) => {
      await this.extensionManager.uninstallExtension(extensionId);
    });

    // Theme management
    this.ipcManager.handle('theme:getAll', async _event => {
      return this.extensionManager.getAllThemes();
    });

    this.ipcManager.handle('theme:apply', async (event, themeId: string) => {
      await this.extensionManager.applyTheme(themeId);
    });

    // Command execution is handled by CommandManager

    // File system operations
    this.ipcManager.handle('fs:showOpenDialog', async (options: any) => {
      const result = await dialog.showOpenDialog(options);
      return result;
    });

    this.ipcManager.handle('fs:showSaveDialog', async (options: any) => {
      const result = await dialog.showSaveDialog(options);
      return result;
    });

    // Platform information
    this.ipcManager.handle('app:getPlatform', () => {
      return {
        platform: this.platform,
        arch: process.arch,
        version: app.getVersion(),
        name: app.getName(),
        isPackaged: app.isPackaged,
      };
    });

    // Application control
    this.ipcManager.handle('app:quit', () => {
      app.quit();
    });

    this.ipcManager.handle('app:restart', () => {
      app.relaunch();
      app.quit();
    });
  }

  private setupApplicationMenu(): void {
    // Create a simplified menu to avoid complex TypeScript template issues
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Quit',
            accelerator: this.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'close' }],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: async () => {
              await shell.openExternal('https://github.com/your-org/app-shell');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as Electron.MenuItemConstructorOptions[]);
    Menu.setApplicationMenu(menu);
  }
}

// Create and initialize app instance
new AppShell();

// Handle any uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
