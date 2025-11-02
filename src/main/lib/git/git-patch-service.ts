import { spawn } from 'child_process';
import { Logger } from '../../logger';

/**
 * Applies unified diff patches against a repository using `git apply`.
 */
export class GitPatchService {
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger('GitPatchService');
  }

  async applyPatch(repositoryPath: string, patch: string, args: string[] = []): Promise<void> {
    const commandArgs = ['apply', '--whitespace=nowarn', ...args];

    await new Promise<void>((resolve, reject) => {
      this.logger.debug(`Applying patch in ${repositoryPath}`);
      const child = spawn('git', commandArgs, {
        cwd: repositoryPath,
        windowsHide: true,
      });

      let stderr = '';

      child.stderr.on('data', chunk => {
        stderr += chunk.toString();
      });

      child.on('error', error => {
        this.logger.error('Failed to spawn git apply', error);
        reject(error);
      });

      child.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          const error = new Error(stderr || `git apply exited with code ${code}`);
          this.logger.error('git apply failed', error);
          reject(error);
        }
      });

      child.stdin.end(patch, 'utf-8');
    });
  }
}
