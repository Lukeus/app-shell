import * as path from 'path';
import { Logger } from '../logger';

export interface PathSecurityConfig {
  workspaceRoots: string[];
  allowedPaths: string[];
  homeDirectory: string;
  tempDirectory?: string;
}

/**
 * Enhanced path security guard ensuring filesystem access is scoped to allowed directories.
 * Prevents path traversal and enforces operation-based permissions.
 */
export class PathSecurity {
  private logger: Logger;
  private config: PathSecurityConfig;

  constructor(config: PathSecurityConfig) {
    this.logger = new Logger('PathSecurity');
    this.config = config;

    // Normalize all paths to absolute
    this.config.workspaceRoots = config.workspaceRoots.map(p => path.resolve(p));
    this.config.allowedPaths = config.allowedPaths.map(p => path.resolve(p));
    this.config.homeDirectory = path.resolve(config.homeDirectory);
    if (config.tempDirectory) {
      this.config.tempDirectory = path.resolve(config.tempDirectory);
    }
  }

  /**
   * Validates if a given path is allowed for access
   */
  public isAllowed(
    target: string,
    operation: 'read' | 'write' | 'delete' | 'execute' = 'read'
  ): boolean {
    try {
      const resolved = path.resolve(target);

      // Check for path traversal attempts
      if (this.containsTraversal(target)) {
        this.logger.warn(`Path traversal attempt: ${target}`);
        return false;
      }

      // Check workspace roots (primary allowlist)
      for (const root of this.config.workspaceRoots) {
        if (this.isPathWithinDirectory(resolved, root)) {
          return true;
        }
      }

      // Check additional allowed paths
      for (const allowedPath of this.config.allowedPaths) {
        if (this.isPathWithinDirectory(resolved, allowedPath)) {
          return true;
        }
      }

      // Home directory with restricted access
      if (this.isPathWithinDirectory(resolved, this.config.homeDirectory)) {
        if (operation === 'read') return true;

        // Allow write/delete only in safe subdirectories
        const safeSubdirs = ['.config', 'Documents', 'Downloads'];
        return safeSubdirs.some(subdir => {
          const subdirPath = path.join(this.config.homeDirectory, subdir);
          return this.isPathWithinDirectory(resolved, subdirPath);
        });
      }

      // Temp directory
      if (
        this.config.tempDirectory &&
        this.isPathWithinDirectory(resolved, this.config.tempDirectory)
      ) {
        return true;
      }

      this.logger.warn(`Path access denied: ${target} (${operation})`);
      return false;
    } catch (error) {
      this.logger.error(`Path validation error for ${target}:`, error);
      return false;
    }
  }

  public assertAllowed(
    target: string,
    operation: 'read' | 'write' | 'delete' | 'execute' = 'read'
  ): void {
    if (!this.isAllowed(target, operation)) {
      const resolved = path.resolve(target);
      throw Object.assign(new Error(`Path access denied: ${resolved} (${operation})`), {
        code: 'PATH_ACCESS_DENIED',
      });
    }
  }

  private isPathWithinDirectory(targetPath: string, directoryPath: string): boolean {
    const relative = path.relative(directoryPath, targetPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  private containsTraversal(inputPath: string): boolean {
    const dangerous = ['..', '~/', '\\..\\', '/./', '\\.\\'];
    return dangerous.some(pattern => inputPath.includes(pattern));
  }

  public updateWorkspaceRoots(newRoots: string[]): void {
    this.config.workspaceRoots = newRoots.map(p => path.resolve(p));
    this.logger.info(`Updated workspace roots: ${this.config.workspaceRoots.join(', ')}`);
  }
}

// Helper to filter arrays of paths (e.g., joinPath segments if needed later)
export function allAllowed(security: PathSecurity, paths: string[]): boolean {
  return paths.every(p => security.isAllowed(p));
}
