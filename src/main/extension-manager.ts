import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { app, BrowserWindow } from 'electron';
import { pathToFileURL } from 'url';
import {
  Extension,
  Theme,
  CommandRegistration,
  ExtensionContext,
  StateManager,
  AppError,
  ExtensionActivationEvent,
} from '../types';
import {
  ExtensionManifest,
  validateExtensionManifest,
  safeParseTheme,
  SettingsValue,
} from '../schemas';
import { SettingsManager } from './settings-manager';
import { Logger } from './logger';

// Extension runtime context implementation
class ExtensionStateManager implements StateManager {
  private data: Map<string, SettingsValue> = new Map();
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.loadFromFile();
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.data.has(key) ? (this.data.get(key) as T) : defaultValue;
  }

  async update(key: string, value: SettingsValue): Promise<void> {
    this.data.set(key, value);
    await this.saveToFile();
  }

  keys(): readonly string[] {
    return Array.from(this.data.keys());
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(content);
        this.data = new Map(Object.entries(parsed));
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Ignore errors, start with empty state
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const obj = Object.fromEntries(this.data);
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf8');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Ignore save errors
    }
  }
}

interface LoadedExtension {
  extension: Extension;
  context: ExtensionContext;
  module?: {
    activate?: (context: ExtensionContext) => Promise<void> | void;
    deactivate?: () => Promise<void> | void;
    [key: string]: unknown;
  };
  isActive: boolean;
  activationEvents: string[];
}

export class ExtensionManager {
  private logger: Logger;
  private settingsManager: SettingsManager;
  private extensions: Map<string, LoadedExtension> = new Map();
  private themes: Map<string, Theme> = new Map();
  private commands: Map<string, CommandRegistration> = new Map();
  private extensionsPath: string;
  private globalStoragePath: string;
  private workspaceStoragePath: string;

  constructor(settingsManager: SettingsManager) {
    this.logger = new Logger('ExtensionManager');
    this.settingsManager = settingsManager;

    // Set up extension paths
    const userDataPath = app.getPath('userData');
    this.extensionsPath = path.join(userDataPath, 'extensions');
    this.globalStoragePath = path.join(userDataPath, 'globalStorage');
    this.workspaceStoragePath = path.join(userDataPath, 'workspaceStorage');

    // Ensure directories exist
    this.ensureDirectories();
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing Extension Manager...');

      // Load built-in extensions and themes
      await this.loadBuiltinExtensions();

      // Discover and load installed extensions
      await this.discoverExtensions();

      // Load enabled extensions
      await this.loadEnabledExtensions();

      this.logger.info('Extension manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize extension manager', error);
      throw error;
    }
  }

  private ensureDirectories(): void {
    const dirs = [this.extensionsPath, this.globalStoragePath, this.workspaceStoragePath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async loadBuiltinExtensions(): Promise<void> {
    // Load built-in themes
    const darkTheme: Theme = {
      id: 'builtin.dark',
      name: 'Dark Theme',
      type: 'dark',
      colors: {
        'app.background': '#1e1e1e',
        'app.foreground': '#d4d4d4',
        'app.border': '#2d2d30',
        'panel.background': '#252526',
        'panel.foreground': '#cccccc',
        'terminal.background': '#1e1e1e',
        'terminal.foreground': '#d4d4d4',
        'button.background': '#0e639c',
        'button.foreground': '#ffffff',
        'button.hoverBackground': '#1177bb',
        'input.background': '#3c3c3c',
        'input.foreground': '#cccccc',
        'input.border': '#6c6c6c',
      },
    };

    const lightTheme: Theme = {
      id: 'builtin.light',
      name: 'Light Theme',
      type: 'light',
      colors: {
        'app.background': '#ffffff',
        'app.foreground': '#333333',
        'app.border': '#e1e4e8',
        'panel.background': '#f6f8fa',
        'panel.foreground': '#24292e',
        'terminal.background': '#ffffff',
        'terminal.foreground': '#333333',
        'button.background': '#0066cc',
        'button.foreground': '#ffffff',
        'button.hoverBackground': '#0052a3',
        'input.background': '#ffffff',
        'input.foreground': '#24292e',
        'input.border': '#d0d7de',
      },
    };

    this.themes.set(darkTheme.id, darkTheme);
    this.themes.set(lightTheme.id, lightTheme);

    // Register built-in commands
    await this.registerBuiltinCommands();

    this.logger.debug('Built-in extensions loaded');
  }

  private async registerBuiltinCommands(): Promise<void> {
    // Theme switching commands
    this.registerCommand({
      command: 'workbench.action.selectTheme',
      title: 'Preferences: Color Theme',
      category: 'Preferences',
      callback: async () => {
        // This will be handled by the command palette
        return this.getAllThemes();
      },
    });

    this.registerCommand({
      command: 'workbench.action.reloadWindow',
      title: 'Developer: Reload Window',
      category: 'Developer',
      callback: async () => {
        // Reload the renderer process
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window: Electron.BrowserWindow) => window.reload());
      },
    });

    this.registerCommand({
      command: 'workbench.action.toggleDevTools',
      title: 'Developer: Toggle Developer Tools',
      category: 'Developer',
      callback: async () => {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window: Electron.BrowserWindow) => {
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools();
          } else {
            window.webContents.openDevTools();
          }
        });
      },
    });

    // Marketplace commands
    this.registerCommand({
      command: 'marketplace.showMarketplace',
      title: 'Marketplace: Browse Extensions',
      category: 'Marketplace',
      callback: async () => {
        // This will be handled by the renderer to show the marketplace UI
        return { action: 'showMarketplace' };
      },
    });

    this.registerCommand({
      command: 'marketplace.showInstalled',
      title: 'Marketplace: Show Installed Extensions',
      category: 'Marketplace',
      callback: async () => {
        return { action: 'showInstalled' };
      },
    });

    this.registerCommand({
      command: 'marketplace.checkUpdates',
      title: 'Marketplace: Check for Updates',
      category: 'Marketplace',
      callback: async () => {
        return { action: 'checkUpdates' };
      },
    });

    // Sidebar navigation commands
    this.registerCommand({
      command: 'sidebar.toggleSidebar',
      title: 'View: Toggle Sidebar',
      category: 'View',
      callback: async () => {
        return { action: 'toggleSidebar' };
      },
    });

    this.registerCommand({
      command: 'sidebar.showExtensions',
      title: 'View: Show Extensions',
      category: 'View',
      callback: async () => {
        return { action: 'showExtensions' };
      },
    });

    this.registerCommand({
      command: 'sidebar.showMarketplace',
      title: 'View: Show Marketplace',
      category: 'View',
      callback: async () => {
        return { action: 'showMarketplace' };
      },
    });

    this.registerCommand({
      command: 'sidebar.showSettings',
      title: 'View: Show Settings',
      category: 'View',
      callback: async () => {
        return { action: 'showSettings' };
      },
    });

    // Panel commands
    this.registerCommand({
      command: 'panel.togglePanel',
      title: 'View: Toggle Panel',
      category: 'View',
      callback: async () => {
        return { action: 'togglePanel' };
      },
    });

    this.registerCommand({
      command: 'panel.showTerminal',
      title: 'Terminal: Show Terminal',
      category: 'Terminal',
      callback: async () => {
        return { action: 'showTerminal' };
      },
    });

    this.registerCommand({
      command: 'panel.hidePanel',
      title: 'View: Hide Panel',
      category: 'View',
      callback: async () => {
        return { action: 'hidePanel' };
      },
    });
  }

  private async discoverExtensions(): Promise<void> {
    try {
      if (!fs.existsSync(this.extensionsPath)) {
        this.logger.debug('Extensions directory does not exist, skipping discovery');
        return;
      }

      const items = fs.readdirSync(this.extensionsPath);
      for (const item of items) {
        const extensionPath = path.join(this.extensionsPath, item);
        const stat = fs.statSync(extensionPath);

        if (stat.isDirectory()) {
          try {
            await this.loadExtensionFromPath(extensionPath);
          } catch (error) {
            this.logger.error(`Failed to load extension from ${extensionPath}`, error);
          }
        }
      }

      this.logger.info(`Discovered ${this.extensions.size} extensions`);
    } catch (error) {
      this.logger.error('Failed to discover extensions', error);
    }
  }

  private async loadExtensionFromPath(extensionPath: string): Promise<void> {
    const manifestPath = path.join(extensionPath, 'package.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Extension manifest (package.json) not found');
    }

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Validate extension manifest
    this.validateExtensionManifest(manifest);

    const extension: Extension = {
      id: manifest.name,
      name: manifest.displayName || manifest.name,
      version: manifest.version,
      description: manifest.description || '',
      main: manifest.main || 'extension.js',
      contributes: manifest.contributes,
      author: manifest.author,
      repository: manifest.repository,
      license: manifest.license,
      keywords: manifest.keywords,
      engines: manifest.engines,
    };

    // Create extension context
    const context = this.createExtensionContext(extension, extensionPath);

    const loadedExtension: LoadedExtension = {
      extension,
      context,
      isActive: false,
      activationEvents: manifest.activationEvents || ['*'],
    };

    this.extensions.set(extension.id, loadedExtension);
    this.logger.debug(`Loaded extension: ${extension.name} (${extension.id})`);

    // Register contributed themes
    if (extension.contributes?.themes) {
      this.registerContributedThemes(extension.contributes.themes, extensionPath);
    }
  }

  private validateExtensionManifest(manifest: unknown): void {
    // Use Zod for validation - this will throw if invalid
    validateExtensionManifest(manifest);
    // Additional engine version compatibility check
    const parsedManifest = manifest as ExtensionManifest;
    if (parsedManifest.engines?.['app-shell']) {
      const requiredVersion = parsedManifest.engines['app-shell'];
      const currentVersion = '1.0.0'; // Would come from app.getVersion()

      if (!this.isVersionCompatible(currentVersion, requiredVersion)) {
        throw new Error(
          `Extension requires app-shell ${requiredVersion}, but ${currentVersion} is installed`
        );
      }
    }

    // Security validation
    this.validateExtensionSecurity(parsedManifest);
  }

  private isVersionCompatible(currentVersion: string, requiredVersion: string): boolean {
    // Simple version compatibility check
    // In a real implementation, this would use a proper semver library
    const parseVersion = (version: string) => {
      return version
        .replace(/[^\d.]/g, '')
        .split('.')
        .map(n => parseInt(n, 10));
    };

    const current = parseVersion(currentVersion);
    const required = parseVersion(requiredVersion);

    // Check major version compatibility
    return current[0] >= required[0];
  }

  private validateExtensionSecurity(manifest: ExtensionManifest): void {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      'eval(',
      'Function(',
      'process.exit',
      'require("child_process")',
      'require("fs")',
      '__dirname',
      '__filename',
    ];

    const manifestString = JSON.stringify(manifest);
    for (const pattern of suspiciousPatterns) {
      if (manifestString.includes(pattern)) {
        this.logger.warn(`Extension manifest contains potentially unsafe pattern: ${pattern}`);
      }
    }

    // Validate activation events
    if (manifest.activationEvents) {
      const allowedEvents = ['*', 'onCommand', 'onLanguage', 'onStartup'];
      for (const event of manifest.activationEvents) {
        const eventType = event.split(':')[0];
        if (!allowedEvents.includes(eventType)) {
          this.logger.warn(`Extension uses unknown activation event: ${event}`);
        }
      }
    }
  }

  // Validation is now handled by Zod schemas

  private createExtensionContext(extension: Extension, extensionPath: string): ExtensionContext {
    const globalStatePath = path.join(this.globalStoragePath, extension.id + '.json');
    const workspaceStatePath = path.join(this.workspaceStoragePath, extension.id + '.json');

    return {
      extensionId: extension.id,
      extensionPath,
      globalState: new ExtensionStateManager(globalStatePath),
      workspaceState: new ExtensionStateManager(workspaceStatePath),
      subscriptions: [],
    };
  }

  private registerContributedThemes(
    themes: { id: string; label: string; path: string }[],
    extensionPath: string
  ): void {
    for (const themeContrib of themes) {
      try {
        const themePath = path.join(extensionPath, themeContrib.path);
        if (fs.existsSync(themePath)) {
          const themeContent = fs.readFileSync(themePath, 'utf8');
          const rawTheme = JSON.parse(themeContent);

          // Validate and enhance theme data
          const themeResult = safeParseTheme({
            ...rawTheme,
            id: themeContrib.id,
            name: themeContrib.label,
          });

          if (themeResult.success) {
            const themeData = themeResult.data;
            // Ensure colors is properly typed
            if (themeData.colors && typeof themeData.colors === 'object') {
              this.themes.set(themeData.id, themeData as Theme);
              this.logger.info(`Registered theme: ${themeData.name} (${themeData.id})`);
            } else {
              this.logger.error(`Invalid theme colors format: ${themeContrib.id}`);
            }
          } else {
            this.logger.error(`Invalid theme format: ${themeContrib.id}`, themeResult.error);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to load theme: ${themeContrib.id}`, error);
      }
    }
  }

  private async loadEnabledExtensions(): Promise<void> {
    try {
      const settingsValue = await this.settingsManager.get('extensions.enabled');
      const enabledExtensions = Array.isArray(settingsValue) ? (settingsValue as string[]) : [];
      for (const extensionId of enabledExtensions) {
        await this.activateExtension(extensionId);
      }
    } catch (error) {
      this.logger.error('Failed to load enabled extensions', error);
    }
  }

  async activateExtension(extensionId: string): Promise<void> {
    const loadedExt = this.extensions.get(extensionId);
    if (!loadedExt) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (loadedExt.isActive) {
      this.logger.debug(`Extension already active: ${extensionId}`);
      return;
    }

    try {
      this.logger.info(`Activating extension: ${loadedExt.extension.name}`);

      // Load the extension module
      const extensionMainPath = path.join(
        loadedExt.context.extensionPath,
        loadedExt.extension.main
      );

      if (fs.existsSync(extensionMainPath)) {
        // Clear require cache to allow reloading
        delete require.cache[require.resolve(extensionMainPath)];

        let extensionModule;
        try {
          // Try ES modules first
          this.logger.debug(`Attempting to load ES module: ${extensionMainPath}`);
          extensionModule = await import(pathToFileURL(extensionMainPath).href);
          this.logger.info(`Successfully loaded ES module: ${extensionMainPath}`);
        } catch (esError) {
          try {
            // Fallback to CommonJS
            this.logger.debug(`ES module failed, trying CommonJS: ${extensionMainPath}`);
            extensionModule = require(extensionMainPath);
            this.logger.info(`Successfully loaded CommonJS module: ${extensionMainPath}`);
          } catch (cjsError) {
            this.logger.error(`Failed to load extension module: ${extensionMainPath}`, {
              esError: esError instanceof Error ? esError.message : String(esError),
              cjsError: cjsError instanceof Error ? cjsError.message : String(cjsError),
              path: extensionMainPath,
              exists: fs.existsSync(extensionMainPath),
            });
            throw cjsError;
          }
        }
        loadedExt.module = extensionModule;

        // Initialize extension API context
        this.initializeExtensionAPI(loadedExt.context, extensionModule);

        // Call activate function if it exists
        if (typeof extensionModule.activate === 'function') {
          await extensionModule.activate(loadedExt.context);
        }

        // Register contributed commands
        if (loadedExt.extension.contributes?.commands) {
          this.registerContributedCommands(
            loadedExt.extension.contributes.commands,
            extensionModule,
            loadedExt.context
          );
        }

        // Register contributed settings
        if (loadedExt.extension.contributes?.settings) {
          this.registerContributedSettings(
            loadedExt.extension.contributes.settings,
            loadedExt.context
          );
        }

        // Register contributed keybindings
        if (loadedExt.extension.contributes?.keybindings) {
          this.registerContributedKeybindings(
            loadedExt.extension.contributes.keybindings,
            loadedExt.context
          );
        }
      }

      loadedExt.isActive = true;
      this.logger.info(`Extension activated: ${loadedExt.extension.name}`);

      // Emit activation event
      this.emitActivationEvent({
        extensionId,
        activationEvent: 'manual',
      });

      // Emit general extension event
      this.emitExtensionEvent('stateChanged', {
        extensionId,
        state: 'activated',
        extension: loadedExt.extension,
      });
    } catch (error) {
      this.logger.error(`Failed to activate extension: ${extensionId}`, error);
      throw error;
    }
  }

  private registerContributedCommands(
    commands: { command: string; title: string; category?: string; icon?: string; when?: string }[],
    extensionModule: { [key: string]: unknown },
    _context: ExtensionContext
  ): void {
    for (const commandContrib of commands) {
      const handlerFn = extensionModule[commandContrib.command];
      const defaultCallback = (): never => {
        throw new Error(`Command handler not found: ${commandContrib.command}`);
      };

      let boundCallback: (...args: unknown[]) => unknown;
      if (typeof handlerFn === 'function') {
        // Cast function to known type before binding
        boundCallback = (handlerFn as (...args: unknown[]) => unknown).bind(extensionModule);
      } else {
        boundCallback = defaultCallback;
      }

      this.registerCommand({
        command: commandContrib.command,
        title: commandContrib.title,
        category: commandContrib.category,
        icon: commandContrib.icon,
        when: commandContrib.when,
        callback: boundCallback,
      });
    }
  }

  async deactivateExtension(extensionId: string): Promise<void> {
    const loadedExt = this.extensions.get(extensionId);
    if (!loadedExt || !loadedExt.isActive) {
      return;
    }

    try {
      this.logger.info(`Deactivating extension: ${loadedExt.extension.name}`);

      // Call deactivate function if it exists
      if (loadedExt.module && typeof loadedExt.module.deactivate === 'function') {
        await loadedExt.module.deactivate();
      }

      // Dispose of subscriptions
      loadedExt.context.subscriptions.forEach(sub => {
        if (typeof sub.dispose === 'function') {
          sub.dispose();
        }
      });
      loadedExt.context.subscriptions.length = 0;

      // Remove contributed commands
      if (loadedExt.extension.contributes?.commands) {
        for (const cmd of loadedExt.extension.contributes.commands) {
          this.commands.delete(cmd.command);
        }
      }

      loadedExt.isActive = false;
      loadedExt.module = undefined;

      this.logger.info(`Extension deactivated: ${loadedExt.extension.name}`);

      // Emit deactivation event
      this.emitExtensionEvent('stateChanged', {
        extensionId,
        state: 'deactivated',
        extension: loadedExt.extension,
      });
    } catch (error) {
      this.logger.error(`Failed to deactivate extension: ${extensionId}`, error);
      throw error;
    }
  }

  registerCommand(command: CommandRegistration): void {
    this.commands.set(command.command, command);
    this.logger.debug(`Registered command: ${command.command}`);
  }

  unregisterCommand(commandId: string): void {
    this.commands.delete(commandId);
    this.logger.debug(`Unregistered command: ${commandId}`);
  }

  // Public API methods
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values()).map(loaded => loaded.extension);
  }

  getActiveExtensions(): Extension[] {
    return Array.from(this.extensions.values())
      .filter(loaded => loaded.isActive)
      .map(loaded => loaded.extension);
  }

  async enableExtension(extensionId: string): Promise<void> {
    await this.activateExtension(extensionId);

    // Update enabled extensions list
    const settingsValue = await this.settingsManager.get('extensions.enabled');
    const enabled = Array.isArray(settingsValue) ? (settingsValue as string[]) : [];
    if (!enabled.includes(extensionId)) {
      enabled.push(extensionId);
      await this.settingsManager.set('extensions.enabled', enabled);
    }
  }

  async disableExtension(extensionId: string): Promise<void> {
    await this.deactivateExtension(extensionId);

    // Update enabled extensions list
    const settingsValue = await this.settingsManager.get('extensions.enabled');
    const enabled = Array.isArray(settingsValue) ? (settingsValue as string[]) : [];
    const index = enabled.indexOf(extensionId);
    if (index > -1) {
      enabled.splice(index, 1);
      await this.settingsManager.set('extensions.enabled', enabled);
    }
  }

  async installExtension(extensionPath: string): Promise<Extension> {
    this.logger.info(`Installing extension from: ${extensionPath}`);

    try {
      const sourcePath = path.resolve(extensionPath);

      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Extension path does not exist: ${extensionPath}`);
      }

      let workingPath = sourcePath;
      let tempExtractPath: string | null = null;

      // Handle ZIP files - extract them first
      if (path.extname(sourcePath).toLowerCase() === '.zip') {
        this.logger.info('Detected ZIP file, extracting...');
        tempExtractPath = path.join(require('os').tmpdir(), `extension-${Date.now()}`);
        await this.extractZipFile(sourcePath, tempExtractPath);
        workingPath = tempExtractPath;
      }

      try {
        // Read manifest to get extension info
        const manifestPath = path.join(workingPath, 'package.json');
        if (!fs.existsSync(manifestPath)) {
          throw new Error('Extension manifest (package.json) not found');
        }

        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        this.validateExtensionManifest(manifest);

        const extensionId = manifest.name;

        // Check if extension is already installed
        if (this.extensions.has(extensionId)) {
          throw new Error(`Extension already installed: ${extensionId}`);
        }

        // Create destination path
        const destPath = path.join(this.extensionsPath, extensionId);

        // Copy extension files
        await this.copyExtensionFiles(workingPath, destPath);

        // Load the extension
        await this.loadExtensionFromPath(destPath);

        // Add to installed extensions list
        const enabledSettings = await this.settingsManager.get('extensions.enabled');
        const enabledExtensions = Array.isArray(enabledSettings)
          ? (enabledSettings as string[])
          : [];
        if (!enabledExtensions.includes(extensionId)) {
          enabledExtensions.push(extensionId);
          await this.settingsManager.set('extensions.enabled', enabledExtensions);
        }

        const extension = this.extensions.get(extensionId)?.extension;
        if (!extension) {
          throw new Error('Failed to load installed extension');
        }

        // Automatically activate the extension after installation
        try {
          await this.activateExtension(extensionId);
          this.logger.info(`Extension activated automatically: ${extensionId}`);
        } catch (activationError) {
          this.logger.warn(
            `Extension installed but failed to activate: ${extensionId}`,
            activationError
          );
        }

        this.logger.info(`Extension installed successfully: ${extensionId}`);
        return extension;
      } finally {
        // Clean up temporary extraction directory
        if (tempExtractPath && fs.existsSync(tempExtractPath)) {
          await this.removeDirectory(tempExtractPath);
        }
      }
    } catch (error) {
      this.logger.error('Failed to install extension', error);
      throw error;
    }
  }
  async uninstallExtension(extensionId: string): Promise<void> {
    this.logger.info(`Uninstalling extension: ${extensionId}`);

    const loadedExt = this.extensions.get(extensionId);
    if (!loadedExt) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    try {
      // Deactivate first
      await this.disableExtension(extensionId);

      // Remove extension files from filesystem
      const extensionPath = path.join(this.extensionsPath, extensionId);
      if (fs.existsSync(extensionPath)) {
        await this.removeDirectory(extensionPath);
      }

      // Clean up storage
      const globalStatePath = path.join(this.globalStoragePath, extensionId + '.json');
      const workspaceStatePath = path.join(this.workspaceStoragePath, extensionId + '.json');

      if (fs.existsSync(globalStatePath)) {
        fs.unlinkSync(globalStatePath);
      }
      if (fs.existsSync(workspaceStatePath)) {
        fs.unlinkSync(workspaceStatePath);
      }

      // Remove from extensions map
      this.extensions.delete(extensionId);

      // Remove from enabled extensions list
      const enabledSettings = await this.settingsManager.get('extensions.enabled');
      const enabledExtensions = Array.isArray(enabledSettings) ? (enabledSettings as string[]) : [];
      const index = enabledExtensions.indexOf(extensionId);
      if (index > -1) {
        enabledExtensions.splice(index, 1);
        await this.settingsManager.set('extensions.enabled', enabledExtensions);
      }

      this.logger.info(`Extension uninstalled: ${extensionId}`);
    } catch (error) {
      this.logger.error(`Failed to uninstall extension: ${extensionId}`, error);
      throw error;
    }
  }

  getAllThemes(): Theme[] {
    const themes = Array.from(this.themes.values());
    this.logger.debug(`Returning ${themes.length} themes: ${themes.map(t => t.name).join(', ')}`);
    return themes;
  }

  async applyTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (theme) {
      await this.settingsManager.set('theme', themeId);
      this.logger.info(`Applied theme: ${theme.name}`);

      // Send theme data to all renderer processes
      this.emitExtensionEvent('themeChanged', {
        themeId,
        theme: {
          id: theme.id,
          name: theme.name,
          type: theme.type,
          colors: theme.colors,
        },
      });
    } else {
      this.logger.warn(`Theme not found: ${themeId}`);
      throw new Error(`Theme not found: ${themeId}`);
    }
  }

  getAllCommands(): CommandRegistration[] {
    return Array.from(this.commands.values());
  }

  async executeCommand(commandId: string, ...args: unknown[]): Promise<unknown> {
    const command = this.commands.get(commandId);
    if (command) {
      try {
        this.logger.debug(`Executing command: ${commandId}`);
        const result = await command.callback(...args);
        return result;
      } catch (error) {
        this.logger.error(`Command execution failed: ${commandId}`, error);
        throw error;
      }
    } else {
      const error = new Error(`Command not found: ${commandId}`) as AppError;
      error.code = 'COMMAND_NOT_FOUND';
      throw error;
    }
  }

  private emitActivationEvent(event: ExtensionActivationEvent): void {
    try {
      // Emit to all renderer processes
      const windows = BrowserWindow.getAllWindows();

      for (const window of windows) {
        if (window.webContents && !window.webContents.isDestroyed()) {
          window.webContents.send('extension:activated', event);
        }
      }

      this.logger.debug('Extension activation event emitted', event);
    } catch (error) {
      this.logger.error('Failed to emit extension activation event', error);
    }
  }

  emitExtensionEvent(eventType: string, data: unknown): void {
    try {
      const windows = BrowserWindow.getAllWindows();

      for (const window of windows) {
        if (window.webContents && !window.webContents.isDestroyed()) {
          window.webContents.send(`extension:${eventType}`, data);
        }
      }

      this.logger.debug(`Extension event emitted: ${eventType}`, data);
    } catch (error) {
      this.logger.error(`Failed to emit extension event: ${eventType}`, error);
    }
  }

  private async copyExtensionFiles(sourcePath: string, destPath: string): Promise<void> {
    const copyFile = util.promisify(fs.copyFile);
    const mkdir = util.promisify(fs.mkdir);
    const readdir = util.promisify(fs.readdir);
    const stat = util.promisify(fs.stat);

    const copyRecursive = async (src: string, dest: string): Promise<void> => {
      const stats = await stat(src);

      if (stats.isDirectory()) {
        await mkdir(dest, { recursive: true });
        const items = await readdir(src);

        for (const item of items) {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);
          await copyRecursive(srcPath, destPath);
        }
      } else {
        await copyFile(src, dest);
      }
    };

    await copyRecursive(sourcePath, destPath);
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    const rmdir = util.promisify(fs.rmdir);
    const unlink = util.promisify(fs.unlink);
    const readdir = util.promisify(fs.readdir);
    const stat = util.promisify(fs.stat);

    const removeRecursive = async (targetPath: string): Promise<void> => {
      const stats = await stat(targetPath);

      if (stats.isDirectory()) {
        const items = await readdir(targetPath);

        for (const item of items) {
          const itemPath = path.join(targetPath, item);
          await removeRecursive(itemPath);
        }

        await rmdir(targetPath);
      } else {
        await unlink(targetPath);
      }
    };

    await removeRecursive(dirPath);
  }

  private async extractZipFile(zipPath: string, extractPath: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const { promisify } = require('util');
    const { spawn } = require('child_process');

    // Create extraction directory
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      // Use PowerShell on Windows to extract ZIP
      if (process.platform === 'win32') {
        const powershellCmd = `Expand-Archive -Path "${zipPath}" -DestinationPath "${extractPath}" -Force`;
        const ps = spawn('powershell', ['-Command', powershellCmd], {
          stdio: 'pipe',
        });

        let errorOutput = '';
        ps.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        ps.on('close', (code: number) => {
          if (code === 0) {
            this.logger.info(`Successfully extracted ZIP to: ${extractPath}`);
            resolve();
          } else {
            reject(new Error(`ZIP extraction failed: ${errorOutput || 'Unknown error'}`));
          }
        });

        ps.on('error', (error: Error) => {
          reject(new Error(`Failed to start PowerShell: ${error.message}`));
        });
      } else {
        // Use unzip on Unix-like systems
        const unzip = spawn('unzip', ['-o', zipPath, '-d', extractPath], {
          stdio: 'pipe',
        });

        let errorOutput = '';
        unzip.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        unzip.on('close', (code: number) => {
          if (code === 0) {
            this.logger.info(`Successfully extracted ZIP to: ${extractPath}`);
            resolve();
          } else {
            reject(new Error(`ZIP extraction failed: ${errorOutput || 'Unknown error'}`));
          }
        });

        unzip.on('error', (error: Error) => {
          reject(new Error(`Failed to start unzip: ${error.message}`));
        });
      }
    });
  }

  private initializeExtensionAPI(
    context: ExtensionContext,
    extensionModule: { [key: string]: unknown }
  ): void {
    // Create a scoped API object for the extension
    const extensionAPI = {
      // Window API
      window: {
        showInformationMessage: (message: string) => {
          this.logger.info(`[${context.extensionId}] ${message}`);
          // Could be enhanced to show actual UI notifications
        },
        showWarningMessage: (message: string) => {
          this.logger.warn(`[${context.extensionId}] ${message}`);
        },
        showErrorMessage: (message: string) => {
          this.logger.error(`[${context.extensionId}] ${message}`);
        },
      },

      // Commands API
      commands: {
        registerCommand: (
          commandId: string,
          callback: (...args: unknown[]) => unknown,
          title?: string,
          category?: string
        ) => {
          const fullCommandId = `${context.extensionId}.${commandId}`;
          const commandRegistration = {
            command: fullCommandId,
            title: title || commandId,
            category: category || 'Extension',
            callback,
          };

          this.registerCommand(commandRegistration);

          // Create disposable
          const disposable = {
            dispose: () => {
              this.unregisterCommand(fullCommandId);
            },
          };

          context.subscriptions.push(disposable);
          return disposable;
        },

        executeCommand: async (commandId: string, ...args: unknown[]) => {
          return this.executeCommand(commandId, ...args);
        },
      },

      // Configuration API
      workspace: {
        getConfiguration: (section?: string) => {
          return {
            get: (key: string, defaultValue?: SettingsValue) => {
              const fullKey = section ? `${section}.${key}` : key;
              return this.settingsManager.get(fullKey) || defaultValue;
            },
            update: async (key: string, value: SettingsValue) => {
              const fullKey = section ? `${section}.${key}` : key;
              await this.settingsManager.set(fullKey, value);
            },
          };
        },
      },

      // Event API (simplified)
      events: {
        on: (event: string, callback: (...args: unknown[]) => void) => {
          // Store event listeners in context for cleanup
          interface EventSubscription {
            event: string;
            callback: (...args: unknown[]) => void;
            dispose: () => void;
          }

          if (!context.subscriptions.find(sub => (sub as EventSubscription).event === event)) {
            const disposable: EventSubscription = {
              event,
              callback,
              dispose: () => {
                // Remove event listener
              },
            };
            context.subscriptions.push(disposable);
          }
        },
      },
    };

    // Expose the API to the extension module
    if (extensionModule) {
      extensionModule.appShell = extensionAPI;
    }
  }

  private registerContributedSettings(
    settings: {
      key: string;
      type: string;
      default: unknown;
      title: string;
      description?: string;
    }[],
    context: ExtensionContext
  ): void {
    for (const setting of settings) {
      try {
        // Register the setting with the settings manager
        // This would extend the settings schema dynamically
        this.logger.debug(`Registered setting: ${setting.key} from ${context.extensionId}`);
      } catch (error) {
        this.logger.error(`Failed to register setting: ${setting.key}`, error);
      }
    }
  }

  private registerContributedKeybindings(
    keybindings: { command: string; key: string; when?: string }[],
    context: ExtensionContext
  ): void {
    for (const keybinding of keybindings) {
      try {
        // Register the keybinding with the keybinding manager
        // This would need a keybinding manager to be implemented
        this.logger.debug(
          `Registered keybinding: ${keybinding.key} -> ${keybinding.command} from ${context.extensionId}`
        );
      } catch (error) {
        this.logger.error(`Failed to register keybinding: ${keybinding.key}`, error);
      }
    }
  }

  async dispose(): Promise<void> {
    this.logger.info('Disposing extension manager...');

    // Deactivate all extensions
    for (const [extensionId] of this.extensions) {
      try {
        await this.deactivateExtension(extensionId);
      } catch (error) {
        this.logger.error(`Failed to deactivate extension during disposal: ${extensionId}`, error);
      }
    }

    this.extensions.clear();
    this.themes.clear();
    this.commands.clear();

    this.logger.info('Extension manager disposed');
  }
}
