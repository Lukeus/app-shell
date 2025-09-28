# Hello World Extension

A comprehensive TypeScript example extension for App Shell that demonstrates the extension API and best practices.

## Features

This extension demonstrates:

- **Extension Lifecycle**: Proper activation and deactivation handling
- **Command Registration**: Multiple commands with different functionality
- **State Management**: Both global and workspace state persistence
- **Settings Integration**: Configurable extension settings
- **Event Handling**: Listening to extension system events
- **Theme Contribution**: Custom theme definition
- **Keyboard Shortcuts**: Configurable keybindings
- **TypeScript**: Full type safety and modern TypeScript features
- **Error Handling**: Comprehensive error handling and logging

## Commands

The extension provides these commands (accessible via Command Palette `Ctrl+Shift+P`):

### Hello World: Say Hello

- **Command ID**: `helloWorld.sayHello`
- **Keybinding**: `Ctrl+Shift+H` (Windows/Linux), `Cmd+Shift+H` (Mac)
- **Description**: Displays a customizable greeting message with optional timestamp

### Hello World: Show Extension Info

- **Command ID**: `helloWorld.showInfo`
- **Description**: Shows detailed information about the extension's state and usage

### Hello World: Get Current Time

- **Command ID**: `helloWorld.getCurrentTime`
- **Keybinding**: `Ctrl+Shift+T` (Windows/Linux), `Cmd+Shift+T` (Mac)
- **Description**: Displays the current time in local and UTC formats

### Hello World: Toggle Hello World Theme

- **Command ID**: `helloWorld.toggleTheme`
- **Description**: Demonstrates theme switching functionality

## Settings

Configure the extension through App Shell settings:

| Setting                          | Type    | Default | Description                                      |
| -------------------------------- | ------- | ------- | ------------------------------------------------ |
| `helloWorld.greeting`            | string  | "Hello" | The greeting text to display                     |
| `helloWorld.showTimestamp`       | boolean | true    | Whether to show timestamp in greetings           |
| `helloWorld.enableNotifications` | boolean | true    | Show notification messages for extension actions |

## Theme

The extension includes a custom "Hello World Theme" with:

- Dark color scheme with blue/pink accent colors
- Custom syntax highlighting
- Consistent styling across all UI elements

## Development

### Prerequisites

- Node.js >= 20.0.0
- TypeScript >= 5.0.0
- App Shell development environment

### Building

```bash
# Install dependencies (if any)
pnpm install

# Compile TypeScript
pnpm run build

# Watch for changes during development
pnpm run watch
```

### File Structure

```
hello-world-extension/
├── src/
│   └── extension.ts          # Main extension TypeScript code
├── themes/
│   └── hello-world-theme.json # Custom theme definition
├── out/                      # Compiled JavaScript (generated)
│   └── extension.js
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

### Installation for Development

1. Copy the extension directory to your App Shell extensions folder:
   - **Windows**: `%APPDATA%/app-shell/extensions/hello-world`
   - **macOS**: `~/Library/Application Support/app-shell/extensions/hello-world`
   - **Linux**: `~/.config/app-shell/extensions/hello-world`

2. Build the extension:

   ```bash
   cd path/to/extensions/hello-world
   pnpm run build
   ```

3. Restart App Shell or reload the window

4. The extension should activate automatically on startup

## Usage Examples

### Basic Usage

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Hello World" to see available commands
3. Select "Hello World: Say Hello" or use the keybinding `Ctrl+Shift+H`

### State Inspection

1. Run "Hello World: Show Extension Info" to see:
   - Extension metadata
   - Activation count
   - Command execution statistics
   - Current settings
   - Last greeting information

### Time Display

1. Use `Ctrl+Shift+T` or run "Hello World: Get Current Time"
2. View both local and UTC timestamps

## Code Examples

### Command Registration

```typescript
const sayHelloDisposable = appShell.commands.registerCommand(
  'sayHello',
  handleSayHello,
  'Say Hello',
  'Hello World'
);
extensionContext.subscriptions.push(sayHelloDisposable);
```

### Settings Access

```typescript
function getSettings(): HelloWorldSettings {
  const config = appShell.workspace.getConfiguration('helloWorld');

  return {
    greeting: config.get('greeting', 'Hello'),
    showTimestamp: config.get('showTimestamp', true),
    enableNotifications: config.get('enableNotifications', true),
  };
}
```

### State Management

```typescript
// Global state (persists across app sessions)
await extensionContext.globalState.update('activationCount', count);
const count = extensionContext.globalState.get('activationCount', 0);

// Workspace state (specific to current workspace)
await extensionContext.workspaceState.update('lastGreeting', data);
const data = extensionContext.workspaceState.get('lastGreeting');
```

## Extension API Usage

This extension demonstrates the App Shell extension API:

- `appShell.window.showInformationMessage()` - Display info messages
- `appShell.window.showErrorMessage()` - Display error messages
- `appShell.commands.registerCommand()` - Register extension commands
- `appShell.workspace.getConfiguration()` - Access settings
- `appShell.events.on()` - Listen to system events

## Best Practices Demonstrated

1. **TypeScript Usage**: Full type safety with interfaces and strict typing
2. **Error Handling**: Try-catch blocks with proper error logging
3. **Resource Cleanup**: Proper disposal of subscriptions
4. **State Management**: Separation of global and workspace state
5. **Settings Integration**: User-configurable behavior
6. **Documentation**: Comprehensive inline documentation
7. **Modular Code**: Well-organized functions with clear responsibilities
8. **Event Handling**: Proper event listener setup and cleanup

## Troubleshooting

### Extension Not Loading

1. Check the Developer Tools console for errors
2. Verify the `package.json` manifest is valid
3. Ensure TypeScript compilation succeeded (check `out/` directory)
4. Confirm the extension path is correct

### Commands Not Working

1. Verify the extension is activated (check console logs)
2. Check command registration succeeded
3. Try restarting App Shell
4. Check keybinding conflicts

### Settings Not Loading

1. Check if the settings schema is correctly defined in `package.json`
2. Verify the configuration section name matches (`helloWorld`)
3. Check console for settings-related errors

## Contributing

This is a sample extension, but contributions to improve the example are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the main App Shell repository for details.

---

This extension serves as a comprehensive example for App Shell extension development. Use it as a starting point for your own extensions!
