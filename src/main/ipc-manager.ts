import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { Logger } from './logger';

export class IPCManager {
  private logger: Logger;
  private handlers: Map<
    string,
    (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown
  >;

  constructor() {
    this.logger = new Logger('IPCManager');
    this.handlers = new Map();
  }

  handle(
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown
  ): void {
    try {
      if (this.handlers.has(channel)) {
        this.logger.warn(`Handler for channel '${channel}' already exists. Overwriting.`);
      }

      this.handlers.set(channel, handler);

      ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
        try {
          this.logger.debug(`Handling IPC call: ${channel}`, args);
          const result = await handler(event, ...args);
          this.logger.debug(`IPC call completed: ${channel}`, result);
          return result;
        } catch (error) {
          this.logger.error(`Error handling IPC call: ${channel}`, error);
          throw error;
        }
      });

      this.logger.debug(`Registered IPC handler: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to register IPC handler: ${channel}`, error);
      throw error;
    }
  }

  removeHandler(channel: string): void {
    try {
      if (this.handlers.has(channel)) {
        ipcMain.removeHandler(channel);
        this.handlers.delete(channel);
        this.logger.debug(`Removed IPC handler: ${channel}`);
      } else {
        this.logger.warn(`No handler found for channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove IPC handler: ${channel}`, error);
    }
  }

  removeAllHandlers(): void {
    try {
      for (const channel of this.handlers.keys()) {
        ipcMain.removeHandler(channel);
      }
      this.handlers.clear();
      this.logger.info('Removed all IPC handlers');
    } catch (error) {
      this.logger.error('Failed to remove all IPC handlers', error);
    }
  }

  getRegisteredChannels(): string[] {
    return Array.from(this.handlers.keys());
  }

  hasHandler(channel: string): boolean {
    return this.handlers.has(channel);
  }

  dispose(): void {
    this.removeAllHandlers();
  }
}
