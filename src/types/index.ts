// Platform detection
export type Platform = 'win32' | 'darwin' | 'linux';

// Extension system types
export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  main: string;
  contributes?: ExtensionContributes;
  author?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  engines?: {
    'app-shell'?: string;
  };
}

export interface ExtensionContributes {
  commands?: Command[];
  themes?: ThemeContribution[];
  settings?: SettingContribution[];
  menus?: MenuContribution[];
  keybindings?: KeybindingContribution[];
}

// Command system
export interface Command {
  command: string;
  title: string;
  category?: string;
  icon?: string;
  when?: string; // Context condition
  accelerator?: string; // Keyboard shortcut in Electron accelerator format
}

export interface CommandRegistration extends Command {
  callback: (...args: unknown[]) => Promise<unknown> | unknown;
}

// Theme system
export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'high-contrast';
  colors: ThemeColors;
  tokenColors?: TokenColor[];
}

export interface ThemeColors {
  // Application colors
  'app.background'?: string;
  'app.foreground'?: string;
  'app.border'?: string;

  // Panel colors
  'panel.background'?: string;
  'panel.foreground'?: string;
  'panel.border'?: string;

  // Button colors
  'button.background'?: string;
  'button.foreground'?: string;
  'button.hoverBackground'?: string;

  // Input colors
  'input.background'?: string;
  'input.foreground'?: string;
  'input.border'?: string;
  'input.focusBorder'?: string;

  // Terminal colors
  'terminal.background'?: string;
  'terminal.foreground'?: string;
  'terminal.cursor'?: string;
  'terminal.selection'?: string;

  // Activity bar colors
  'activityBar.background'?: string;
  'activityBar.foreground'?: string;
  'activityBar.border'?: string;

  // Status bar colors
  'statusBar.background'?: string;
  'statusBar.foreground'?: string;
  'statusBar.border'?: string;

  // Editor colors
  'editor.background'?: string;
  'editor.foreground'?: string;
  'editor.lineHighlightBackground'?: string;
  'editor.selection'?: string;

  // Sidebar colors
  'sideBar.background'?: string;
  'sideBar.foreground'?: string;
  'sideBar.border'?: string;

  // Tab colors
  'tab.activeBackground'?: string;
  'tab.activeForeground'?: string;
  'tab.inactiveBackground'?: string;
  'tab.inactiveForeground'?: string;
  'tab.border'?: string;

  [key: string]: string | undefined;
}

export interface TokenColor {
  name?: string;
  scope: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
}

export interface ThemeContribution {
  id: string;
  label: string;
  path: string;
}

// Settings system
export interface SettingContribution {
  key: string;
  type: 'boolean' | 'string' | 'number' | 'array' | 'object';
  default: unknown;
  title: string;
  description?: string;
  enum?: unknown[];
  enumDescriptions?: string[];
  scope?: 'application' | 'window' | 'resource';
  order?: number;
}

export interface SettingsSchema {
  [key: string]: SettingContribution;
}

// Menu system
export interface MenuContribution {
  commandPalette?: MenuItem[];
  'editor/context'?: MenuItem[];
  'explorer/context'?: MenuItem[];
  view?: MenuItem[];
  [key: string]: MenuItem[] | undefined;
}

export interface MenuItem {
  command: string;
  when?: string;
  group?: string;
  order?: number;
}

// Keybinding system
export interface KeybindingContribution {
  command: string;
  key: string;
  mac?: string;
  linux?: string;
  win?: string;
  when?: string;
}

// IPC Communication
export interface IPCChannel {
  name: string;
  handler: (event: Electron.IpcMainEvent, ...args: unknown[]) => Promise<unknown> | unknown;
}

export interface RendererIPCChannel {
  name: string;
  handler: (...args: unknown[]) => Promise<unknown> | unknown;
}

// Terminal system
export interface TerminalOptions {
  shell?: string;
  args?: string[];
  cwd?: string;
  env?: { [key: string]: string };
  cols?: number;
  rows?: number;
}

export interface TerminalInstance {
  id: string;
  title: string;
  pid: number;
  cwd: string;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: (signal?: string) => void;
  onData: (callback: (data: string) => void) => void;
  onExit: (callback: (exitCode: number, signal?: number) => void) => void;
}

// Window management
export interface WindowState {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isMaximized?: boolean;
  isFullScreen?: boolean;
  displayBounds?: Electron.Rectangle;
}

// Application state
export interface AppState {
  theme: string;
  settings: { [key: string]: unknown };
  windowState: WindowState;
  openTabs: string[];
  activeTab?: string;
  extensions: Extension[];
  enabledExtensions: string[];
}

// Extension API context
export interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  globalState: StateManager;
  workspaceState: StateManager;
  subscriptions: { dispose(): void }[];
}

export interface StateManager {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: unknown): Promise<void>;
  keys(): readonly string[];
}

// Activity bar
export interface ActivityBarItem {
  id: string;
  name: string;
  icon: string;
  badge?: string | number;
  viewContainer?: ViewContainer;
  command?: string;
}

export interface ViewContainer {
  id: string;
  title: string;
  icon: string;
  views: View[];
}

export interface View {
  id: string;
  name: string;
  when?: string;
  type: 'tree' | 'webview' | 'custom';
  webviewOptions?: {
    retainContextWhenHidden?: boolean;
    enableScripts?: boolean;
    localResourceRoots?: string[];
  };
}

// Events
export interface AppEvent<T = unknown> {
  type: string;
  data?: T;
  timestamp: number;
}

export type EventCallback<T = unknown> = (event: AppEvent<T>) => void;

// File system
export interface FileSystemProvider {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  createDirectory(path: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FileStat>;
  readDirectory(path: string): Promise<[string, FileType][]>;
}

export interface FileStat {
  type: FileType;
  ctime: number;
  mtime: number;
  size: number;
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

// Error handling
export interface AppError extends Error {
  code?: string;
  extensionId?: string;
  details?: unknown;
}

// Extension lifecycle
export interface ExtensionActivationEvent {
  extensionId: string;
  activationEvent: string;
}

// Plugin Marketplace
export interface MarketplacePlugin {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  longDescription?: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  publisher: string;
  category: string;
  tags: string[];
  icon?: string;
  screenshots?: string[];
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  license: string;
  engines: {
    'app-shell': string;
  };
  downloadCount: number;
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
  versions: MarketplacePluginVersion[];
  isInstalled?: boolean;
  installedVersion?: string;
  hasUpdate?: boolean;
}

export interface MarketplacePluginVersion {
  version: string;
  downloadUrl: string;
  size: number;
  changelog?: string;
  publishedAt: string;
  engines: {
    'app-shell': string;
  };
}

export interface MarketplaceSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  sortBy?: 'relevance' | 'name' | 'rating' | 'downloads' | 'updated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MarketplaceSearchResult {
  plugins: MarketplacePlugin[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  count: number;
}

export interface PluginInstallation {
  plugin: MarketplacePlugin;
  status: 'downloading' | 'extracting' | 'installing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface PluginUpdate {
  plugin: MarketplacePlugin;
  currentVersion: string;
  availableVersion: string;
  changelog?: string;
}

export interface MarketplaceRegistry {
  name: string;
  url: string;
  enabled: boolean;
  lastSync?: string;
}

export interface MarketplaceService {
  searchPlugins(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult>;
  getPlugin(pluginId: string): Promise<MarketplacePlugin | null>;
  getCategories(): Promise<MarketplaceCategory[]>;
  installPlugin(pluginId: string, version?: string): Promise<void>;
  updatePlugin(pluginId: string): Promise<void>;
  uninstallPlugin(pluginId: string): Promise<void>;
  checkForUpdates(): Promise<PluginUpdate[]>;
  getInstalledPlugins(): Promise<MarketplacePlugin[]>;
}

// Logging
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string | Error, ...args: unknown[]): void;
}

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
}

// Workspace management
export interface WorkspaceRepositoryStatus {
  branch: string;
  upstream?: string;
  ahead: number;
  behind: number;
  dirty: boolean;
  changedFiles: string[];
  lastChecked?: string;
}

export interface WorkspaceRepository {
  path: string;
  branch: string;
  serviceTokens?: Record<string, string>;
  status?: WorkspaceRepositoryStatus;
}

export type WorkspacePipelineStepType = 'applySpec' | 'applyCode';

export interface WorkspacePipelineStep {
  id: string;
  name: string;
  description?: string;
  type: WorkspacePipelineStepType;
  targetPath: string;
  content: string;
  encoding?: BufferEncoding;
  applyMode?: 'overwrite' | 'append' | 'patch';
  openInEditor?: boolean;
  openInPreview?: boolean;
}

export interface WorkspacePipeline {
  id: string;
  name: string;
  description?: string;
  steps: WorkspacePipelineStep[];
}

export interface WorkspaceMetadata {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  repository?: WorkspaceRepository;
  pipelines: WorkspacePipeline[];
  lastActiveAt?: string;
}
