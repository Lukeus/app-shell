import { shell } from 'electron';
import { Logger } from '../../logger';
import * as fs from 'fs/promises';

/**
 * Utility for safely opening files that belong to a workspace repository.
 */
export class GitFileOpener {
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger('GitFileOpener');
  }

  async openFile(absolutePath: string): Promise<void> {
    try {
      await fs.access(absolutePath);
    } catch (error) {
      this.logger.error(`Cannot open non-existent file: ${absolutePath}`, error as Error);
      throw error;
    }

    const result = await shell.openPath(absolutePath);
    if (result) {
      const error = new Error(result);
      this.logger.error(`Failed to open file ${absolutePath}`, error);
      throw error;
    }
  }
}
