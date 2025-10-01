import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { CommandExecuteSchema, EmptyPayloadSchema } from './schemas';
import { ExtensionManager } from '../extension-manager';
import { CommandManager } from '../managers/command-manager';

export function registerCommandIPC(
  ipc: IPCManager,
  logger: Logger,
  extensionManager: ExtensionManager,
  commandManager: CommandManager
): void {
  // Critical security: Command execution with validation
  registerValidated(ipc, logger, {
    channel: 'command:execute',
    schema: CommandExecuteSchema,
    capability: 'command.execute',
    handler: async input => {
      // First try extension manager (for extension commands)
      try {
        return await extensionManager.executeCommand(input.commandId, ...(input.args || []));
      } catch (error: any) {
        if (error.code === 'COMMAND_NOT_FOUND') {
          // Fallback to command manager
          try {
            return await commandManager.executeCommand(input.commandId, ...(input.args || []));
          } catch (cmdError: any) {
            logger.warn(`Command not found in either manager: ${input.commandId}`);
            throw cmdError;
          }
        }
        throw error;
      }
    },
  });

  registerValidated(ipc, logger, {
    channel: 'command:getAllCommands',
    schema: EmptyPayloadSchema,
    capability: 'command.list',
    handler: async () => {
      // Combine commands from both managers
      const extensionCommands = extensionManager.getAllCommands();
      const commandManagerCommands = commandManager.getAllCommands();

      // Convert to consistent format for API response (remove callbacks for security)
      const safeExtensionCommands = extensionCommands.map(cmd => ({
        command: cmd.command,
        title: cmd.title,
        category: cmd.category,
        accelerator: cmd.accelerator,
        when: cmd.when,
        icon: cmd.icon,
      }));

      const safeCmdManagerCommands = commandManagerCommands.map(cmd => ({
        command: cmd.command,
        title: cmd.title,
        category: cmd.category,
        accelerator: cmd.accelerator,
        when: cmd.when,
        icon: cmd.icon,
      }));

      // Deduplicate by command ID (extension commands take precedence)
      const allCommands = [...safeExtensionCommands];
      const extensionCommandIds = new Set(safeExtensionCommands.map(cmd => cmd.command));

      for (const cmd of safeCmdManagerCommands) {
        if (!extensionCommandIds.has(cmd.command)) {
          allCommands.push(cmd);
        }
      }

      return allCommands;
    },
  });
}
