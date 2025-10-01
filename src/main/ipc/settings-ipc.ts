import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { SettingsGetSchema, SettingsSetSchema, SettingsGetAllSchema } from './schemas';
import { SettingsManager } from '../settings-manager';
import { SettingsValue } from '../../schemas';

export function registerSettingsIPC(
  ipc: IPCManager,
  logger: Logger,
  settingsManager: SettingsManager
): void {
  registerValidated(ipc, logger, {
    channel: 'settings:get',
    schema: SettingsGetSchema,
    capability: 'settings.read',
    handler: async input => settingsManager.get(input.key),
  });

  registerValidated(ipc, logger, {
    channel: 'settings:set',
    schema: SettingsSetSchema,
    capability: 'settings.write',
    handler: async input => {
      await settingsManager.set(input.key, input.value as SettingsValue);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'settings:getAll',
    schema: SettingsGetAllSchema,
    capability: 'settings.read',
    handler: async () => settingsManager.getAll(),
  });
}
