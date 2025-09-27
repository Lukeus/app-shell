import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  // Window controls
  windowControl: (action: string) => void;

  // Settings
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;
  getAllSettings: () => Promise<Record<string, any>>;

  // Terminal
  createTerminal: (options?: any) => Promise<any>;
  writeToTerminal: (terminalId: string, data: string) => void;
  resizeTerminal: (terminalId: string, cols: number, rows: number) => void;
  killTerminal: (terminalId: string) => void;
  onTerminalData: (terminalId: string, callback: (data: string) => void) => void;

  // Extensions
  getExtensions: () => Promise<any[]>;
  enableExtension: (extensionId: string) => Promise<void>;
  disableExtension: (extensionId: string) => Promise<void>;
  installExtension: (extensionPath: string) => Promise<any>;
  uninstallExtension: (extensionId: string) => Promise<void>;

  // Themes
  getThemes: () => Promise<any[]>;
  applyTheme: (themeId: string) => Promise<void>;

  // Commands
  executeCommand: (commandId: string, ...args: any[]) => Promise<any>;
  getAllCommands: () => Promise<any[]>;

  // File system
  showOpenDialog: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;

  // Platform info
  getPlatformInfo: () => Promise<any>;

  // App control
  quitApp: () => void;
  restartApp: () => void;
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
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // Terminal
  createTerminal: (options?: any) => ipcRenderer.invoke('terminal:create', options),
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
  executeCommand: (commandId: string, ...args: any[]) =>
    ipcRenderer.invoke('command:execute', commandId, ...args),
  getAllCommands: () => ipcRenderer.invoke('command:getAllCommands'),

  // File system
  showOpenDialog: (options: any) => ipcRenderer.invoke('fs:showOpenDialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('fs:showSaveDialog', options),

  // Platform info
  getPlatformInfo: () => ipcRenderer.invoke('app:getPlatform'),

  // App control
  quitApp: () => ipcRenderer.invoke('app:quit'),
  restartApp: () => ipcRenderer.invoke('app:restart'),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definition for the global window object
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
