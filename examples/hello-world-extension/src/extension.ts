/**
 * Hello World Extension for App Shell
 *
 * This TypeScript extension demonstrates:
 * - Extension activation/deactivation lifecycle
 * - Command registration using the App Shell API
 * - State management (global and workspace)
 * - Settings integration
 * - Theme management
 * - Event handling
 * - Proper TypeScript typing
 */

// Extension context interface (copied to avoid import issues)
interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  globalState: StateManager;
  workspaceState: StateManager;
  subscriptions: { dispose(): void }[];
}

interface StateManager {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: unknown): Promise<void>;
  keys(): readonly string[];
}

// Global extension context
let extensionContext: ExtensionContext;

// Extension API interface (injected by the extension manager)
declare const appShell: {
  window: {
    showInformationMessage(message: string): void;
    showWarningMessage(message: string): void;
    showErrorMessage(message: string): void;
  };
  commands: {
    registerCommand(
      commandId: string,
      callback: (...args: any[]) => any,
      title?: string,
      category?: string
    ): { dispose(): void };
    executeCommand(commandId: string, ...args: any[]): Promise<any>;
  };
  workspace: {
    getConfiguration(section?: string): {
      get<T>(key: string, defaultValue?: T): T;
      update(key: string, value: any): Promise<void>;
    };
  };
  events: {
    on(event: string, callback: (...args: any[]) => void): void;
  };
};

/**
 * Extension Settings Interface
 */
interface HelloWorldSettings {
  greeting: string;
  showTimestamp: boolean;
  enableNotifications: boolean;
}

/**
 * Extension State Interface
 */
interface ExtensionState {
  activationCount: number;
  lastGreeting?: {
    message: string;
    timestamp: string;
  };
  commandExecutions: Record<string, number>;
}

/**
 * Extension activation function
 * Called when the extension is loaded and activated
 */
export function activate(context: ExtensionContext): void {
  extensionContext = context;

  console.log(`Hello World Extension activated! Extension ID: ${context.extensionId}`);
  console.log(`Extension path: ${context.extensionPath}`);

  // Initialize extension state
  initializeExtensionState();

  // Register commands with the App Shell API
  registerCommands();

  // Set up event listeners
  setupEventListeners();

  // Show activation message
  const settings = getSettings();
  if (settings.enableNotifications) {
    appShell.window.showInformationMessage(
      `Hello World Extension activated! Use Ctrl+Shift+H (Cmd+Shift+H on Mac) to say hello.`
    );
  }

  console.log('Hello World Extension setup completed successfully');
}

/**
 * Extension deactivation function
 * Called when the extension is unloaded
 */
export function deactivate(): void {
  console.log('Hello World Extension deactivated');

  // The extension manager will automatically dispose of subscriptions
  // Any additional cleanup can be done here

  const settings = getSettings();
  if (settings.enableNotifications) {
    appShell.window.showInformationMessage('Hello World Extension deactivated. Goodbye!');
  }
}

/**
 * Initialize extension state and track activation
 */
function initializeExtensionState(): void {
  try {
    const state = getExtensionState();
    const newActivationCount = state.activationCount + 1;

    // Update global state
    extensionContext.globalState.update('activationCount', newActivationCount);

    // Initialize command execution counters
    if (!state.commandExecutions) {
      extensionContext.globalState.update('commandExecutions', {});
    }

    console.log(`Extension has been activated ${newActivationCount} times`);

    // Add cleanup subscription
    extensionContext.subscriptions.push({
      dispose: () => {
        console.log('Hello World Extension: Cleanup completed');
      },
    });
  } catch (error) {
    console.error('Failed to initialize extension state:', error);
    appShell.window.showErrorMessage('Failed to initialize Hello World Extension state');
  }
}

/**
 * Register all extension commands
 */
function registerCommands(): void {
  try {
    // Command: Say Hello
    const sayHelloDisposable = appShell.commands.registerCommand(
      'sayHello',
      handleSayHello,
      'Say Hello',
      'Hello World'
    );
    extensionContext.subscriptions.push(sayHelloDisposable);

    // Command: Show Extension Info
    const showInfoDisposable = appShell.commands.registerCommand(
      'showInfo',
      handleShowInfo,
      'Show Extension Info',
      'Hello World'
    );
    extensionContext.subscriptions.push(showInfoDisposable);

    // Command: Get Current Time
    const getCurrentTimeDisposable = appShell.commands.registerCommand(
      'getCurrentTime',
      handleGetCurrentTime,
      'Get Current Time',
      'Hello World'
    );
    extensionContext.subscriptions.push(getCurrentTimeDisposable);

    // Command: Toggle Theme
    const toggleThemeDisposable = appShell.commands.registerCommand(
      'toggleTheme',
      handleToggleTheme,
      'Toggle Hello World Theme',
      'Hello World'
    );
    extensionContext.subscriptions.push(toggleThemeDisposable);

    console.log('All commands registered successfully');
  } catch (error) {
    console.error('Failed to register commands:', error);
    appShell.window.showErrorMessage('Failed to register Hello World Extension commands');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  try {
    // Listen for extension events
    appShell.events.on('extensionActivated', (event: any) => {
      console.log('Extension activated event received:', event);
    });

    appShell.events.on('extensionDeactivated', (event: any) => {
      console.log('Extension deactivated event received:', event);
    });

    console.log('Event listeners set up successfully');
  } catch (error) {
    console.error('Failed to setup event listeners:', error);
  }
}

/**
 * Command Handler: Say Hello
 */
async function handleSayHello(): Promise<string> {
  try {
    await incrementCommandCounter('sayHello');

    const settings = getSettings();
    let message = `${settings.greeting} from App Shell TypeScript Extension! 🚀`;

    if (settings.showTimestamp) {
      const timestamp = new Date().toLocaleString();
      message += ` (${timestamp})`;
    }

    // Store the greeting in workspace state
    const greetingData = {
      message,
      timestamp: new Date().toISOString(),
    };

    await extensionContext.workspaceState.update('lastGreeting', greetingData);

    console.log(message);

    if (settings.enableNotifications) {
      appShell.window.showInformationMessage(message);
    }

    return message;
  } catch (error) {
    console.error('Error in handleSayHello:', error);
    appShell.window.showErrorMessage('Failed to execute say hello command');
    throw error;
  }
}

/**
 * Command Handler: Show Extension Info
 */
async function handleShowInfo(): Promise<ExtensionInfo> {
  try {
    await incrementCommandCounter('showInfo');

    const state = getExtensionState();
    const settings = getSettings();
    const lastGreeting = extensionContext.workspaceState.get('lastGreeting');

    const info: ExtensionInfo = {
      extensionId: extensionContext.extensionId,
      extensionPath: extensionContext.extensionPath,
      activationCount: state.activationCount,
      commandExecutions: state.commandExecutions,
      lastGreeting: lastGreeting as { message: string; timestamp: string } | undefined,
      settings,
      timestamp: new Date().toISOString(),
    };

    const infoMessage = `Extension Info:\n- ID: ${info.extensionId}\n- Activated: ${info.activationCount} times\n- Commands executed: ${JSON.stringify(info.commandExecutions)}`;

    console.log('Extension Info:', JSON.stringify(info, null, 2));

    if (settings.enableNotifications) {
      appShell.window.showInformationMessage(infoMessage);
    }

    return info;
  } catch (error) {
    console.error('Error in handleShowInfo:', error);
    appShell.window.showErrorMessage('Failed to show extension info');
    throw error;
  }
}

/**
 * Command Handler: Get Current Time
 */
async function handleGetCurrentTime(): Promise<string> {
  try {
    await incrementCommandCounter('getCurrentTime');

    const now = new Date();
    const timeString = now.toLocaleString();
    const isoString = now.toISOString();

    const message = `Current time: ${timeString} (UTC: ${isoString})`;

    console.log(message);

    const settings = getSettings();
    if (settings.enableNotifications) {
      appShell.window.showInformationMessage(message);
    }

    return message;
  } catch (error) {
    console.error('Error in handleGetCurrentTime:', error);
    appShell.window.showErrorMessage('Failed to get current time');
    throw error;
  }
}

/**
 * Command Handler: Toggle Theme
 */
async function handleToggleTheme(): Promise<void> {
  try {
    await incrementCommandCounter('toggleTheme');

    // In a real implementation, this would interact with the theme system
    console.log('Toggling Hello World theme...');

    const settings = getSettings();
    if (settings.enableNotifications) {
      appShell.window.showInformationMessage(
        'Hello World theme toggled! (Theme switching will be implemented in the UI)'
      );
    }
  } catch (error) {
    console.error('Error in handleToggleTheme:', error);
    appShell.window.showErrorMessage('Failed to toggle theme');
    throw error;
  }
}

/**
 * Get current extension settings
 */
function getSettings(): HelloWorldSettings {
  try {
    const config = appShell.workspace.getConfiguration('helloWorld');

    return {
      greeting: config.get('greeting', 'Hello'),
      showTimestamp: config.get('showTimestamp', true),
      enableNotifications: config.get('enableNotifications', true),
    };
  } catch (error) {
    console.warn('Failed to get settings, using defaults:', error);
    return {
      greeting: 'Hello',
      showTimestamp: true,
      enableNotifications: true,
    };
  }
}

/**
 * Get current extension state
 */
function getExtensionState(): ExtensionState {
  return {
    activationCount: extensionContext.globalState.get('activationCount', 0) ?? 0,
    commandExecutions: extensionContext.globalState.get('commandExecutions', {}) ?? {},
    lastGreeting: extensionContext.workspaceState.get('lastGreeting'),
  };
}

/**
 * Increment command execution counter
 */
async function incrementCommandCounter(commandName: string): Promise<void> {
  try {
    const state = getExtensionState();
    const currentCount = state.commandExecutions[commandName] || 0;
    const newExecutions = {
      ...state.commandExecutions,
      [commandName]: currentCount + 1,
    };

    await extensionContext.globalState.update('commandExecutions', newExecutions);
  } catch (error) {
    console.warn('Failed to increment command counter:', error);
  }
}

/**
 * Extension Info Interface
 */
interface ExtensionInfo {
  extensionId: string;
  extensionPath: string;
  activationCount: number;
  commandExecutions: Record<string, number>;
  lastGreeting?: {
    message: string;
    timestamp: string;
  };
  settings: HelloWorldSettings;
  timestamp: string;
}

// Export command handlers for the extension system
export const commands = {
  'helloWorld.sayHello': handleSayHello,
  'helloWorld.showInfo': handleShowInfo,
  'helloWorld.getCurrentTime': handleGetCurrentTime,
  'helloWorld.toggleTheme': handleToggleTheme,
};
