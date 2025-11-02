import { execFile } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../logger';

const execFileAsync = promisify(execFile);

export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Lightweight wrapper for executing Git commands with consistent logging and error handling.
 */
export class GitCommandRunner {
  private logger: Logger;

  constructor(private readonly repositoryPath: string, logger?: Logger) {
    this.logger = logger ?? new Logger('GitCommandRunner');
  }

  async run(args: string[]): Promise<GitCommandResult> {
    try {
      this.logger.debug(`Executing git ${args.join(' ')} in ${this.repositoryPath}`);
      const { stdout, stderr } = await execFileAsync('git', args, {
        cwd: this.repositoryPath,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
      this.logger.error(`git ${args.join(' ')} failed`, err);
      return {
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? err.message,
        exitCode: typeof err.code === 'number' ? err.code : 1,
      };
    }
  }
}
