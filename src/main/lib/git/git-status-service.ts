import { Logger } from '../../logger';
import { GitCommandRunner } from './git-command-runner';

export interface GitStatusSummary {
  branch: string;
  upstream?: string;
  ahead: number;
  behind: number;
  dirty: boolean;
  changedFiles: string[];
}

/**
 * Provides convenience helpers for retrieving repository status information.
 */
export class GitStatusService {
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger('GitStatusService');
  }

  async getStatus(repositoryPath: string): Promise<GitStatusSummary | null> {
    const runner = new GitCommandRunner(repositoryPath, this.logger);
    const result = await runner.run(['status', '--porcelain=2', '--branch']);

    if (result.exitCode !== 0) {
      this.logger.warn(`Failed to read git status for ${repositoryPath}: ${result.stderr.trim()}`);
      return null;
    }

    const lines = result.stdout.split(/\r?\n/).filter(line => line.length > 0);
    let branch = 'HEAD';
    let upstream: string | undefined;
    let ahead = 0;
    let behind = 0;
    const changedFiles: string[] = [];

    for (const line of lines) {
      if (line.startsWith('# branch.head')) {
        const parts = line.split(' ');
        branch = parts[2] ?? branch;
      } else if (line.startsWith('# branch.upstream')) {
        const parts = line.split(' ');
        upstream = parts[2];
      } else if (line.startsWith('# branch.ab')) {
        const parts = line.split(' ');
        const aheadPart = parts.find(part => part.startsWith('+'));
        const behindPart = parts.find(part => part.startsWith('-'));
        ahead = aheadPart ? parseInt(aheadPart.replace('+', ''), 10) || 0 : 0;
        behind = behindPart ? parseInt(behindPart.replace('-', ''), 10) || 0 : 0;
      } else if (!line.startsWith('#')) {
        // porcelain v2 encodes path at the end of the line after a space
        const segments = line.split(' ');
        const path = segments[segments.length - 1];
        if (path) {
          changedFiles.push(path);
        }
      }
    }

    const dirty = changedFiles.length > 0;

    return {
      branch,
      upstream,
      ahead,
      behind,
      dirty,
      changedFiles,
    };
  }
}
