/**
 * Mock Terminal Manager
 * 
 * Provides a stub implementation of the terminal manager to bypass 
 * node-pty compilation issues during development and testing.
 */

import { Logger } from './logger';

export class MockTerminalManager {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MockTerminalManager');
    this.logger.info('Using mock terminal manager (node-pty not available)');
  }

  async createTerminal(options?: any): Promise<{ id: string; pid: number }> {
    const terminalId = `mock-terminal-${Date.now()}`;
    this.logger.info(`Mock terminal created: ${terminalId}`);
    
    return {
      id: terminalId,
      pid: 12345 // Mock PID
    };
  }

  writeToTerminal(terminalId: string, data: string): void {
    this.logger.debug(`Mock write to terminal ${terminalId}: ${data.slice(0, 50)}...`);
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    this.logger.debug(`Mock resize terminal ${terminalId}: ${cols}x${rows}`);
  }

  killTerminal(terminalId: string): void {
    this.logger.info(`Mock kill terminal: ${terminalId}`);
  }

  disposeAll(): void {
    this.logger.info('Mock dispose all terminals');
  }
}