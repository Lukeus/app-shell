import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { Logger } from './logger';
import { FileSystemProvider, FileStat, FileType } from '../types';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const lstat = promisify(fs.lstat);

export interface FileItem {
  name: string;
  path: string;
  type: FileType;
  size: number;
  modified: number;
  isDirectory: boolean;
  isHidden: boolean;
  children?: FileItem[];
  isExpanded?: boolean;
}

export interface FileSystemWatcher {
  path: string;
  callback: (eventType: 'created' | 'modified' | 'deleted', filePath: string) => void;
}

export class FileSystemManager implements FileSystemProvider {
  private logger: Logger;
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private watcherCallbacks: Map<string, FileSystemWatcher[]> = new Map();

  constructor() {
    this.logger = new Logger('FileSystemManager');
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing File System Manager...');
      this.logger.info('File system manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize file system manager', error);
      throw error;
    }
  }

  /**
   * Reads the contents of a file
   */
  async readFile(filePath: string): Promise<Uint8Array> {
    try {
      this.validatePath(filePath);
      this.logger.debug(`Reading file: ${filePath}`);

      const buffer = await readFile(filePath);
      return new Uint8Array(buffer);
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw this.createFileSystemError('READ_FILE_FAILED', error as Error, filePath);
    }
  }

  /**
   * Reads the contents of a file as text
   */
  async readFileText(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    try {
      this.validatePath(filePath);
      this.logger.debug(`Reading file as text: ${filePath}`);

      const content = await readFile(filePath, encoding);
      return content;
    } catch (error) {
      this.logger.error(`Failed to read file as text: ${filePath}`, error);
      throw this.createFileSystemError('READ_FILE_FAILED', error as Error, filePath);
    }
  }

  /**
   * Writes data to a file
   */
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    try {
      this.validatePath(filePath);
      this.logger.debug(`Writing file: ${filePath}`);

      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      await this.ensureDirectory(parentDir);

      await writeFile(filePath, Buffer.from(data));
      this.logger.info(`File written successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error);
      throw this.createFileSystemError('WRITE_FILE_FAILED', error as Error, filePath);
    }
  }

  /**
   * Writes text to a file
   */
  async writeFileText(
    filePath: string,
    content: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<void> {
    try {
      this.validatePath(filePath);
      this.logger.debug(`Writing file as text: ${filePath}`);

      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      await this.ensureDirectory(parentDir);

      await writeFile(filePath, content, encoding);
      this.logger.info(`File written successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write file as text: ${filePath}`, error);
      throw this.createFileSystemError('WRITE_FILE_FAILED', error as Error, filePath);
    }
  }

  /**
   * Creates a directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      this.validatePath(dirPath);
      this.logger.debug(`Creating directory: ${dirPath}`);

      await mkdir(dirPath, { recursive: true });
      this.logger.info(`Directory created successfully: ${dirPath}`);
    } catch (error) {
      this.logger.error(`Failed to create directory: ${dirPath}`, error);
      throw this.createFileSystemError('CREATE_DIRECTORY_FAILED', error as Error, dirPath);
    }
  }

  /**
   * Deletes a file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      this.validatePath(filePath);
      this.logger.debug(`Deleting file: ${filePath}`);

      await unlink(filePath);
      this.logger.info(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error);
      throw this.createFileSystemError('DELETE_FILE_FAILED', error as Error, filePath);
    }
  }

  /**
   * Deletes a directory (recursively)
   */
  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      this.validatePath(dirPath);
      this.logger.debug(`Deleting directory: ${dirPath}`);

      await this.deleteDirectoryRecursive(dirPath);
      this.logger.info(`Directory deleted successfully: ${dirPath}`);
    } catch (error) {
      this.logger.error(`Failed to delete directory: ${dirPath}`, error);
      throw this.createFileSystemError('DELETE_DIRECTORY_FAILED', error as Error, dirPath);
    }
  }

  /**
   * Checks if a file or directory exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      this.validatePath(filePath);
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets file or directory statistics
   */
  async stat(filePath: string): Promise<FileStat> {
    try {
      this.validatePath(filePath);
      this.logger.debug(`Getting stats for: ${filePath}`);

      const stats = await lstat(filePath);

      let fileType = FileType.Unknown;
      if (stats.isFile()) {
        fileType = FileType.File;
      } else if (stats.isDirectory()) {
        fileType = FileType.Directory;
      } else if (stats.isSymbolicLink()) {
        fileType = FileType.SymbolicLink;
      }

      return {
        type: fileType,
        ctime: stats.ctimeMs,
        mtime: stats.mtimeMs,
        size: stats.size,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats for: ${filePath}`, error);
      throw this.createFileSystemError('STAT_FAILED', error as Error, filePath);
    }
  }

  /**
   * Reads directory contents
   */
  async readDirectory(dirPath: string): Promise<[string, FileType][]> {
    try {
      this.validatePath(dirPath);
      this.logger.debug(`Reading directory: ${dirPath}`);

      const entries = await readdir(dirPath, { withFileTypes: true });
      const result: [string, FileType][] = [];

      for (const entry of entries) {
        let fileType = FileType.Unknown;
        if (entry.isFile()) {
          fileType = FileType.File;
        } else if (entry.isDirectory()) {
          fileType = FileType.Directory;
        } else if (entry.isSymbolicLink()) {
          fileType = FileType.SymbolicLink;
        }

        result.push([entry.name, fileType]);
      }

      return result.sort((a, b) => {
        // Directories first, then files, both alphabetically
        if (a[1] === FileType.Directory && b[1] !== FileType.Directory) return -1;
        if (a[1] !== FileType.Directory && b[1] === FileType.Directory) return 1;
        return a[0].localeCompare(b[0]);
      });
    } catch (error) {
      this.logger.error(`Failed to read directory: ${dirPath}`, error);
      throw this.createFileSystemError('READ_DIRECTORY_FAILED', error as Error, dirPath);
    }
  }

  /**
   * Gets a detailed file tree for a directory
   */
  async getFileTree(rootPath: string, depth: number = 3): Promise<FileItem> {
    try {
      this.validatePath(rootPath);
      this.logger.debug(`Building file tree for: ${rootPath} (depth: ${depth})`);

      const fileStat = await this.stat(rootPath);
      const name = path.basename(rootPath) || rootPath;
      const isHidden = name.startsWith('.');

      const item: FileItem = {
        name,
        path: rootPath,
        type: fileStat.type,
        size: fileStat.size,
        modified: fileStat.mtime,
        isDirectory: fileStat.type === FileType.Directory,
        isHidden,
        isExpanded: false,
      };

      if (fileStat.type === FileType.Directory && depth > 0) {
        try {
          const entries = await this.readDirectory(rootPath);
          item.children = [];

          for (const [entryName] of entries) {
            const entryPath = path.join(rootPath, entryName);

            // Skip hidden files/directories unless they're important
            if (entryName.startsWith('.') && !this.isImportantHiddenFile(entryName)) {
              continue;
            }

            try {
              const childItem = await this.getFileTree(entryPath, depth - 1);
              item.children.push(childItem);
            } catch (error) {
              // Log but don't fail the entire operation for one bad file
              this.logger.warn(`Failed to process child item: ${entryPath}`, error);
            }
          }
        } catch (error) {
          // If we can't read the directory contents, still return the directory item
          this.logger.warn(`Could not read directory contents: ${rootPath}`, error);
        }
      }

      return item;
    } catch (error) {
      this.logger.error(`Failed to build file tree for: ${rootPath}`, error);
      throw this.createFileSystemError('FILE_TREE_FAILED', error as Error, rootPath);
    }
  }

  /**
   * Renames or moves a file/directory
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      this.validatePath(oldPath);
      this.validatePath(newPath);
      this.logger.debug(`Renaming: ${oldPath} -> ${newPath}`);

      // Ensure parent directory of new path exists
      const newParentDir = path.dirname(newPath);
      await this.ensureDirectory(newParentDir);

      await fs.promises.rename(oldPath, newPath);
      this.logger.info(`Renamed successfully: ${oldPath} -> ${newPath}`);
    } catch (error) {
      this.logger.error(`Failed to rename: ${oldPath} -> ${newPath}`, error);
      throw this.createFileSystemError('RENAME_FAILED', error as Error, oldPath);
    }
  }

  /**
   * Copies a file
   */
  async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    try {
      this.validatePath(sourcePath);
      this.validatePath(targetPath);
      this.logger.debug(`Copying file: ${sourcePath} -> ${targetPath}`);

      // Ensure parent directory of target exists
      const targetParentDir = path.dirname(targetPath);
      await this.ensureDirectory(targetParentDir);

      await fs.promises.copyFile(sourcePath, targetPath);
      this.logger.info(`File copied successfully: ${sourcePath} -> ${targetPath}`);
    } catch (error) {
      this.logger.error(`Failed to copy file: ${sourcePath} -> ${targetPath}`, error);
      throw this.createFileSystemError('COPY_FILE_FAILED', error as Error, sourcePath);
    }
  }

  /**
   * Watches a directory for changes
   */
  async watchDirectory(
    dirPath: string,
    callback: (eventType: 'created' | 'modified' | 'deleted', filePath: string) => void
  ): Promise<() => void> {
    try {
      this.validatePath(dirPath);
      this.logger.debug(`Setting up directory watcher: ${dirPath}`);

      const watcherKey = dirPath;

      // Store callback
      if (!this.watcherCallbacks.has(watcherKey)) {
        this.watcherCallbacks.set(watcherKey, []);
      }
      this.watcherCallbacks.get(watcherKey)!.push({ path: dirPath, callback });

      // Create watcher if it doesn't exist
      if (!this.watchers.has(watcherKey)) {
        const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
          if (!filename) return;

          const filePath = path.join(dirPath, filename);
          const callbacks = this.watcherCallbacks.get(watcherKey) || [];

          let mappedEventType: 'created' | 'modified' | 'deleted' = 'modified';
          if (eventType === 'rename') {
            // Check if file still exists to determine if it was created or deleted
            fs.access(filePath, fs.constants.F_OK, err => {
              mappedEventType = err ? 'deleted' : 'created';
              callbacks.forEach(w => w.callback(mappedEventType, filePath));
            });
            return;
          } else if (eventType === 'change') {
            mappedEventType = 'modified';
          }

          callbacks.forEach(w => w.callback(mappedEventType, filePath));
        });

        this.watchers.set(watcherKey, watcher);
      }

      // Return unwatch function
      return () => {
        const callbacks = this.watcherCallbacks.get(watcherKey) || [];
        const index = callbacks.findIndex(w => w.callback === callback);
        if (index >= 0) {
          callbacks.splice(index, 1);
        }

        // If no more callbacks, close the watcher
        if (callbacks.length === 0) {
          const watcher = this.watchers.get(watcherKey);
          if (watcher) {
            watcher.close();
            this.watchers.delete(watcherKey);
            this.watcherCallbacks.delete(watcherKey);
          }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to watch directory: ${dirPath}`, error);
      throw this.createFileSystemError('WATCH_FAILED', error as Error, dirPath);
    }
  }

  /**
   * Gets the home directory path
   */
  getHomeDirectory(): string {
    return os.homedir();
  }

  /**
   * Gets platform-appropriate path separator
   */
  getPathSeparator(): string {
    return path.sep;
  }

  /**
   * Joins path segments using proper platform separator
   */
  joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Resolves a path to absolute form
   */
  resolvePath(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * Gets the relative path from one path to another
   */
  relativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Private helper methods
   */
  private validatePath(filePath: string): void {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided');
    }

    // Prevent path traversal attacks
    const resolved = path.resolve(filePath);
    if (resolved.includes('..')) {
      throw new Error('Path traversal detected');
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private async deleteDirectoryRecursive(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await this.deleteDirectoryRecursive(entryPath);
      } else {
        await unlink(entryPath);
      }
    }

    await rmdir(dirPath);
  }

  private isImportantHiddenFile(filename: string): boolean {
    const important = [
      '.git',
      '.gitignore',
      '.gitmodules',
      '.vscode',
      '.env',
      '.env.local',
      '.dockerignore',
    ];
    return important.includes(filename);
  }

  private createFileSystemError(
    code: string,
    originalError: Error,
    filePath?: string
  ): Error & { code: string; path?: string } {
    const error = new Error(`${code}: ${originalError.message}`) as Error & {
      code: string;
      path?: string;
      originalError: Error;
    };
    error.code = code;
    error.originalError = originalError;
    if (filePath) {
      error.path = filePath;
    }
    return error;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.logger.info('Disposing file system manager...');

    // Close all watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }

    this.watchers.clear();
    this.watcherCallbacks.clear();

    this.logger.info('File system manager disposed');
  }
}
