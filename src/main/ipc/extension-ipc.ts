import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import {
  ExtensionEnableSchema,
  ExtensionDisableSchema,
  ExtensionInstallSchema,
  ExtensionUninstallSchema,
  ThemeApplySchema,
  EmptyPayloadSchema,
} from './schemas';
import { ExtensionManager } from '../extension-manager';

export function registerExtensionIPC(
  ipc: IPCManager,
  logger: Logger,
  extensionManager: ExtensionManager
): void {
  // Extension management with validation
  registerValidated(ipc, logger, {
    channel: 'extensions:getAll',
    schema: EmptyPayloadSchema,
    capability: 'extensions.read',
    handler: async () => extensionManager.getAllExtensions(),
  });

  registerValidated(ipc, logger, {
    channel: 'extensions:enable',
    schema: ExtensionEnableSchema,
    capability: 'extensions.manage',
    handler: async input => {
      await extensionManager.enableExtension(input.extensionId);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'extensions:disable',
    schema: ExtensionDisableSchema,
    capability: 'extensions.manage',
    handler: async input => {
      await extensionManager.disableExtension(input.extensionId);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'extensions:install',
    schema: ExtensionInstallSchema,
    capability: 'extensions.install',
    handler: async input => {
      // TODO: Add integrity verification and signing checks
      logger.info(`Installing extension from: ${input.extensionPath}`);
      return extensionManager.installExtension(input.extensionPath);
    },
  });

  registerValidated(ipc, logger, {
    channel: 'extensions:uninstall',
    schema: ExtensionUninstallSchema,
    capability: 'extensions.manage',
    handler: async input => {
      await extensionManager.uninstallExtension(input.extensionId);
      return { success: true };
    },
  });

  // Theme management
  registerValidated(ipc, logger, {
    channel: 'theme:getAll',
    schema: EmptyPayloadSchema,
    capability: 'themes.read',
    handler: async () => extensionManager.getAllThemes(),
  });

  registerValidated(ipc, logger, {
    channel: 'theme:apply',
    schema: ThemeApplySchema,
    capability: 'themes.apply',
    handler: async input => {
      await extensionManager.applyTheme(input.themeId);
      return { success: true };
    },
  });
}
