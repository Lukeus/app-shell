import { contextBridge, ipcRenderer } from 'electron';
import {
  TerminalOptions,
  MarketplacePlugin,
  Extension,
  Theme,
  CommandRegistration,
  SettingsValue,
} from '../schemas';
import type { MarketplaceCategory, MarketplaceSearchResult } from '../types';

// Theme change event data interface
interface ThemeChangeData {
  themeId: string;
  theme: Theme;
}

// Define the API interface
interface TerminalInfo {
  id: string;
  title: string;
  pid: number;
  cwd: string;
}

interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
  homedir: string;
}

interface ElectronAPI {
  // Window controls
  windowControl: (action: string) => void;

  // Settings
  getSetting: (key: string) => Promise<SettingsValue>;
  setSetting: (key: string, value: SettingsValue) => Promise<void>;
  getAllSettings: () => Promise<Record<string, SettingsValue>>;

  // Terminal
  createTerminal: (options?: TerminalOptions) => Promise<TerminalInfo>;
  writeToTerminal: (terminalId: string, data: string) => void;
  resizeTerminal: (terminalId: string, cols: number, rows: number) => void;
  killTerminal: (terminalId: string) => void;
  onTerminalData: (terminalId: string, callback: (data: string) => void) => void;

  // Theme
  onThemeChange: (callback: (themeData: ThemeChangeData) => void) => void;

  // Extensions
  getExtensions: () => Promise<Extension[]>;
  enableExtension: (extensionId: string) => Promise<void>;
  disableExtension: (extensionId: string) => Promise<void>;
  installExtension: (extensionPath: string) => Promise<Extension>;
  uninstallExtension: (extensionId: string) => Promise<void>;

  // Themes
  getThemes: () => Promise<Theme[]>;
  applyTheme: (themeId: string) => Promise<void>;

  // Commands
  executeCommand: (commandId: string, ...args: unknown[]) => Promise<unknown>;
  getAllCommands: () => Promise<CommandRegistration[]>;

  // Command palette events
  onCommandPaletteToggle?: (callback: () => void) => void;
  removeCommandPaletteListener?: (callback: () => void) => void;

  // File system
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;

  // File system operations
  readFile: (filePath: string) => Promise<Uint8Array>;
  readFileText: (filePath: string, encoding?: BufferEncoding) => Promise<string>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
  writeFileText: (filePath: string, content: string, encoding?: BufferEncoding) => Promise<void>;
  createDirectory: (dirPath: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  deleteDirectory: (dirPath: string) => Promise<void>;
  exists: (filePath: string) => Promise<boolean>;
  stat: (filePath: string) => Promise<import('../types').FileStat>;
  readDirectory: (dirPath: string) => Promise<[string, import('../types').FileType][]>;
  getFileTree: (rootPath: string, depth?: number) => Promise<unknown>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  copyFile: (sourcePath: string, targetPath: string) => Promise<void>;
  getHomeDirectory: () => Promise<string>;
  getPathSeparator: () => Promise<string>;
  joinPath: (...segments: string[]) => Promise<string>;
  resolvePath: (filePath: string) => Promise<string>;
  relativePath: (from: string, to: string) => Promise<string>;

  // Platform info
  getPlatformInfo: () => Promise<PlatformInfo>;

  // App control
  quitApp: () => void;
  restartApp: () => void;

  // Marketplace
  searchMarketplacePlugins: (query: unknown) => Promise<MarketplaceSearchResult>;
  getMarketplacePlugin: (pluginId: string) => Promise<MarketplacePlugin | null>;
  getMarketplaceCategories: () => Promise<MarketplaceCategory[]>;
  installMarketplacePlugin: (pluginId: string, version?: string) => Promise<void>;
  updateMarketplacePlugin: (pluginId: string) => Promise<void>;
  uninstallMarketplacePlugin: (pluginId: string) => Promise<void>;
  getInstalledPlugins: () => Promise<MarketplacePlugin[]>;
  checkPluginUpdates: () => Promise<import('../types').PluginUpdate[]>;
  getPluginInstallationStatus: (
    pluginId: string
  ) => Promise<{ status: string; progress: number; error?: string }>;
}

// Create the API object
const electronAPI: ElectronAPI = {
  // Window controls
  windowControl: (action: string) => {
    switch (action) {
      case 'minimize':
        ipcRenderer.invoke('window:minimize');
        break;
      case 'maximize':
        ipcRenderer.invoke('window:maximize');
        break;
      case 'close':
        ipcRenderer.invoke('window:close');
        break;
    }
  },

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: SettingsValue) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // Terminal
  createTerminal: (options?: TerminalOptions) => ipcRenderer.invoke('terminal:create', options),
  writeToTerminal: (terminalId: string, data: string) => {
    ipcRenderer.invoke('terminal:write', terminalId, data);
  },
  resizeTerminal: (terminalId: string, cols: number, rows: number) => {
    ipcRenderer.invoke('terminal:resize', terminalId, cols, rows);
  },
  killTerminal: (terminalId: string) => {
    ipcRenderer.invoke('terminal:kill', terminalId);
  },
  onTerminalData: (terminalId: string, callback: (data: string) => void) => {
    ipcRenderer.on(`terminal:data:${terminalId}`, (event, data) => {
      callback(data);
    });
  },

  // Theme change listener
  onThemeChange: (callback: (themeData: ThemeChangeData) => void) => {
    ipcRenderer.on('extension:themeChanged', (event, data) => {
      callback(data);
    });
  },

  // Extensions
  getExtensions: () => ipcRenderer.invoke('extensions:getAll'),
  enableExtension: (extensionId: string) => ipcRenderer.invoke('extensions:enable', extensionId),
  disableExtension: (extensionId: string) => ipcRenderer.invoke('extensions:disable', extensionId),
  installExtension: (extensionPath: string) =>
    ipcRenderer.invoke('extensions:install', extensionPath),
  uninstallExtension: (extensionId: string) =>
    ipcRenderer.invoke('extensions:uninstall', extensionId),

  // Themes
  getThemes: () => ipcRenderer.invoke('theme:getAll'),
  applyTheme: (themeId: string) => ipcRenderer.invoke('theme:apply', themeId),

  // Commands
  executeCommand: (commandId: string, ...args: unknown[]) =>
    ipcRenderer.invoke('command:execute', commandId, ...args),
  getAllCommands: () => ipcRenderer.invoke('command:getAllCommands'),

  // Command palette toggle events from main
  onCommandPaletteToggle: (callback: () => void) => {
    ipcRenderer.on('commandPalette:toggle', callback);
  },
  removeCommandPaletteListener: (callback: () => void) => {
    ipcRenderer.removeListener('commandPalette:toggle', callback);
  },

  // File system
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('fs:showOpenDialog', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('fs:showSaveDialog', options),

  // File system operations
  readFile: (filePath: string) => ipcRenderer.invoke('filesystem:readFile', filePath),
  readFileText: (filePath: string, encoding?: BufferEncoding) =>
    ipcRenderer.invoke('filesystem:readFileText', filePath, encoding),
  writeFile: (filePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('filesystem:writeFile', filePath, data),
  writeFileText: (filePath: string, content: string, encoding?: BufferEncoding) =>
    ipcRenderer.invoke('filesystem:writeFileText', filePath, content, encoding),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('filesystem:createDirectory', dirPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('filesystem:deleteFile', filePath),
  deleteDirectory: (dirPath: string) => ipcRenderer.invoke('filesystem:deleteDirectory', dirPath),
  exists: (filePath: string) => ipcRenderer.invoke('filesystem:exists', filePath),
  stat: (filePath: string) => ipcRenderer.invoke('filesystem:stat', filePath),
  readDirectory: (dirPath: string) => ipcRenderer.invoke('filesystem:readDirectory', dirPath),
  getFileTree: (rootPath: string, depth?: number) =>
    ipcRenderer.invoke('filesystem:getFileTree', rootPath, depth),
  rename: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('filesystem:rename', oldPath, newPath),
  copyFile: (sourcePath: string, targetPath: string) =>
    ipcRenderer.invoke('filesystem:copyFile', sourcePath, targetPath),
  getHomeDirectory: () => ipcRenderer.invoke('filesystem:getHomeDirectory'),
  getPathSeparator: () => ipcRenderer.invoke('filesystem:getPathSeparator'),
  joinPath: (...segments: string[]) => ipcRenderer.invoke('filesystem:joinPath', ...segments),
  resolvePath: (filePath: string) => ipcRenderer.invoke('filesystem:resolvePath', filePath),
  relativePath: (from: string, to: string) =>
    ipcRenderer.invoke('filesystem:relativePath', from, to),

  // Platform info
  getPlatformInfo: () => ipcRenderer.invoke('app:getPlatform'),

  // App control
  quitApp: () => ipcRenderer.invoke('app:quit'),
  restartApp: () => ipcRenderer.invoke('app:restart'),

  // Marketplace
  searchMarketplacePlugins: (query: unknown) => ipcRenderer.invoke('marketplace:search', query),
  getMarketplacePlugin: (pluginId: string) => ipcRenderer.invoke('marketplace:getPlugin', pluginId),
  getMarketplaceCategories: () => ipcRenderer.invoke('marketplace:getCategories'),
  installMarketplacePlugin: (pluginId: string, version?: string) =>
    ipcRenderer.invoke('marketplace:install', pluginId, version),
  updateMarketplacePlugin: (pluginId: string) => ipcRenderer.invoke('marketplace:update', pluginId),
  uninstallMarketplacePlugin: (pluginId: string) =>
    ipcRenderer.invoke('marketplace:uninstall', pluginId),
  getInstalledPlugins: () => ipcRenderer.invoke('marketplace:getInstalled'),
  checkPluginUpdates: () => ipcRenderer.invoke('marketplace:checkUpdates'),
  getPluginInstallationStatus: (pluginId: string) =>
    ipcRenderer.invoke('marketplace:getInstallationStatus', pluginId),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definition for the global window object
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
