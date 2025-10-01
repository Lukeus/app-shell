import { registerValidated } from './validators';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import {
  TerminalCreateSchema,
  TerminalWriteSchema,
  TerminalResizeSchema,
  TerminalKillSchema,
} from './schemas';
import { WebTerminalManager } from '../web-terminal-manager';
import { TerminalOptions } from '../../schemas';

export function registerTerminalIPC(
  ipc: IPCManager,
  logger: Logger,
  terminalManager: WebTerminalManager
): void {
  registerValidated(ipc, logger, {
    channel: 'terminal:create',
    schema: TerminalCreateSchema,
    capability: 'terminal.create',
    handler: async input => {
      const options: TerminalOptions | undefined = {
        cwd: input.cwd,
        shell: input.shell,
        cols: input.cols,
        rows: input.rows,
      };
      return terminalManager.createTerminal(options);
    },
  });

  registerValidated(ipc, logger, {
    channel: 'terminal:write',
    schema: TerminalWriteSchema,
    capability: 'terminal.write',
    handler: async input => {
      terminalManager.writeToTerminal(input.terminalId, input.data);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'terminal:resize',
    schema: TerminalResizeSchema,
    capability: 'terminal.control',
    handler: async input => {
      terminalManager.resizeTerminal(input.terminalId, input.cols, input.rows);
      return { success: true };
    },
  });

  registerValidated(ipc, logger, {
    channel: 'terminal:kill',
    schema: TerminalKillSchema,
    capability: 'terminal.control',
    handler: async input => {
      terminalManager.killTerminal(input.terminalId);
      return { success: true };
    },
  });
}
