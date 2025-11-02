import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { SpecKitWorkspaceManager } from '../spec-kit-workspace-manager';
import {
  SpecKitArchiveWorkspaceSchema,
  SpecKitCreateWorkspaceSchema,
  SpecKitGetWorkspaceSchema,
  SpecKitListWorkspacesSchema,
  SpecKitSelectWorkspaceSchema,
  SpecKitUpdateWorkspaceMetadataSchema,
  SpecKitGetCurrentWorkspaceSchema,
} from './schemas';

export function registerSpecKitIPC(
  ipc: IPCManager,
  logger: Logger,
  workspaceManager: SpecKitWorkspaceManager
): void {
  registerValidated(ipc, logger, {
    channel: 'specKit:listWorkspaces',
    schema: SpecKitListWorkspacesSchema,
    capability: 'specKit.read',
    handler: async () => workspaceManager.listWorkspaces(),
  });

  registerValidated(ipc, logger, {
    channel: 'specKit:createWorkspace',
    schema: SpecKitCreateWorkspaceSchema,
    capability: 'specKit.manage',
    handler: async input => workspaceManager.createWorkspace(input),
  });

  registerValidated(ipc, logger, {
    channel: 'specKit:getWorkspace',
    schema: SpecKitGetWorkspaceSchema,
    capability: 'specKit.read',
    handler: async input => workspaceManager.getWorkspace(input.key),
  });

  registerValidated(ipc, logger, {
    channel: 'specKit:updateWorkspaceMetadata',
    schema: SpecKitUpdateWorkspaceMetadataSchema,
    capability: 'specKit.manage',
    handler: async input => workspaceManager.updateWorkspaceMetadata(input.key, input.metadata),
  });

  registerValidated(ipc, logger, {
    channel: 'specKit:archiveWorkspace',
    schema: SpecKitArchiveWorkspaceSchema,
    capability: 'specKit.manage',
    handler: async input => workspaceManager.archiveWorkspace(input),
  });

  registerValidated(ipc, logger, {
    channel: 'specKit:selectWorkspace',
    schema: SpecKitSelectWorkspaceSchema,
    capability: 'specKit.manage',
    handler: async input => workspaceManager.selectWorkspace(input.key),
  });

  registerValidated(ipc, logger, {
    channel: 'specKit:getCurrentWorkspace',
    schema: SpecKitGetCurrentWorkspaceSchema,
    capability: 'specKit.read',
    handler: async () => workspaceManager.getCurrentWorkspace(),
  });
}
