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
import { PathSecurity } from './ipc/path-security';
import { registerSettingsIPC } from './ipc/settings-ipc';
import { registerFilesystemIPC } from './ipc/filesystem-ipc';
import { registerCommandIPC } from './ipc/command-ipc';
import { registerTerminalIPC } from './ipc/terminal-ipc';
import { registerExtensionIPC } from './ipc/extension-ipc';
import { registerMarketplaceIPC } from './ipc/marketplace-ipc';
import { registerAppControlIPC } from './ipc/app-control-ipc';
import { getGlobalCapabilityEnforcer } from './ipc/capability-enforcer';

class AppShell {
  private windowManager: WindowManager;
  private extensionManager: ExtensionManager;
  private settingsManager: SettingsManager;
  private terminalManager: WebTerminalManager; // TerminalManager | MockTerminalManager | WebTerminalManager
  private ipcManager: IPCManager;
  private commandManager: CommandManager;
  private marketplaceService: MarketplaceService;
  private fileSystemManager: FileSystemManager;
  private logger: Logger;
  private platform: Platform;
  private pathSecurity: PathSecurity;

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
    this.commandManager = new CommandManager(this.logger, false); // Disable IPC - handled by modular system
    this.marketplaceService = new MarketplaceService(this.extensionManager, this.settingsManager);
    this.fileSystemManager = new FileSystemManager();

    // Initialize path security with default roots
    this.pathSecurity = new PathSecurity({
      workspaceRoots: [process.cwd()],
      allowedPaths: [],
      homeDirectory: this.fileSystemManager.getHomeDirectory(),
      tempDirectory: require('os').tmpdir(),
    });

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

      // Grant basic capabilities to the main renderer
      this.setupRendererCapabilities();

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
    // Use modular IPC registrars for better organization and security
    this.registerWindowIPC();
    this.registerSecureChannels();
  }

  private registerWindowIPC(): void {
    // Window management (low-risk, no validation needed)
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
  }

  private registerSecureChannels(): void {
    // Register all validated IPC channels with security controls
    registerSettingsIPC(this.ipcManager, this.logger, this.settingsManager);
    registerFilesystemIPC(this.ipcManager, this.logger, this.fileSystemManager, this.pathSecurity);
    registerCommandIPC(this.ipcManager, this.logger, this.extensionManager, this.commandManager);
    registerTerminalIPC(this.ipcManager, this.logger, this.terminalManager);
    registerExtensionIPC(this.ipcManager, this.logger, this.extensionManager);
    registerMarketplaceIPC(this.ipcManager, this.logger, this.marketplaceService);
    registerAppControlIPC(this.ipcManager, this.logger, this.platform);
  }

  private setupRendererCapabilities(): void {
    const enforcer = getGlobalCapabilityEnforcer();
    const mainWindow = this.windowManager.getMainWindow();

    if (mainWindow) {
      // Create permission context matching what the validator creates
      // The validator only sets sessionId and origin, others default to 'anonymous' and 'core'
      const rendererContext = {
        sessionId: mainWindow.webContents.id.toString(),
        // Don't set userId or extensionId - they default to 'anonymous' and 'core'
        origin: 'file://',
        timestamp: Date.now(),
      };

      // Grant basic capabilities needed for normal operation
      // Only grant low-risk capabilities by default
      enforcer.grantDefaultCapabilities(rendererContext, 'low');

      // Grant specific medium-risk capabilities that are essential for the main UI
      enforcer.grantCapability('settings.write', rendererContext);
      enforcer.grantCapability('terminal.create', rendererContext);
      enforcer.grantCapability('terminal.control', rendererContext);
      enforcer.grantCapability('extensions.manage', rendererContext);
      enforcer.grantCapability('extensions.install', rendererContext);

      this.logger.info('Granted default capabilities to main renderer');
    }
  }

  private getAccelerator(key: string): string {
    if (!key) return '';

    if (process.platform === 'darwin') {
      // Handle macOS-specific mappings
      return key
        .replace(/CommandOrControl\+/g, 'Command+')
        .replace(/Ctrl\+/g, 'Command+')
        .replace(/Alt\+/g, 'Option+');
    } else {
      // Handle Windows/Linux mappings
      return key
        .replace(/CommandOrControl\+/g, 'Control+')
        .replace(/Cmd\+/g, 'Control+')
        .replace(/Option\+/g, 'Alt+');
    }
  }

  private setupApplicationMenu(): void {
    // Create a simplified menu to avoid complex TypeScript template issues
    // Get all commands
    const allCommands = this.commandManager.getAllCommands();
    // First get commands with shortcuts for the Commands menu
    const commandsWithShortcuts = allCommands.filter(cmd => cmd.accelerator);

    // Create template
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Quit',
            accelerator: this.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: async () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (!focusedWindow) {
                app.quit();
                return;
              }

              const { response } = await dialog.showMessageBox(focusedWindow, {
                type: 'question',
                buttons: ['Yes', 'No'],
                defaultId: 1,
                title: 'Confirm Quit',
                message: 'Are you sure you want to quit?',
              });

              if (response === 0) {
                // Yes
                app.quit();
              }
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
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'close' }],
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
          { type: 'separator' },
          {
            label: 'Command Palette',
            accelerator: process.platform === 'darwin' ? 'Cmd+Shift+P' : 'Ctrl+Shift+P',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('commandPalette:toggle');
              }
            },
          },
          { type: 'separator' },
          ...commandsWithShortcuts
            .filter(cmd => cmd.category === 'View' && cmd.command !== 'view.commandPalette')
            .map(cmd => ({
              label: cmd.title,
              accelerator: this.getAccelerator(cmd.accelerator || ''),
              click: () => this.commandManager.executeCommand(cmd.command),
            })),
        ],
      },
      {
        label: 'Terminal',
        submenu: [
          ...commandsWithShortcuts
            .filter(cmd => cmd.category === 'Terminal')
            .map(cmd => ({
              label: cmd.title,
              accelerator: this.getAccelerator(cmd.accelerator || ''),
              click: () => this.commandManager.executeCommand(cmd.command),
            })),
        ],
      },
      {
        label: 'Theme',
        submenu: [
          ...commandsWithShortcuts
            .filter(cmd => cmd.category === 'Theme')
            .map(cmd => ({
              label: cmd.title,
              accelerator: this.getAccelerator(cmd.accelerator || ''),
              click: () => this.commandManager.executeCommand(cmd.command),
            })),
        ],
      },
      {
        label: 'Help',
        submenu: [
          ...commandsWithShortcuts
            .filter(
              cmd =>
                cmd.category === 'View' || cmd.category === 'Terminal' || cmd.category === 'Theme'
            )
            .map(cmd => ({
              label: cmd.title,
              accelerator: this.getAccelerator(cmd.accelerator || ''),
              click: () => this.commandManager.executeCommand(cmd.command),
            })),
          { type: 'separator' },
          {
            label: 'About',
            click: async () => {
              await shell.openExternal('https://github.com/your-org/app-shell');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
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
