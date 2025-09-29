/**
 * Web Terminal Manager
 *
 * A terminal implementation that works through the web interface
 * without requiring native node-pty compilation.
 * Uses child_process.spawn instead of node-pty.
 */

import { spawn, ChildProcess } from 'child_process';
import { Logger } from './logger';
import { TerminalOptions } from '../schemas';
import { BrowserWindow } from 'electron';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

interface TerminalSession {
  id: string;
  process: ChildProcess;
  cwd: string;
  shell: string;
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

  async createTerminal(
    options?: TerminalOptions
  ): Promise<{ id: string; pid: number; title: string; cwd: string }> {
    const terminalId = `web-terminal-${Date.now()}`;

    // Determine shell based on platform
    const shell = this.getDefaultShell();
    const cwd = options?.cwd || os.homedir();

    try {
      // Create shell process with proper environment
      const env = {
        ...process.env,
        // Set terminal type for better compatibility
        TERM: process.platform === 'win32' ? 'xterm' : 'xterm-256color',
        COLUMNS: '80',
        LINES: '24',
        HOME: os.homedir(),
        USERPROFILE: os.homedir(), // Windows equivalent of HOME
        SHELL: shell,
        // Use appropriate PATH for the platform
        PATH:
          process.env.PATH ||
          (process.platform === 'win32'
            ? 'C:\\Windows\\System32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0'
            : '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'),
        ...options?.env,
      };

      this.logger.debug(`Creating shell process: ${shell} with env:`, {
        TERM: env.TERM,
        COLUMNS: env.COLUMNS,
        LINES: env.LINES,
      });

      // Configure shell arguments based on platform
      let shellArgs: string[] = [];
      if (shell.includes('powershell')) {
        // PowerShell arguments for interactive session
        shellArgs = ['-NoExit', '-Command', '& {Set-Location $env:USERPROFILE; Clear-Host}'];
      } else if (shell.includes('cmd')) {
        // CMD arguments
        shellArgs = ['/k'];
      } else {
        // Unix shells
        shellArgs = ['-i', '-l'];
      }

      const childProcess = spawn(shell, shellArgs, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        detached: false,
        shell: false, // Don't use shell wrapper to avoid double-shell issues
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
        // Normalize line endings to prevent double spacing
        const normalizedData = this.normalizeLineEndings(dataStr);
        this.sendToRenderer(terminalId, normalizedData);
      });

      childProcess.stderr?.on('data', data => {
        const dataStr = data.toString();
        this.logger.debug(`Terminal ${terminalId} stderr:`, dataStr.slice(0, 100));
        // Normalize line endings to prevent double spacing
        const normalizedData = this.normalizeLineEndings(dataStr);
        this.sendToRenderer(terminalId, normalizedData);
      });

      // Handle process exit
      childProcess.on('exit', code => {
        this.logger.info(`Terminal ${terminalId} exited with code: ${code}`);
        this.sessions.delete(terminalId);
        this.sendToRenderer(terminalId, `\r\n[Process exited with code: ${code}]\r\n`);
      });

      // Let the shell provide its own prompt - no artificial prompt needed
      this.logger.info(`Terminal ${terminalId} ready - shell will provide prompt`);

      this.logger.info(`Web terminal created: ${terminalId} (PID: ${childProcess.pid})`);

      return {
        id: terminalId,
        pid: childProcess.pid || 0,
        title: 'Terminal',
        cwd,
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
      // Send data directly to the shell process for better compatibility
      // This allows the shell to handle command parsing, history, tab completion, etc.
      if (session.process.stdin && !session.process.stdin.destroyed) {
        session.process.stdin.write(data);
      } else {
        this.logger.warn(`Terminal ${terminalId} stdin not available`);
        this.sendToRenderer(terminalId, '\r\n[Terminal process not available]\r\n');
      }
    } catch (error) {
      this.logger.error(`Failed to write to terminal ${terminalId}:`, error);
      this.sendToRenderer(terminalId, `\r\n[Error: ${error}]\r\n`);
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

  // Command execution is now handled by the shell process directly
  // This method is kept for any future custom command handling needs
  private executeCommand(terminalId: string, command: string, cwd: string): void {
    // This method is no longer used as commands are passed directly to the shell
    // Keeping for potential future custom command handling
    this.logger.debug(`Command would be executed: ${command} in ${cwd} for terminal ${terminalId}`);
  }

  private getDefaultShell(): string {
    const platform = process.platform;
    switch (platform) {
      case 'win32':
        // Use PowerShell for better Windows experience
        return 'powershell.exe';
      case 'darwin':
        // Use bash instead of zsh for better compatibility with pipes
        return '/bin/bash';
      case 'linux':
        return process.env.SHELL || '/bin/bash';
      default:
        return '/bin/sh';
    }
  }

  private normalizeLineEndings(data: string): string {
    // Fix double spacing issues by normalizing line endings
    // PowerShell sometimes outputs \r\n which can cause double spacing in xterm.js
    return data
      .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
      .replace(/\r/g, '\n') // Convert any remaining carriage returns
      .replace(/\n\n+/g, '\n'); // Remove multiple consecutive newlines (but keep single ones)
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
