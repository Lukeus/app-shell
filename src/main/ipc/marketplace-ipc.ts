import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import {
  MarketplaceSearchSchema,
  MarketplaceGetPluginSchema,
  MarketplaceInstallSchema,
  MarketplaceUninstallSchema,
  MarketplaceUpdateSchema,
  MarketplaceGetStatusSchema,
  EmptyPayloadSchema,
} from './schemas';
import { MarketplaceService } from '../marketplace-service';

export function registerMarketplaceIPC(
  ipc: IPCManager,
  logger: Logger,
  marketplaceService: MarketplaceService
): void {
  registerValidated(ipc, logger, {
    channel: 'marketplace:search',
    schema: MarketplaceSearchSchema,
    capability: 'marketplace.browse',
    handler: async input => {
      // Rate limiting should be applied here in production
      return marketplaceService.searchPlugins(input);
    },
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:getPlugin',
    schema: MarketplaceGetPluginSchema,
    capability: 'marketplace.browse',
    handler: async input => marketplaceService.getPlugin(input.pluginId),
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:getCategories',
    schema: EmptyPayloadSchema,
    capability: 'marketplace.browse',
    handler: async () => marketplaceService.getCategories(),
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:install',
    schema: MarketplaceInstallSchema,
    capability: 'marketplace.install',
    handler: async input => {
      // TODO: Add integrity verification, signature checks, and rate limiting
      logger.info(`Installing marketplace plugin: ${input.pluginId}`);
      await marketplaceService.installPlugin(input.pluginId, input.version);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:update',
    schema: MarketplaceUpdateSchema,
    capability: 'marketplace.install',
    handler: async input => {
      await marketplaceService.updatePlugin(input.pluginId);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:uninstall',
    schema: MarketplaceUninstallSchema,
    capability: 'marketplace.manage',
    handler: async input => {
      await marketplaceService.uninstallPlugin(input.pluginId);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:getInstalled',
    schema: EmptyPayloadSchema,
    capability: 'marketplace.browse',
    handler: async () => marketplaceService.getInstalledPlugins(),
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:checkUpdates',
    schema: EmptyPayloadSchema,
    capability: 'marketplace.browse',
    handler: async () => marketplaceService.checkForUpdates(),
  });

  registerValidated(ipc, logger, {
    channel: 'marketplace:getInstallationStatus',
    schema: MarketplaceGetStatusSchema,
    capability: 'marketplace.browse',
    handler: async input => marketplaceService.getInstallationStatus(input.pluginId),
  });
}
