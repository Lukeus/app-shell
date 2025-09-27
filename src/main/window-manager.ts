import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { WindowState } from '../types';
import { SettingsManager } from './settings-manager';
import { Logger } from './logger';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private settingsManager: SettingsManager;
  private logger: Logger;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.logger = new Logger('WindowManager');
  }
  
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  async createMainWindow(): Promise<BrowserWindow> {
    try {
      const windowState = await this.restoreWindowState();

      this.mainWindow = new BrowserWindow({
        ...windowState,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready
        frame: false, // Custom title bar
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          preload: path.join(__dirname, '..', 'preload', 'preload.js'),
          webSecurity: true,
          allowRunningInsecureContent: false,
        },
        icon: this.getAppIcon(),
      });

      // Setup window event listeners
      this.setupWindowEventListeners();

      // Load the renderer
      await this.loadRenderer();

      // Show window when ready
      this.mainWindow.once('ready-to-show', () => {
        if (this.mainWindow) {
          this.mainWindow.show();

          // Focus window on Linux and Windows
          if (process.platform === 'linux' || process.platform === 'win32') {
            this.mainWindow.focus();
          }
        }
      });

      // Fallback: show window after 3 seconds if ready-to-show doesn't fire
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isVisible()) {
          this.logger.warn('Window not shown after 3s, forcing show');
          this.mainWindow.show();
          this.mainWindow.focus();
        }
      }, 3000);

      this.logger.info('Main window created successfully');
      return this.mainWindow;
    } catch (error) {
      this.logger.error('Failed to create main window', error);
      throw error;
    }
  }

  private async restoreWindowState(): Promise<WindowState> {
    const defaultState: WindowState = {
      width: 1200,
      height: 800,
    };

    try {
      const savedState = (await this.settingsManager.get('windowState')) as WindowState;

      if (!savedState) {
        // Center window on primary display
        const { workAreaSize } = screen.getPrimaryDisplay();
        return {
          ...defaultState,
          x: Math.round((workAreaSize.width - defaultState.width!) / 2),
          y: Math.round((workAreaSize.height - defaultState.height!) / 2),
        };
      }

      // Validate that the window position is still valid
      const displays = screen.getAllDisplays();
      const windowWithinDisplay = displays.some(display => {
        return (
          savedState.x! >= display.bounds.x &&
          savedState.y! >= display.bounds.y &&
          savedState.x! < display.bounds.x + display.bounds.width &&
          savedState.y! < display.bounds.y + display.bounds.height
        );
      });

      if (!windowWithinDisplay) {
        // If window is outside all displays, center it
        const { workAreaSize } = screen.getPrimaryDisplay();
        savedState.x = Math.round((workAreaSize.width - savedState.width!) / 2);
        savedState.y = Math.round((workAreaSize.height - savedState.height!) / 2);
      }

      return { ...defaultState, ...savedState };
    } catch (error) {
      this.logger.warn('Failed to restore window state, using defaults', error);
      return defaultState;
    }
  }

  private setupWindowEventListeners(): void {
    if (!this.mainWindow) return;

    // Save window state when it changes
    const saveState = () => {
      if (!this.mainWindow) return;

      const bounds = this.mainWindow.getBounds();
      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: this.mainWindow.isMaximized(),
        isFullScreen: this.mainWindow.isFullScreen(),
        displayBounds: screen.getPrimaryDisplay().bounds,
      };

      this.settingsManager.set('windowState', state).catch(error => {
        this.logger.error('Failed to save window state', error);
      });
    };

    // Debounce the save state function
    let saveStateTimeout: NodeJS.Timeout;
    const debouncedSaveState = () => {
      clearTimeout(saveStateTimeout);
      saveStateTimeout = setTimeout(saveState, 500);
    };

    this.mainWindow.on('resize', debouncedSaveState);
    this.mainWindow.on('move', debouncedSaveState);
    this.mainWindow.on('maximize', debouncedSaveState);
    this.mainWindow.on('unmaximize', debouncedSaveState);
    this.mainWindow.on('enter-full-screen', debouncedSaveState);
    this.mainWindow.on('leave-full-screen', debouncedSaveState);

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Prevent navigation
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      // Allow navigation in development
      if (process.env.NODE_ENV === 'development' && url.startsWith('http://localhost')) {
        return;
      }

      // Prevent all other navigation
      event.preventDefault();
    });

    // Security: prevent new window creation
    this.mainWindow.webContents.setWindowOpenHandler(_details => {
      return { action: 'deny' };
    });

    // Handle zoom factor for different platforms
    this.handleZoomFactor();
  }

  private async loadRenderer(): Promise<void> {
    if (!this.mainWindow) return;

    const isDevelopment = process.env.NODE_ENV === 'development';

    try {
      if (isDevelopment) {
        // In development, try to connect to webpack dev server first
        try {
          await this.mainWindow.loadURL('http://localhost:4000');
          this.logger.info('Loaded from webpack dev server');
        } catch (devServerError) {
          // If dev server is not available, fall back to built files
          this.logger.warn('Dev server not available, loading built files', devServerError);
          await this.mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
        }
      } else {
        // In production, load from built files
        await this.mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
      }
      
      // Open DevTools only if explicitly requested
      if (process.env.OPEN_DEVTOOLS === 'true' || process.argv.includes('--devtools')) {
        this.mainWindow.webContents.openDevTools();
        this.logger.info('DevTools opened as requested');
      }
    } catch (error) {
      this.logger.error('Failed to load renderer', error);
      throw error;
    }
  }

  private getAppIcon(): string | undefined {
    const platform = process.platform;
    const iconDir = path.join(__dirname, '..', '..', 'assets', 'icons');

    switch (platform) {
      case 'win32':
        return path.join(iconDir, 'icon.ico');
      case 'darwin':
        return path.join(iconDir, 'icon.icns');
      case 'linux':
        return path.join(iconDir, 'icon.png');
      default:
        return undefined;
    }
  }

  private handleZoomFactor(): void {
    if (!this.mainWindow) return;

    // Handle high DPI displays
    const currentDisplay = screen.getDisplayNearestPoint(this.mainWindow.getBounds());

    const scaleFactor = currentDisplay.scaleFactor;
    if (scaleFactor > 1) {
      // Adjust for high DPI
      this.mainWindow.webContents.setZoomFactor(1 / scaleFactor);
    }
  }

  async showMainWindow(): Promise<void> {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  async hideMainWindow(): Promise<void> {
    if (this.mainWindow && this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    }
  }

  async closeMainWindow(): Promise<void> {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  async minimizeMainWindow(): Promise<void> {
    if (this.mainWindow && this.mainWindow.isMinimizable()) {
      this.mainWindow.minimize();
    }
  }

  async maximizeMainWindow(): Promise<void> {
    if (this.mainWindow && this.mainWindow.isMaximizable()) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  async setFullScreen(fullScreen: boolean): Promise<void> {
    if (this.mainWindow) {
      this.mainWindow.setFullScreen(fullScreen);
    }
  }

  isMainWindowFocused(): boolean {
    return this.mainWindow ? this.mainWindow.isFocused() : false;
  }

  isMainWindowVisible(): boolean {
    return this.mainWindow ? this.mainWindow.isVisible() : false;
  }

  isMainWindowMaximized(): boolean {
    return this.mainWindow ? this.mainWindow.isMaximized() : false;
  }

  isMainWindowMinimized(): boolean {
    return this.mainWindow ? this.mainWindow.isMinimized() : false;
  }

  isMainWindowFullScreen(): boolean {
    return this.mainWindow ? this.mainWindow.isFullScreen() : false;
  }

  toggleDevTools(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.toggleDevTools();
      this.logger.info('DevTools toggled');
    }
  }

  openDevTools(): void {
    if (this.mainWindow && !this.mainWindow.webContents.isDevToolsOpened()) {
      this.mainWindow.webContents.openDevTools();
      this.logger.info('DevTools opened');
    }
  }

  closeDevTools(): void {
    if (this.mainWindow && this.mainWindow.webContents.isDevToolsOpened()) {
      this.mainWindow.webContents.closeDevTools();
      this.logger.info('DevTools closed');
    }
  }
}
