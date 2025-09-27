import { spawn } from 'node-pty';
import * as os from 'os';
import { TerminalInstance, TerminalOptions } from '../types';
import { Logger } from './logger';

export class TerminalManager {
  private logger: Logger;
  private terminals: Map<string, any>;
  private terminalCounter: number;

  constructor() {
    this.logger = new Logger('TerminalManager');
    this.terminals = new Map();
    this.terminalCounter = 0;
  }

  createTerminal(options?: TerminalOptions): TerminalInstance {
    try {
      const terminalId = `terminal_${++this.terminalCounter}`;
      const shell = this.getDefaultShell(options?.shell);
      const args = options?.args || [];
      const cwd = options?.cwd || os.homedir();
      const env = { ...process.env, ...options?.env };

      // Spawn terminal process
      const ptyProcess = spawn(shell, args, {
        name: 'xterm-color',
        cols: options?.cols || 80,
        rows: options?.rows || 30,
        cwd,
        env,
      });

      const terminal: TerminalInstance = {
        id: terminalId,
        title: `Terminal ${this.terminalCounter}`,
        pid: ptyProcess.pid,
        cwd,
        write: (data: string) => ptyProcess.write(data),
        resize: (cols: number, rows: number) => ptyProcess.resize(cols, rows),
        kill: (signal?: string) => ptyProcess.kill(signal),
        onData: (callback: (data: string) => void) => {
          ptyProcess.onData(callback);
        },
        onExit: (callback: (exitCode: number, signal?: number) => void) => {
          ptyProcess.onExit((e: { exitCode: number; signal?: number }) => {
            callback(e.exitCode, e.signal);
          });
        },
      };

      this.terminals.set(terminalId, { terminal, ptyProcess });
      this.logger.info(`Created terminal: ${terminalId}`);

      return terminal;
    } catch (error) {
      this.logger.error('Failed to create terminal', error);
      throw error;
    }
  }

  writeToTerminal(terminalId: string, data: string): void {
    const terminalData = this.terminals.get(terminalId);
    if (terminalData) {
      terminalData.terminal.write(data);
    } else {
      this.logger.warn(`Terminal not found: ${terminalId}`);
    }
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    const terminalData = this.terminals.get(terminalId);
    if (terminalData) {
      terminalData.terminal.resize(cols, rows);
    } else {
      this.logger.warn(`Terminal not found: ${terminalId}`);
    }
  }

  killTerminal(terminalId: string): void {
    const terminalData = this.terminals.get(terminalId);
    if (terminalData) {
      terminalData.terminal.kill();
      this.terminals.delete(terminalId);
      this.logger.info(`Killed terminal: ${terminalId}`);
    } else {
      this.logger.warn(`Terminal not found: ${terminalId}`);
    }
  }

  getTerminal(terminalId: string): TerminalInstance | undefined {
    const terminalData = this.terminals.get(terminalId);
    return terminalData?.terminal;
  }

  getAllTerminals(): TerminalInstance[] {
    return Array.from(this.terminals.values()).map(data => data.terminal);
  }

  disposeAll(): void {
    for (const [terminalId] of this.terminals) {
      this.killTerminal(terminalId);
    }
    this.logger.info('Disposed all terminals');
  }

  private getDefaultShell(preferredShell?: string): string {
    if (preferredShell) {
      return preferredShell;
    }

    const platform = process.platform;
    switch (platform) {
      case 'win32':
        return process.env.ComSpec || 'cmd.exe';
      case 'darwin':
      case 'linux':
        return process.env.SHELL || '/bin/bash';
      default:
        return '/bin/bash';
    }
  }
}
