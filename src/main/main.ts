import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import { WindowManager } from './window-manager';
import { ExtensionManager } from './extension-manager';
import { SettingsManager } from './settings-manager';
import { WebTerminalManager } from './web-terminal-manager';
import { IPCManager } from './ipc-manager';
import { CommandManager } from './managers/command-manager';
import { MarketplaceService } from './marketplace-service';
import { FileSystemManager } from './file-system-manager';
import { Logger } from './logger';
import { Platform } from '../types';

class AppShell {
  private windowManager: WindowManager;
  private extensionManager: ExtensionManager;
  private settingsManager: SettingsManager;
  private terminalManager: any; // TerminalManager | MockTerminalManager | WebTerminalManager
  private ipcManager: IPCManager;
  private commandManager: CommandManager;
  private marketplaceService: MarketplaceService;
  private fileSystemManager: FileSystemManager;
  private logger: Logger;
  private platform: Platform;

  constructor() {
    this.platform = process.platform as Platform;
    this.logger = new Logger('AppShell');

    // Initialize managers
    this.settingsManager = new SettingsManager();
    this.windowManager = new WindowManager(this.settingsManager);
    this.extensionManager = new ExtensionManager(this.settingsManager);
    // Initialize terminal manager with WebTerminalManager (node-pty will be loaded dynamically in init)
    this.terminalManager = new WebTerminalManager();
    this.ipcManager = new IPCManager();
    this.commandManager = new CommandManager(this.logger);
    this.marketplaceService = new MarketplaceService(this.extensionManager, this.settingsManager);
    this.fileSystemManager = new FileSystemManager();

    this.setupAppEventListeners();
    this.setupIPCHandlers();
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing App Shell...');

      // Initialize settings
      await this.settingsManager.init();

      // Initialize file system manager
      await this.fileSystemManager.init();

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

      // Initialize marketplace service
      await this.marketplaceService.init();

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

        // Dispose of marketplace service
        await this.marketplaceService.dispose();

        // Dispose of command manager
        this.commandManager.dispose();

        // Dispose of file system manager
        await this.fileSystemManager.dispose();
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

    // Command execution is handled by CommandManager directly via IPC

    // File system operations
    this.ipcManager.handle('fs:showOpenDialog', async (options: any) => {
      const result = await dialog.showOpenDialog(options);
      return result;
    });

    this.ipcManager.handle('fs:showSaveDialog', async (options: any) => {
      const result = await dialog.showSaveDialog(options);
      return result;
    });

    // File system manager operations
    this.ipcManager.handle('filesystem:readFile', async (event, filePath: string) => {
      return this.fileSystemManager.readFile(filePath);
    });

    this.ipcManager.handle(
      'filesystem:readFileText',
      async (event, filePath: string, encoding?: BufferEncoding) => {
        return this.fileSystemManager.readFileText(filePath, encoding);
      }
    );

    this.ipcManager.handle(
      'filesystem:writeFile',
      async (event, filePath: string, data: Uint8Array) => {
        await this.fileSystemManager.writeFile(filePath, data);
      }
    );

    this.ipcManager.handle(
      'filesystem:writeFileText',
      async (event, filePath: string, content: string, encoding?: BufferEncoding) => {
        await this.fileSystemManager.writeFileText(filePath, content, encoding);
      }
    );

    this.ipcManager.handle('filesystem:createDirectory', async (event, dirPath: string) => {
      await this.fileSystemManager.createDirectory(dirPath);
    });

    this.ipcManager.handle('filesystem:deleteFile', async (event, filePath: string) => {
      await this.fileSystemManager.deleteFile(filePath);
    });

    this.ipcManager.handle('filesystem:deleteDirectory', async (event, dirPath: string) => {
      await this.fileSystemManager.deleteDirectory(dirPath);
    });

    this.ipcManager.handle('filesystem:exists', async (event, filePath: string) => {
      return this.fileSystemManager.exists(filePath);
    });

    this.ipcManager.handle('filesystem:stat', async (event, filePath: string) => {
      return this.fileSystemManager.stat(filePath);
    });

    this.ipcManager.handle('filesystem:readDirectory', async (event, dirPath: string) => {
      return this.fileSystemManager.readDirectory(dirPath);
    });

    this.ipcManager.handle(
      'filesystem:getFileTree',
      async (event, rootPath: string, depth?: number) => {
        return this.fileSystemManager.getFileTree(rootPath, depth);
      }
    );

    this.ipcManager.handle('filesystem:rename', async (event, oldPath: string, newPath: string) => {
      await this.fileSystemManager.rename(oldPath, newPath);
    });

    this.ipcManager.handle(
      'filesystem:copyFile',
      async (event, sourcePath: string, targetPath: string) => {
        await this.fileSystemManager.copyFile(sourcePath, targetPath);
      }
    );

    this.ipcManager.handle('filesystem:getHomeDirectory', () => {
      return this.fileSystemManager.getHomeDirectory();
    });

    this.ipcManager.handle('filesystem:getPathSeparator', () => {
      return this.fileSystemManager.getPathSeparator();
    });

    this.ipcManager.handle('filesystem:joinPath', (event, ...segments: string[]) => {
      return this.fileSystemManager.joinPath(...segments);
    });

    this.ipcManager.handle('filesystem:resolvePath', (event, filePath: string) => {
      return this.fileSystemManager.resolvePath(filePath);
    });

    this.ipcManager.handle('filesystem:relativePath', (event, from: string, to: string) => {
      return this.fileSystemManager.relativePath(from, to);
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

    // Marketplace management
    this.ipcManager.handle('marketplace:search', async (event, query) => {
      return this.marketplaceService.searchPlugins(query);
    });

    this.ipcManager.handle('marketplace:getPlugin', async (event, pluginId: string) => {
      return this.marketplaceService.getPlugin(pluginId);
    });

    this.ipcManager.handle('marketplace:getCategories', async _event => {
      return this.marketplaceService.getCategories();
    });

    this.ipcManager.handle(
      'marketplace:install',
      async (event, pluginId: string, version?: string) => {
        await this.marketplaceService.installPlugin(pluginId, version);
      }
    );

    this.ipcManager.handle('marketplace:update', async (event, pluginId: string) => {
      await this.marketplaceService.updatePlugin(pluginId);
    });

    this.ipcManager.handle('marketplace:uninstall', async (event, pluginId: string) => {
      await this.marketplaceService.uninstallPlugin(pluginId);
    });

    this.ipcManager.handle('marketplace:getInstalled', async _event => {
      return this.marketplaceService.getInstalledPlugins();
    });

    this.ipcManager.handle('marketplace:checkUpdates', async _event => {
      return this.marketplaceService.checkForUpdates();
    });

    this.ipcManager.handle('marketplace:getInstallationStatus', async (event, pluginId: string) => {
      return this.marketplaceService.getInstallationStatus(pluginId);
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
