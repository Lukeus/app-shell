/**
 * Web Terminal Manager
 *
 * A terminal implementation that works through the web interface
 * without requiring native node-pty compilation.
 * Uses child_process.spawn instead of node-pty.
 */

import { spawn, ChildProcess } from 'child_process';
import { Logger } from './logger';
import { BrowserWindow } from 'electron';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

interface TerminalSession {
  id: string;
  process: ChildProcess;
  cwd: string;
  shell: string;
  currentLine?: string;
}

export class WebTerminalManager {
  private logger: Logger;
  private sessions: Map<string, TerminalSession> = new Map();
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.logger = new Logger('WebTerminalManager');
    this.logger.info('Web Terminal Manager initialized');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    this.logger.info('Main window set for WebTerminalManager');
  }

  async createTerminal(options?: any): Promise<{ id: string; pid: number }> {
    const terminalId = `web-terminal-${Date.now()}`;

    // Determine shell based on platform
    const shell = this.getDefaultShell();
    const cwd = options?.cwd || os.homedir();

    try {
      // Create shell process with proper environment
      const env = {
        ...process.env,
        TERM: 'xterm-256color',
        COLUMNS: '80',
        LINES: '24',
        HOME: os.homedir(),
        SHELL: shell,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
        ...options?.env,
      };

      this.logger.debug(`Creating shell process: ${shell} with env:`, {
        TERM: env.TERM,
        COLUMNS: env.COLUMNS,
        LINES: env.LINES,
      });

      const childProcess = spawn(shell, ['-i', '-l'], {
        // -i for interactive, -l for login shell
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        detached: false,
      });

      const session: TerminalSession = {
        id: terminalId,
        process: childProcess,
        cwd,
        shell,
      };

      this.sessions.set(terminalId, session);

      // Add process event logging
      childProcess.on('spawn', () => {
        this.logger.info(`Terminal ${terminalId} process spawned successfully`);
      });

      childProcess.on('error', error => {
        this.logger.error(`Terminal ${terminalId} process error:`, error);
      });

      // Handle process output
      childProcess.stdout?.on('data', data => {
        const dataStr = data.toString();
        this.logger.debug(`Terminal ${terminalId} stdout:`, dataStr.slice(0, 100));
        // Send output directly to terminal, then add prompt
        this.sendToRenderer(terminalId, dataStr);
        // Add a prompt after command output if it doesn't end with one
        if (!dataStr.endsWith('$ ') && !dataStr.endsWith('% ') && !dataStr.endsWith('> ')) {
          setTimeout(() => {
            this.sendToRenderer(terminalId, '$ ');
          }, 10);
        }
      });

      childProcess.stderr?.on('data', data => {
        const dataStr = data.toString();
        this.logger.debug(`Terminal ${terminalId} stderr:`, dataStr.slice(0, 100));
        this.sendToRenderer(terminalId, dataStr);
        // Add a prompt after error output
        setTimeout(() => {
          this.sendToRenderer(terminalId, '$ ');
        }, 10);
      });

      // Handle process exit
      childProcess.on('exit', code => {
        this.logger.info(`Terminal ${terminalId} exited with code: ${code}`);
        this.sessions.delete(terminalId);
        this.sendToRenderer(terminalId, `\r\n[Process exited with code: ${code}]\r\n`);
      });

      // Send initial prompt without extra messages to avoid clutter
      this.logger.info(`Sending welcome message for terminal ${terminalId}`);

      // Send a clean prompt after a short delay
      setTimeout(() => {
        this.logger.info(`Sending initial prompt for terminal ${terminalId}`);
        this.sendToRenderer(terminalId, '$ ');
      }, 100);

      this.logger.info(`Web terminal created: ${terminalId} (PID: ${childProcess.pid})`);

      return {
        id: terminalId,
        pid: childProcess.pid || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to create web terminal: ${error}`);
      throw error;
    }
  }

  writeToTerminal(terminalId: string, data: string): void {
    this.logger.debug(`Writing to terminal ${terminalId}:`, JSON.stringify(data));
    const session = this.sessions.get(terminalId);
    if (!session) {
      this.logger.warn(`Terminal ${terminalId} not found`);
      return;
    }

    try {
      // Store input for command line editing
      if (!session.currentLine) {
        session.currentLine = '';
      }

      if (data === '\r') {
        // Execute command when Enter is pressed
        this.logger.debug(`Executing command: ${session.currentLine}`);
        this.sendToRenderer(terminalId, '\r\n');

        if (session.currentLine.trim()) {
          // Execute command directly for better reliability
          this.executeCommand(terminalId, session.currentLine.trim(), session.cwd);
        } else {
          // Empty line, just show prompt
          this.sendToRenderer(terminalId, '$ ');
        }

        session.currentLine = '';
      } else if (data === '\u007f' || data === '\b') {
        // Handle backspace
        if (session.currentLine && session.currentLine.length > 0) {
          session.currentLine = session.currentLine.slice(0, -1);
          this.sendToRenderer(terminalId, '\b \b');
        }
      } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126) {
        // Handle printable characters
        session.currentLine += data;
        this.sendToRenderer(terminalId, data);
      }
    } catch (error) {
      this.logger.error(`Failed to write to terminal ${terminalId}:`, error);
    }
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    this.logger.debug(`Resize terminal ${terminalId}: ${cols}x${rows}`);
    // Web terminal doesn't need explicit resizing like node-pty
  }

  killTerminal(terminalId: string): void {
    const session = this.sessions.get(terminalId);
    if (!session) {
      this.logger.warn(`Terminal ${terminalId} not found for kill`);
      return;
    }

    try {
      session.process.kill();
      this.sessions.delete(terminalId);
      this.logger.info(`Killed terminal: ${terminalId}`);
    } catch (error) {
      this.logger.error(`Failed to kill terminal ${terminalId}:`, error);
    }
  }

  disposeAll(): void {
    this.logger.info('Disposing all web terminals');
    for (const [terminalId] of this.sessions) {
      this.killTerminal(terminalId);
    }
  }

  private executeCommand(terminalId: string, command: string, cwd: string): void {
    this.logger.debug(`Executing command directly: ${command}`);

    // Handle built-in commands first
    if (command === 'clear') {
      // Clear terminal - we'll let the renderer handle this
      this.sendToRenderer(terminalId, '\x1B[2J\x1B[H');
      this.sendToRenderer(terminalId, '$ ');
      return;
    }

    if (command.startsWith('cd ')) {
      const newPath = command.substring(3).trim() || os.homedir();
      const session = this.sessions.get(terminalId);
      if (session) {
        try {
          const resolvedPath = path.resolve(session.cwd, newPath);
          if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            session.cwd = resolvedPath;
            this.sendToRenderer(terminalId, '$ ');
          } else {
            this.sendToRenderer(terminalId, `cd: ${newPath}: No such file or directory\r\n$ `);
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          this.sendToRenderer(terminalId, `cd: ${newPath}: Permission denied\r\n$ `);
        }
      }
      return;
    }

    // Execute other commands using spawn
    const args = command.split(' ');
    const cmd = args.shift()!;

    const childProcess = spawn(cmd, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      },
    });

    let output = '';

    childProcess.stdout?.on('data', data => {
      output += data.toString();
    });

    childProcess.stderr?.on('data', data => {
      output += data.toString();
    });

    childProcess.on('close', code => {
      if (output) {
        this.sendToRenderer(terminalId, output);
      }
      if (code !== 0 && !output) {
        this.sendToRenderer(terminalId, `${cmd}: command not found\r\n`);
      }
      this.sendToRenderer(terminalId, '$ ');
    });

    childProcess.on('error', _error => {
      this.sendToRenderer(terminalId, `${cmd}: command not found\r\n$ `);
    });
  }

  private getDefaultShell(): string {
    const platform = process.platform;
    switch (platform) {
      case 'win32':
        return process.env.COMSPEC || 'cmd.exe';
      case 'darwin':
        // Use bash instead of zsh for better compatibility with pipes
        return '/bin/bash';
      case 'linux':
        return process.env.SHELL || '/bin/bash';
      default:
        return '/bin/sh';
    }
  }

  private sendToRenderer(terminalId: string, data: string): void {
    this.logger.debug(
      `Sending data to renderer for ${terminalId}:`,
      data.slice(0, 50) + (data.length > 50 ? '...' : '')
    );

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(`terminal:data:${terminalId}`, data);
    } else {
      // Fallback to focused window if main window not available
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.webContents.send(`terminal:data:${terminalId}`, data);
      } else {
        // Last resort: send to all windows
        const allWindows = BrowserWindow.getAllWindows();
        for (const window of allWindows) {
          if (!window.isDestroyed()) {
            window.webContents.send(`terminal:data:${terminalId}`, data);
          }
        }
      }
    }
  }
}
