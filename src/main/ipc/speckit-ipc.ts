import { z } from 'zod';
import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { SpecKitManager } from '../spec-kit-manager';
import {
  SpecKitSaveContextSchema,
  SpecKitStateSchema,
  SpecKitSwitchWorkspaceSchema,
} from './schemas';

export function registerSpecKitIPC(
  ipc: IPCManager,
  logger: Logger,
  specKitManager: SpecKitManager
): void {
  registerValidated(ipc, logger, {
    channel: 'speckit:getState',
    schema: z.object({}),
    capability: 'speckit.read',
    handler: async () => specKitManager.getState(),
  });

  registerValidated(ipc, logger, {
    channel: 'speckit:switchWorkspace',
    schema: SpecKitSwitchWorkspaceSchema,
    capability: 'speckit.manage',
    handler: async input => specKitManager.switchWorkspace(input.workspaceId),
  });

  registerValidated(ipc, logger, {
    channel: 'speckit:resumePipeline',
    schema: SpecKitSwitchWorkspaceSchema,
    capability: 'speckit.manage',
    handler: async input => specKitManager.resumePipeline(input.workspaceId),
  });

  registerValidated(ipc, logger, {
    channel: 'speckit:saveContext',
    schema: SpecKitSaveContextSchema,
    capability: 'speckit.manage',
    handler: async input => specKitManager.saveContext(input.workspaceId),
  });
}

export const SpecKitStateValidator = SpecKitStateSchema;
