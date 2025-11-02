import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { WorkspaceManager } from '../workspace-manager';
import {
  WorkspaceListSchema,
  WorkspaceGetActiveSchema,
  WorkspaceSetActiveSchema,
  WorkspaceRunPipelineSchema,
} from './schemas';

export function registerWorkspaceIPC(
  ipc: IPCManager,
  logger: Logger,
  workspaceManager: WorkspaceManager
): void {
  registerValidated(ipc, logger, {
    channel: 'workspace:list',
    schema: WorkspaceListSchema,
    capability: 'workspace.read',
    handler: async () => workspaceManager.getWorkspaces(),
  });

  registerValidated(ipc, logger, {
    channel: 'workspace:getActive',
    schema: WorkspaceGetActiveSchema,
    capability: 'workspace.read',
    handler: async () => workspaceManager.getActiveWorkspace() ?? null,
  });

  registerValidated(ipc, logger, {
    channel: 'workspace:setActive',
    schema: WorkspaceSetActiveSchema,
    capability: 'workspace.manage',
    handler: async input => workspaceManager.switchWorkspace(input.workspaceId),
  });

  registerValidated(ipc, logger, {
    channel: 'workspace:runPipeline',
    schema: WorkspaceRunPipelineSchema,
    capability: 'workspace.pipeline',
    handler: async input => {
      await workspaceManager.runPipeline(input.workspaceId, input.pipelineId, {
        stepId: input.stepId,
      });
      return { success: true };
    },
  });
}
