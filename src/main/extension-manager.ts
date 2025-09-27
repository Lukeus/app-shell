import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import {
  Extension,
  Theme,
  CommandRegistration,
  ExtensionContext,
  StateManager,
  AppError,
  ExtensionActivationEvent,
} from '../types';
import { SettingsManager } from './settings-manager';
import { Logger } from './logger';

// Extension runtime context implementation
class ExtensionStateManager implements StateManager {
  private data: Map<string, any> = new Map();
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.loadFromFile();
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  async update(key: string, value: any): Promise<void> {
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
    } catch (error) {
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
    } catch (error) {
      // Ignore save errors
    }
  }
}

interface LoadedExtension {
  extension: Extension;
  context: ExtensionContext;
  module?: any;
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
        const { BrowserWindow } = require('electron');
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window: any) => window.reload());
      },
    });

    this.registerCommand({
      command: 'workbench.action.toggleDevTools',
      title: 'Developer: Toggle Developer Tools',
      category: 'Developer',
      callback: async () => {
        const { BrowserWindow } = require('electron');
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window: any) => {
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools();
          } else {
            window.webContents.openDevTools();
          }
        });
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

  private validateExtensionManifest(manifest: any): void {
    const required = ['name', 'version'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Extension manifest missing required field: ${field}`);
      }
    }

    if (manifest.engines && manifest.engines['app-shell']) {
      // TODO: Validate engine version compatibility
    }
  }

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

  private registerContributedThemes(themes: any[], extensionPath: string): void {
    for (const themeContrib of themes) {
      try {
        const themePath = path.join(extensionPath, themeContrib.path);
        if (fs.existsSync(themePath)) {
          const themeContent = fs.readFileSync(themePath, 'utf8');
          const theme: Theme = JSON.parse(themeContent);
          theme.id = themeContrib.id;
          theme.name = themeContrib.label;
          this.themes.set(theme.id, theme);
          this.logger.debug(`Registered theme: ${theme.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to load theme: ${themeContrib.id}`, error);
      }
    }
  }

  private async loadEnabledExtensions(): Promise<void> {
    try {
      const enabledExtensions = (await this.settingsManager.get('extensions.enabled')) || [];
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

        const extensionModule = require(extensionMainPath);
        loadedExt.module = extensionModule;

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
      }

      loadedExt.isActive = true;
      this.logger.info(`Extension activated: ${loadedExt.extension.name}`);

      // Emit activation event
      this.emitActivationEvent({
        extensionId,
        activationEvent: 'manual',
      });
    } catch (error) {
      this.logger.error(`Failed to activate extension: ${extensionId}`, error);
      throw error;
    }
  }

  private registerContributedCommands(
    commands: any[],
    extensionModule: any,
    context: ExtensionContext
  ): void {
    for (const commandContrib of commands) {
      const callback =
        extensionModule[commandContrib.command] ||
        (() => {
          throw new Error(`Command handler not found: ${commandContrib.command}`);
        });

      this.registerCommand({
        command: commandContrib.command,
        title: commandContrib.title,
        category: commandContrib.category,
        icon: commandContrib.icon,
        when: commandContrib.when,
        callback: callback.bind(extensionModule),
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
    const enabled = (await this.settingsManager.get('extensions.enabled')) || [];
    if (!enabled.includes(extensionId)) {
      enabled.push(extensionId);
      await this.settingsManager.set('extensions.enabled', enabled);
    }
  }

  async disableExtension(extensionId: string): Promise<void> {
    await this.deactivateExtension(extensionId);

    // Update enabled extensions list
    const enabled = (await this.settingsManager.get('extensions.enabled')) || [];
    const index = enabled.indexOf(extensionId);
    if (index > -1) {
      enabled.splice(index, 1);
      await this.settingsManager.set('extensions.enabled', enabled);
    }
  }

  async installExtension(extensionPath: string): Promise<Extension> {
    this.logger.info(`Installing extension from: ${extensionPath}`);

    try {
      // Load extension temporarily to get its info
      const tempPath = path.resolve(extensionPath);
      await this.loadExtensionFromPath(tempPath);

      // TODO: Copy extension to extensions directory
      // TODO: Add to installed extensions list

      throw new Error('Extension installation not fully implemented yet');
    } catch (error) {
      this.logger.error('Failed to install extension', error);
      throw error;
    }
  }

  async uninstallExtension(extensionId: string): Promise<void> {
    this.logger.info(`Uninstalling extension: ${extensionId}`);

    // Deactivate first
    await this.disableExtension(extensionId);

    // Remove from extensions map
    this.extensions.delete(extensionId);

    // TODO: Remove extension files from filesystem
    // TODO: Clean up storage

    this.logger.info(`Extension uninstalled: ${extensionId}`);
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  async applyTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (theme) {
      await this.settingsManager.set('theme', themeId);
      this.logger.info(`Applied theme: ${theme.name}`);
    } else {
      this.logger.warn(`Theme not found: ${themeId}`);
      throw new Error(`Theme not found: ${themeId}`);
    }
  }

  getAllCommands(): CommandRegistration[] {
    return Array.from(this.commands.values());
  }

  async executeCommand(commandId: string, ...args: any[]): Promise<any> {
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
    // TODO: Implement event emission to renderer processes
    this.logger.debug('Extension activation event', event);
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
