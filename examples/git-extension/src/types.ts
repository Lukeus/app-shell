/**
 * Git extension types and interfaces
 */

export interface GitConfig {
  enabled: boolean;
  path: string;
  autoFetch: boolean;
  autoPush: boolean;
  confirmSync: boolean;
  defaultCloneDirectory: string;
  decorations: {
    enabled: boolean;
  };
}

export interface GitRepository {
  path: string;
  name: string;
  branch: string;
  remotes: GitRemote[];
  status: GitStatus;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push' | 'both';
}

export interface GitStatus {
  ahead: number;
  behind: number;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: GitFileStatus[];
  conflicted: GitFileStatus[];
}

export interface GitFileStatus {
  path: string;
  status: GitFileStatusType;
  staged: boolean;
  originalPath?: string; // For renames
}

export type GitFileStatusType =
  | 'M' // Modified
  | 'A' // Added
  | 'D' // Deleted
  | 'R' // Renamed
  | 'C' // Copied
  | 'U' // Unmerged
  | '??'; // Untracked

export interface GitCommit {
  hash: string;
  date: Date;
  message: string;
  author: GitAuthor;
  parents: string[];
}

export interface GitAuthor {
  name: string;
  email: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  ahead?: number;
  behind?: number;
}

export interface GitDiff {
  file: string;
  hunks: GitDiffHunk[];
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'context' | 'add' | 'delete';
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface GitCloneOptions {
  url: string;
  directory: string;
  depth?: number;
  branch?: string;
}

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

// App Shell API interface
export declare const appShell: {
  window: {
    showInformationMessage(message: string): void;
    showWarningMessage(message: string): void;
    showErrorMessage(message: string): void;
    showInputBox(options: { prompt: string; value?: string }): Promise<string | undefined>;
    showQuickPick<T>(items: T[], options?: { placeholder?: string }): Promise<T | undefined>;
  };
  commands: {
    registerCommand(
      commandId: string,
      callback: (...args: any[]) => any,
      title?: string,
      category?: string
    ): { dispose(): void };
    executeCommand(commandId: string, ...args: any[]): Promise<any>;
  };
  workspace: {
    getConfiguration(section?: string): {
      get<T>(key: string, defaultValue?: T): T;
      update(key: string, value: any): Promise<void>;
    };
    workspaceFolders: { uri: { fsPath: string } }[] | undefined;
    onDidChangeWorkspaceFolders(callback: () => void): { dispose(): void };
  };
  events: {
    on(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
  };
  fs: {
    readFile(path: string): Promise<Uint8Array>;
    writeFile(path: string, content: Uint8Array): Promise<void>;
    stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
    readdir(path: string): Promise<string[]>;
  };
};
