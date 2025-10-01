import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { EmptyPayloadSchema } from './schemas';
import { app } from 'electron';

export function registerAppControlIPC(ipc: IPCManager, logger: Logger, platform: string): void {
  // Platform information (safe to expose)
  registerValidated(ipc, logger, {
    channel: 'app:getPlatform',
    schema: EmptyPayloadSchema,
    capability: 'app.info',
    handler: async () => ({
      platform,
      arch: process.arch,
      version: app.getVersion(),
      name: app.getName(),
      isPackaged: app.isPackaged,
    }),
  });

  // Application control (high privilege operations)
  registerValidated(ipc, logger, {
    channel: 'app:quit',
    schema: EmptyPayloadSchema,
    capability: 'app.control',
    handler: async () => {
      logger.info('Application quit requested via IPC');
      // Small delay to allow response to be sent
      setTimeout(() => app.quit(), 100);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'app:restart',
    schema: EmptyPayloadSchema,
    capability: 'app.control',
    handler: async () => {
      logger.info('Application restart requested via IPC');
      // Small delay to allow response to be sent
      setTimeout(() => {
        app.relaunch();
        app.quit();
      }, 100);
      return { success: true };
    },
  });
}
