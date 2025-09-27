/* eslint-env node */
/* global console, module */

/**
 * Hello World Extension for App Shell
 *
 * This is a simple example extension that demonstrates:
 * - Extension activation/deactivation
 * - Command registration and execution
 * - State management
 * - Settings integration
 */

let context;

/**
 * Extension activation function - called when the extension is loaded
 * @param {import('../../src/types').ExtensionContext} extensionContext
 */
function activate(extensionContext) {
  context = extensionContext;

  console.log('Hello World Extension activated!');

  // Initialize extension state
  const activationCount = context.globalState.get('activationCount', 0);
  context.globalState.update('activationCount', activationCount + 1);

  console.log(`Hello World Extension has been activated ${activationCount + 1} times`);

  // Register disposal cleanup
  context.subscriptions.push({
    dispose: () => {
      console.log('Hello World Extension cleanup completed');
    },
  });
}

/**
 * Extension deactivation function - called when the extension is unloaded
 */
function deactivate() {
  console.log('Hello World Extension deactivated');
}

/**
 * Command: Say Hello
 * Displays a greeting message with optional timestamp
 */
function sayHello() {
  const greeting = getSettings().greeting;
  const showTimestamp = getSettings().showTimestamp;

  let message = `${greeting} from App Shell Extension!`;

  if (showTimestamp) {
    const timestamp = new Date().toLocaleString();
    message += ` (${timestamp})`;
  }

  // Store the last greeting in workspace state
  context.workspaceState.update('lastGreeting', {
    message,
    timestamp: new Date().toISOString(),
  });

  console.log(message);
  return message;
}

/**
 * Command: Show Extension Info
 * Shows information about this extension
 */
function showInfo() {
  const activationCount = context.globalState.get('activationCount', 0);
  const lastGreeting = context.workspaceState.get('lastGreeting');

  const info = {
    extensionId: context.extensionId,
    extensionPath: context.extensionPath,
    activationCount,
    lastGreeting,
    settings: getSettings(),
  };

  console.log('Hello World Extension Info:', JSON.stringify(info, null, 2));
  return info;
}

/**
 * Helper function to get extension settings
 * In a real implementation, this would integrate with the app's settings system
 */
function getSettings() {
  return {
    greeting: 'Hello', // This would come from settings
    showTimestamp: true, // This would come from settings
  };
}

// Export the required functions
module.exports = {
  activate,
  deactivate,
  'helloWorld.sayHello': sayHello,
  'helloWorld.showInfo': showInfo,
};
