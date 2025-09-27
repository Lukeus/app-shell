import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { LogLevel } from '../types';

export class Logger {
  private context: string;
  private logLevel: LogLevel;
  private logFile?: string;

  constructor(context: string, logLevel: LogLevel = LogLevel.Info) {
    this.context = context;
    this.logLevel = logLevel;
    this.setupLogFile();
  }

  private setupLogFile(): void {
    try {
      const userDataPath = app.getPath('userData');
      const logsDir = path.join(userDataPath, 'logs');

      // Create logs directory if it doesn't exist
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const logFileName = `app-shell-${new Date().toISOString().split('T')[0]}.log`;
      this.logFile = path.join(logsDir, logFileName);

      // Clean up old log files (keep last 7 days)
      this.cleanupOldLogs(logsDir);
    } catch (error) {
      console.error('Failed to setup log file:', error);
    }
  }

  private cleanupOldLogs(logsDir: string): void {
    try {
      const files = fs.readdirSync(logsDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      files.forEach(file => {
        if (file.startsWith('app-shell-') && file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stat = fs.statSync(filePath);

          if (stat.mtime < sevenDaysAgo) {
            fs.unlinkSync(filePath);
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedMessage =
      args.length > 0
        ? `${message} ${args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ')}`
        : message;

    return `[${timestamp}] [${level}] [${this.context}] ${formattedMessage}`;
  }

  private writeToFile(level: string, message: string, ...args: any[]): void {
    if (!this.logFile) return;

    try {
      const logEntry = this.formatMessage(level, message, ...args) + '\n';
      fs.appendFileSync(this.logFile, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.debug(this.formatMessage('DEBUG', message, ...args));
      this.writeToFile('DEBUG', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Info) {
      console.info(this.formatMessage('INFO', message, ...args));
      this.writeToFile('INFO', message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Warning) {
      console.warn(this.formatMessage('WARN', message, ...args));
      this.writeToFile('WARN', message, ...args);
    }
  }

  error(message: string | Error, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Error) {
      const errorMessage = message instanceof Error ? message.message : message;
      const errorStack = message instanceof Error ? message.stack : undefined;

      const fullMessage = errorStack ? `${errorMessage}\n${errorStack}` : errorMessage;
      console.error(this.formatMessage('ERROR', fullMessage, ...args));
      this.writeToFile('ERROR', fullMessage, ...args);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  getLogFile(): string | undefined {
    return this.logFile;
  }
}
