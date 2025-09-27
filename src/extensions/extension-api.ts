/**
 * Extension API for App Shell
 */

import { ExtensionContext, CommandRegistration } from '../types';

export namespace commands {
  const registeredCommands = new Map<string, CommandRegistration>();
  let extensionContext: ExtensionContext | null = null;

  export function _setContext(context: ExtensionContext): void {
    extensionContext = context;
  }

  export function registerCommand(
    command: string,
    callback: (...args: any[]) => any,
    title?: string,
    category?: string
  ): { dispose(): void } {
    if (!extensionContext) {
      throw new Error('Extension context not initialized');
    }

    const commandRegistration: CommandRegistration = {
      command,
      title: title || command,
      category,
      callback,
    };

    registeredCommands.set(command, commandRegistration);

    const disposable = {
      dispose: () => {
        registeredCommands.delete(command);
      },
    };

    extensionContext.subscriptions.push(disposable);
    return disposable;
  }

  export async function executeCommand(command: string, ...args: any[]): Promise<any> {
    const localCommand = registeredCommands.get(command);
    if (localCommand) {
      return await localCommand.callback(...args);
    }
    throw new Error(`Command not found: ${command}`);
  }
}

export namespace window {
  export function showInformationMessage(message: string): void {
    console.log(`INFO: ${message}`);
  }

  export function showWarningMessage(message: string): void {
    console.warn(`WARNING: ${message}`);
  }

  export function showErrorMessage(message: string): void {
    console.error(`ERROR: ${message}`);
  }
}

export function initializeExtensionAPI(context: ExtensionContext): void {
  commands._setContext(context);
}

export type { ExtensionContext, CommandRegistration } from '../types';
