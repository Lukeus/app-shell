import { contextBridge, ipcRenderer } from 'electron';
import {
  TerminalOptions,
  MarketplacePlugin,
  Extension,
  Theme,
  CommandRegistration,
  SettingsValue,
  Prompt,
  PromptCategory,
  PromptSearchQuery,
  PromptSearchResult,
  PromptImportOptions,
  PromptImportResult,
  PromptExportOptions,
  PromptExportResult,
  PromptRegistryConfig,
} from '../schemas';
import type { MarketplaceCategory, MarketplaceSearchResult } from '../types';
import type {
  ArchiveSpecKitWorkspaceInput,
  CreateSpecKitWorkspaceInput,
  SpecKitWorkspace,
  SpecKitWorkspaceKey,
  SpecKitWorkspaceMetadata,
} from '../common/spec-kit';

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

  // Extension events
  onExtensionEvent?: (callback: (event: { event: string; args: unknown[] }) => void) => void;
  removeExtensionEventListener?: (
    callback: (event: { event: string; args: unknown[] }) => void
  ) => void;

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

  // Prompt Registry
  searchPrompts: (query: PromptSearchQuery) => Promise<PromptSearchResult>;
  getPrompt: (id: string) => Promise<Prompt | null>;
  getAllPrompts: () => Promise<Prompt[]>;
  getPromptsByCategory: (categoryId: string) => Promise<Prompt[]>;
  getPromptCategories: () => Promise<PromptCategory[]>;
  getRecentPrompts: () => Promise<Prompt[]>;
  getFavoritePrompts: () => Promise<Prompt[]>;
  addPrompt: (prompt: Prompt) => Promise<void>;
  updatePrompt: (prompt: Prompt) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  togglePromptFavorite: (id: string) => Promise<boolean>;
  recordPromptUsage: (id: string) => Promise<void>;
  importFromFabric: (options: PromptImportOptions) => Promise<PromptImportResult>;
  exportPrompts: (options: PromptExportOptions) => Promise<PromptExportResult>;
  createPromptBackup: () => Promise<{ backupPath: string }>;
  getPromptConfig: () => Promise<PromptRegistryConfig>;
  updatePromptConfig: (config: Partial<PromptRegistryConfig>) => Promise<void>;
  selectImportSource: (options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<Electron.OpenDialogReturnValue>;
  selectExportTarget: (options?: {
    title?: string;
    defaultPath?: string;
  }) => Promise<Electron.OpenDialogReturnValue>;

  // Prompt Registry Events
  onPromptAdded?: (callback: (prompt: Prompt) => void) => void;
  onPromptUpdated?: (callback: (prompt: Prompt) => void) => void;
  onPromptRemoved?: (callback: (id: string) => void) => void;
  onPromptImportCompleted?: (callback: (result: PromptImportResult) => void) => void;
  onPromptExportCompleted?: (callback: (result: PromptExportResult) => void) => void;
  removePromptEventListener?: (eventType: string, callback: (...args: any[]) => void) => void;

  // Spec Kit Workspace Management
  listSpecKitWorkspaces: () => Promise<SpecKitWorkspace[]>;
  createSpecKitWorkspace: (input: CreateSpecKitWorkspaceInput) => Promise<SpecKitWorkspace>;
  getSpecKitWorkspace: (key: SpecKitWorkspaceKey) => Promise<SpecKitWorkspace | null>;
  updateSpecKitWorkspaceMetadata: (
    key: SpecKitWorkspaceKey,
    metadata: SpecKitWorkspaceMetadata
  ) => Promise<SpecKitWorkspace>;
  archiveSpecKitWorkspace: (
    input: ArchiveSpecKitWorkspaceInput
  ) => Promise<SpecKitWorkspace>;
  selectSpecKitWorkspace: (key: SpecKitWorkspaceKey) => Promise<SpecKitWorkspace>;
  getCurrentSpecKitWorkspace: () => Promise<SpecKitWorkspace | null>;
}

const extensionEventListeners = new Map<
  (event: { event: string; args: unknown[] }) => void,
  (event: Electron.IpcRendererEvent, data: { event: string; args: unknown[] }) => void
>();

// Helper wrapper to automatically throw on structured { error } responses
async function invokeSafe<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  const result = await ipcRenderer.invoke(channel, ...args);
  if (result && typeof result === 'object' && 'error' in result) {
    const err = (result as { error: { message?: string; code?: string; details?: unknown } }).error;
    const error = new Error(err.message || 'IPC Error');
    (error as Error & { code?: string; details?: unknown }).code = err.code;
    (error as Error & { code?: string; details?: unknown }).details = err.details;
    throw error;
  }
  return result as T;
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
  getSetting: (key: string) => invokeSafe('settings:get', { key }),
  setSetting: (key: string, value: SettingsValue) => invokeSafe('settings:set', { key, value }),
  getAllSettings: () => invokeSafe('settings:getAll', {}),

  // Terminal
  createTerminal: (options?: TerminalOptions) => invokeSafe('terminal:create', options || {}),
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
  getExtensions: () => ipcRenderer.invoke('extensions:getAll', {}),
  enableExtension: (extensionId: string) =>
    ipcRenderer.invoke('extensions:enable', { extensionId }),
  disableExtension: (extensionId: string) =>
    ipcRenderer.invoke('extensions:disable', { extensionId }),
  installExtension: (extensionPath: string) =>
    ipcRenderer.invoke('extensions:install', { extensionPath }),
  uninstallExtension: (extensionId: string) =>
    ipcRenderer.invoke('extensions:uninstall', { extensionId }),

  // Themes
  getThemes: () => ipcRenderer.invoke('theme:getAll', {}),
  applyTheme: (themeId: string) => ipcRenderer.invoke('theme:apply', { themeId }),

  // Commands
  executeCommand: (commandId: string, ...args: unknown[]) =>
    ipcRenderer.invoke('command:execute', { commandId, args }),
  getAllCommands: () => ipcRenderer.invoke('command:getAllCommands', {}),

  // Command palette toggle events from main
  onCommandPaletteToggle: (callback: () => void) => {
    ipcRenderer.on('commandPalette:toggle', callback);
  },
  removeCommandPaletteListener: (callback: () => void) => {
    ipcRenderer.removeListener('commandPalette:toggle', callback);
  },

  // Extension events from extensions
  onExtensionEvent: (callback: (event: { event: string; args: unknown[] }) => void) => {
    if (extensionEventListeners.has(callback)) {
      return;
    }

    const listener = (
      _ipcEvent: Electron.IpcRendererEvent,
      data: { event: string; args: unknown[] }
    ) => {
      callback(data);
    };

    extensionEventListeners.set(callback, listener);
    ipcRenderer.on('extension-event', listener);
  },
  removeExtensionEventListener: (callback: (event: { event: string; args: unknown[] }) => void) => {
    const listener = extensionEventListeners.get(callback);
    if (listener) {
      ipcRenderer.removeListener('extension-event', listener);
      extensionEventListeners.delete(callback);
    }
  },

  // File system
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('fs:showOpenDialog', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('fs:showSaveDialog', options),

  // File system operations
  readFile: (filePath: string) => invokeSafe('filesystem:readFile', { path: filePath }),
  readFileText: (filePath: string, encoding?: BufferEncoding) =>
    invokeSafe('filesystem:readFileText', { path: filePath, encoding }),
  writeFile: (filePath: string, data: Uint8Array) =>
    invokeSafe('filesystem:writeFile', { path: filePath, data }),
  writeFileText: (filePath: string, content: string, encoding?: BufferEncoding) =>
    invokeSafe('filesystem:writeFileText', { path: filePath, content, encoding }),
  createDirectory: (dirPath: string) => invokeSafe('filesystem:createDirectory', { path: dirPath }),
  deleteFile: (filePath: string) => invokeSafe('filesystem:deleteFile', { path: filePath }),
  deleteDirectory: (dirPath: string) => invokeSafe('filesystem:deleteDirectory', { path: dirPath }),
  exists: (filePath: string) => invokeSafe('filesystem:exists', { path: filePath }),
  stat: (filePath: string) => invokeSafe('filesystem:stat', { path: filePath }),
  readDirectory: (dirPath: string) => invokeSafe('filesystem:readDirectory', { path: dirPath }),
  getFileTree: (rootPath: string, depth?: number) =>
    invokeSafe('filesystem:getFileTree', { rootPath, depth }),
  rename: (oldPath: string, newPath: string) =>
    invokeSafe('filesystem:rename', { oldPath, newPath }),
  copyFile: (sourcePath: string, targetPath: string) =>
    invokeSafe('filesystem:copyFile', { sourcePath, targetPath }),
  getHomeDirectory: () => invokeSafe('filesystem:getHomeDirectory', {}),
  getPathSeparator: () => invokeSafe('filesystem:getPathSeparator', {}),
  joinPath: (...segments: string[]) => invokeSafe('filesystem:joinPath', { segments }),
  resolvePath: (filePath: string) => invokeSafe('filesystem:resolvePath', { path: filePath }),
  relativePath: (from: string, to: string) => invokeSafe('filesystem:relativePath', { from, to }),

  // Platform info
  getPlatformInfo: () => ipcRenderer.invoke('app:getPlatform'),

  // App control
  quitApp: () => ipcRenderer.invoke('app:quit'),
  restartApp: () => ipcRenderer.invoke('app:restart'),

  // Marketplace
  searchMarketplacePlugins: (query: unknown) => ipcRenderer.invoke('marketplace:search', query),
  getMarketplacePlugin: (pluginId: string) =>
    ipcRenderer.invoke('marketplace:getPlugin', { pluginId }),
  getMarketplaceCategories: () => ipcRenderer.invoke('marketplace:getCategories', {}),
  installMarketplacePlugin: (pluginId: string, version?: string) =>
    ipcRenderer.invoke('marketplace:install', { pluginId, version }),
  updateMarketplacePlugin: (pluginId: string) =>
    ipcRenderer.invoke('marketplace:update', { pluginId }),
  uninstallMarketplacePlugin: (pluginId: string) =>
    ipcRenderer.invoke('marketplace:uninstall', { pluginId }),
  getInstalledPlugins: () => ipcRenderer.invoke('marketplace:getInstalled', {}),
  checkPluginUpdates: () => ipcRenderer.invoke('marketplace:checkUpdates', {}),
  getPluginInstallationStatus: (pluginId: string) =>
    ipcRenderer.invoke('marketplace:getInstallationStatus', { pluginId }),

  // Prompt Registry
  searchPrompts: (query: PromptSearchQuery) =>
    invokeSafe('prompt-registry:search-prompts', { query }),
  getPrompt: (id: string) => invokeSafe('prompt-registry:get-prompt', { id }),
  getAllPrompts: () => invokeSafe('prompt-registry:get-all-prompts', {}),
  getPromptsByCategory: (categoryId: string) =>
    invokeSafe('prompt-registry:get-prompts-by-category', { categoryId }),
  getPromptCategories: () => invokeSafe('prompt-registry:get-categories', {}),
  getRecentPrompts: () => invokeSafe('prompt-registry:get-recent-prompts', {}),
  getFavoritePrompts: () => invokeSafe('prompt-registry:get-favorite-prompts', {}),
  addPrompt: (prompt: Prompt) => invokeSafe('prompt-registry:add-prompt', { prompt }),
  updatePrompt: (prompt: Prompt) => invokeSafe('prompt-registry:update-prompt', { prompt }),
  deletePrompt: (id: string) => invokeSafe('prompt-registry:delete-prompt', { id }),
  togglePromptFavorite: (id: string) => invokeSafe('prompt-registry:toggle-favorite', { id }),
  recordPromptUsage: (id: string) => invokeSafe('prompt-registry:record-usage', { id }),
  importFromFabric: (options: PromptImportOptions) =>
    invokeSafe('prompt-registry:import-from-fabric', { options }),
  exportPrompts: (options: PromptExportOptions) =>
    invokeSafe('prompt-registry:export-prompts', { options }),
  createPromptBackup: () => invokeSafe('prompt-registry:create-backup', {}),
  getPromptConfig: () => invokeSafe('prompt-registry:get-config', {}),
  updatePromptConfig: (config: Partial<PromptRegistryConfig>) =>
    invokeSafe('prompt-registry:update-config', { config }),
  selectImportSource: (options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => invokeSafe('prompt-registry:select-import-source', options || {}),
  selectExportTarget: (options?: { title?: string; defaultPath?: string }) =>
    invokeSafe('prompt-registry:select-export-target', options || {}),

  // Spec Kit Workspace Management
  listSpecKitWorkspaces: () => invokeSafe('specKit:listWorkspaces', {}),
  createSpecKitWorkspace: (input: CreateSpecKitWorkspaceInput) =>
    invokeSafe('specKit:createWorkspace', input),
  getSpecKitWorkspace: (key: SpecKitWorkspaceKey) =>
    invokeSafe('specKit:getWorkspace', { key }),
  updateSpecKitWorkspaceMetadata: (
    key: SpecKitWorkspaceKey,
    metadata: SpecKitWorkspaceMetadata
  ) => invokeSafe('specKit:updateWorkspaceMetadata', { key, metadata }),
  archiveSpecKitWorkspace: (input: ArchiveSpecKitWorkspaceInput) =>
    invokeSafe('specKit:archiveWorkspace', input),
  selectSpecKitWorkspace: (key: SpecKitWorkspaceKey) =>
    invokeSafe('specKit:selectWorkspace', { key }),
  getCurrentSpecKitWorkspace: () => invokeSafe('specKit:getCurrentWorkspace', {}),

  // Prompt Registry Events
  onPromptAdded: (callback: (prompt: Prompt) => void) => {
    ipcRenderer.on('prompt-registry:prompt-added', (event, data) => {
      callback(data);
    });
  },
  onPromptUpdated: (callback: (prompt: Prompt) => void) => {
    ipcRenderer.on('prompt-registry:prompt-updated', (event, data) => {
      callback(data);
    });
  },
  onPromptRemoved: (callback: (id: string) => void) => {
    ipcRenderer.on('prompt-registry:prompt-removed', (event, data) => {
      callback(data);
    });
  },
  onPromptImportCompleted: (callback: (result: PromptImportResult) => void) => {
    ipcRenderer.on('prompt-registry:import-completed', (event, data) => {
      callback(data);
    });
  },
  onPromptExportCompleted: (callback: (result: PromptExportResult) => void) => {
    ipcRenderer.on('prompt-registry:export-completed', (event, data) => {
      callback(data);
    });
  },
  removePromptEventListener: (eventType: string, callback: (...args: any[]) => void) => {
    const channel = `prompt-registry:${eventType}`;
    ipcRenderer.removeListener(channel, callback as any);
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definition for the global window object
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
