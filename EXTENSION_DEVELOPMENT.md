# Extension Development Guide

Welcome to the App Shell Extension Development Guide! This document will help you create powerful extensions for the App Shell platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Extension Structure](#extension-structure)
3. [Extension API](#extension-api)
4. [Extension Manifest](#extension-manifest)
5. [Development Workflow](#development-workflow)
6. [Sample Extensions](#sample-extensions)
7. [Publishing Extensions](#publishing-extensions)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js >= 16.15.0
- TypeScript knowledge (recommended)
- Basic understanding of Electron applications

### Setting Up Development Environment

1. Clone the App Shell repository:

```bash
git clone https://github.com/your-org/app-shell.git
cd app-shell
pnpm install
```

2. Start the development server:

```bash
pnpm dev
```

3. Create your extension directory:

```bash
mkdir extensions/my-first-extension
cd extensions/my-first-extension
```

## Extension Structure

A typical extension follows this directory structure:

```
my-extension/
├── package.json          # Extension manifest
├── extension.js          # Main extension file
├── README.md            # Extension documentation
├── themes/              # Theme files (optional)
│   └── my-theme.json
├── assets/              # Static assets (optional)
│   └── icon.png
└── src/                 # TypeScript source (optional)
    ├── extension.ts
    └── commands/
        └── myCommand.ts
```

## Extension API

App Shell provides a rich API for extension development. The API is accessible through the global `appShell` object in your extension.

### Core API Objects

#### `appShell.window`

Provides methods for interacting with the application window and showing messages.

```javascript
// Show information message
appShell.window.showInformationMessage('Hello from my extension!');

// Show warning message
appShell.window.showWarningMessage('This is a warning');

// Show error message
appShell.window.showErrorMessage('An error occurred');
```

#### `appShell.commands`

Register and execute commands within the application.

```javascript
// Register a command
const disposable = appShell.commands.registerCommand(
  'myCommand',
  () => {
    appShell.window.showInformationMessage('My command was executed!');
  },
  'My Command Title',
  'My Category'
);

// Execute a command
await appShell.commands.executeCommand('workbench.action.reloadWindow');
```

#### `appShell.workspace`

Access and modify application configuration.

```javascript
// Get configuration
const config = appShell.workspace.getConfiguration('myExtension');
const setting = config.get('mySetting', 'defaultValue');

// Update configuration
await config.update('mySetting', 'newValue');
```

#### `appShell.events`

Listen to application events.

```javascript
// Listen to extension events
appShell.events.on('extensionActivated', event => {
  console.log('Extension activated:', event.extensionId);
});
```

### Extension Lifecycle

Extensions have two main lifecycle methods:

#### `activate(context)`

Called when your extension is activated. This is where you should register commands, set up event listeners, and initialize your extension.

```javascript
function activate(context) {
  console.log('My extension is now active!');

  // Register a command
  const disposable = appShell.commands.registerCommand(
    'myExtension.helloWorld',
    () => {
      appShell.window.showInformationMessage('Hello World from my extension!');
    },
    'Hello World',
    'My Extension'
  );

  // Add to subscriptions for proper cleanup
  context.subscriptions.push(disposable);
}
```

#### `deactivate()`

Called when your extension is deactivated. Use this for cleanup.

```javascript
function deactivate() {
  console.log('My extension is now deactivated!');
  // Cleanup code here
}
```

### Extension Context

The context object passed to `activate()` provides:

- `extensionId`: Unique identifier for your extension
- `extensionPath`: Absolute path to your extension directory
- `globalState`: Persistent storage across app sessions
- `workspaceState`: Workspace-specific storage
- `subscriptions`: Array for registering disposables

```javascript
function activate(context) {
  // Store data globally
  await context.globalState.update('myKey', 'myValue');

  // Retrieve data
  const value = context.globalState.get('myKey', 'defaultValue');

  // Store workspace-specific data
  await context.workspaceState.update('workspaceKey', 'workspaceValue');
}
```

## Extension Manifest

The `package.json` file serves as your extension manifest. Here's a complete example:

```json
{
  "name": "my-awesome-extension",
  "displayName": "My Awesome Extension",
  "description": "An awesome extension for App Shell",
  "version": "1.0.0",
  "engines": {
    "app-shell": "^1.0.0"
  },
  "main": "./extension.js",
  "activationEvents": ["onStartup"],
  "contributes": {
    "commands": [
      {
        "command": "myExtension.helloWorld",
        "title": "Hello World",
        "category": "My Extension"
      },
      {
        "command": "myExtension.showPanel",
        "title": "Show My Panel",
        "category": "My Extension",
        "icon": "$(panel-left)"
      }
    ],
    "themes": [
      {
        "id": "my-dark-theme",
        "label": "My Dark Theme",
        "path": "./themes/dark.json"
      }
    ],
    "settings": [
      {
        "key": "myExtension.enableFeature",
        "type": "boolean",
        "default": true,
        "title": "Enable My Feature",
        "description": "Enable or disable my awesome feature"
      }
    ],
    "keybindings": [
      {
        "command": "myExtension.helloWorld",
        "key": "Ctrl+Shift+H",
        "mac": "Cmd+Shift+H",
        "when": "!terminalFocus"
      }
    ]
  },
  "scripts": {
    "build": "tsc -p .",
    "watch": "tsc -w -p ."
  },
  "devDependencies": {
    "@types/node": "^16.0.0",
    "typescript": "^4.8.0"
  },
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/my-awesome-extension.git"
  },
  "keywords": ["app-shell", "extension", "productivity"]
}
```

### Manifest Fields

#### Required Fields

- `name`: Unique extension identifier (lowercase, no spaces)
- `version`: Semantic version (e.g., "1.0.0")
- `description`: Brief description of your extension

#### Optional Fields

- `displayName`: Human-readable name
- `main`: Entry point file (default: "extension.js")
- `engines.app-shell`: Compatible App Shell version
- `activationEvents`: When to activate your extension
- `contributes`: Features your extension contributes

### Activation Events

- `*`: Activate immediately on startup
- `onStartup`: Activate when app starts
- `onCommand:commandId`: Activate when command is executed

## Development Workflow

### 1. Create Extension Boilerplate

```bash
# Create extension directory
mkdir my-extension
cd my-extension

# Initialize package.json
npm init -y

# Create main extension file
touch extension.js
```

### 2. Basic Extension Template

Create `extension.js`:

```javascript
function activate(context) {
  console.log('Extension activated:', context.extensionId);

  // Register a simple command
  const disposable = appShell.commands.registerCommand(
    'test',
    () => {
      appShell.window.showInformationMessage('Hello from my extension!');
    },
    'Test Command',
    'Test'
  );

  context.subscriptions.push(disposable);
}

function deactivate() {
  console.log('Extension deactivated');
}

module.exports = {
  activate,
  deactivate,
};
```

### 3. Install Extension Locally

1. Copy your extension to the App Shell extensions directory:
   - **Windows**: `%APPDATA%/app-shell/extensions/`
   - **macOS**: `~/Library/Application Support/app-shell/extensions/`
   - **Linux**: `~/.config/app-shell/extensions/`

2. Restart App Shell or reload the window

3. Your extension should be loaded and activated

### 4. Debug Extension

1. Open Developer Tools: `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)
2. Check the Console for your extension's log messages
3. Use `console.log()` for debugging

### 5. Test Extension

- Use the Command Palette (`Ctrl+Shift+P`) to run your commands
- Verify your extension appears in the Extensions view
- Test different activation scenarios

## Sample Extensions

### 1. Hello World Extension

The simplest possible extension:

```javascript
// extension.js
function activate(context) {
  const disposable = appShell.commands.registerCommand(
    'helloWorld',
    () => {
      appShell.window.showInformationMessage('Hello, World!');
    },
    'Hello World',
    'Sample'
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
```

```json
{
  "name": "hello-world",
  "displayName": "Hello World",
  "description": "Simple hello world extension",
  "version": "1.0.0",
  "main": "./extension.js",
  "contributes": {
    "commands": [
      {
        "command": "helloWorld",
        "title": "Hello World",
        "category": "Sample"
      }
    ]
  }
}
```

### 2. Date Time Extension

Shows current date and time:

```javascript
// extension.js
function activate(context) {
  // Show current time command
  const timeCommand = appShell.commands.registerCommand(
    'showTime',
    () => {
      const now = new Date().toLocaleString();
      appShell.window.showInformationMessage(`Current time: ${now}`);
    },
    'Show Current Time',
    'DateTime'
  );

  // Insert timestamp command
  const timestampCommand = appShell.commands.registerCommand(
    'insertTimestamp',
    () => {
      const timestamp = new Date().toISOString();
      // In a real extension, you'd insert this into the active editor
      appShell.window.showInformationMessage(`Timestamp: ${timestamp}`);
    },
    'Insert Timestamp',
    'DateTime'
  );

  context.subscriptions.push(timeCommand, timestampCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };
```

### 3. Theme Extension

Custom theme extension:

```json
{
  "name": "awesome-theme",
  "displayName": "Awesome Theme",
  "description": "A beautiful dark theme",
  "version": "1.0.0",
  "contributes": {
    "themes": [
      {
        "id": "awesome-dark",
        "label": "Awesome Dark",
        "path": "./themes/awesome-dark.json"
      }
    ]
  }
}
```

`themes/awesome-dark.json`:

```json
{
  "id": "awesome-dark",
  "name": "Awesome Dark",
  "type": "dark",
  "colors": {
    "app.background": "#1e1e1e",
    "app.foreground": "#d4d4d4",
    "app.border": "#2d2d30",
    "panel.background": "#252526",
    "panel.foreground": "#cccccc",
    "terminal.background": "#1e1e1e",
    "terminal.foreground": "#d4d4d4",
    "button.background": "#0e639c",
    "button.foreground": "#ffffff",
    "input.background": "#3c3c3c",
    "input.foreground": "#cccccc"
  }
}
```

## Publishing Extensions

### 1. Prepare for Publishing

1. Ensure your extension works correctly
2. Write comprehensive documentation
3. Add proper error handling
4. Test on all supported platforms
5. Follow security best practices

### 2. Create Extension Package

```bash
# Create a distributable package
npm pack

# Or create a zip file
zip -r my-extension-1.0.0.zip . -x "node_modules/*" ".git/*"
```

### 3. Publishing Options

- **App Shell Marketplace**: Submit to the official marketplace
- **GitHub Releases**: Host on GitHub for easy distribution
- **NPM**: Publish as an npm package
- **Direct Distribution**: Share zip files directly

## Best Practices

### Code Quality

1. **Use TypeScript**: Provides better type safety and development experience
2. **Follow ESLint rules**: Maintain consistent code style
3. **Add error handling**: Always handle potential errors gracefully
4. **Use async/await**: For better asynchronous code management
5. **Add logging**: Use appropriate logging levels

### Performance

1. **Lazy loading**: Only load resources when needed
2. **Dispose properly**: Clean up resources in deactivate()
3. **Minimize startup time**: Avoid heavy operations during activation
4. **Use web workers**: For CPU-intensive tasks
5. **Cache frequently used data**: Reduce redundant operations

### Security

1. **Validate inputs**: Always validate user inputs
2. **Avoid eval()**: Never use eval() or similar functions
3. **Sanitize data**: Properly sanitize any external data
4. **Use HTTPS**: For any network requests
5. **Follow principle of least privilege**: Only request necessary permissions

### User Experience

1. **Provide clear feedback**: Show progress and status messages
2. **Use consistent UI**: Follow App Shell design patterns
3. **Handle errors gracefully**: Show helpful error messages
4. **Support keyboard shortcuts**: Make features accessible
5. **Document thoroughly**: Provide clear documentation

### Compatibility

1. **Test on all platforms**: Windows, macOS, and Linux
2. **Use cross-platform APIs**: Avoid platform-specific code
3. **Handle version differences**: Support multiple App Shell versions
4. **Test with other extensions**: Ensure compatibility
5. **Follow semantic versioning**: Use proper version numbers

## Troubleshooting

### Common Issues

#### Extension Not Loading

1. Check the extension manifest syntax
2. Verify the main file path is correct
3. Ensure all required fields are present
4. Check the Developer Tools console for errors

#### Commands Not Appearing

1. Verify command registration in activate()
2. Check the contributes.commands in manifest
3. Ensure proper command ID format
4. Restart App Shell to reload extensions

#### API Not Available

1. Ensure you're using the API in activate() or later
2. Check that the extension is properly activated
3. Verify the API method names and parameters
4. Check App Shell version compatibility

#### Extension Crashes

1. Add proper error handling around API calls
2. Check for null/undefined values
3. Use try-catch blocks for async operations
4. Check the console for error messages

### Debugging Tips

1. **Use console.log()**: For basic debugging
2. **Check Developer Tools**: Monitor the console and network tabs
3. **Enable verbose logging**: Set log level to debug
4. **Test incrementally**: Add features one at a time
5. **Use breakpoints**: When using TypeScript/source maps

### Getting Help

1. **Check Documentation**: Review this guide and API documentation
2. **Search Issues**: Look for similar problems on GitHub
3. **Ask Community**: Join the App Shell community discussions
4. **File Issues**: Report bugs or feature requests on GitHub
5. **Contribute**: Help improve the documentation and examples

## Advanced Topics

### TypeScript Development

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out"]
}
```

### Extension Testing

Create `test/extension.test.js`:

```javascript
const assert = require('assert');

suite('Extension Tests', () => {
  test('Extension loads correctly', () => {
    const extension = require('../extension');
    assert.ok(extension.activate);
    assert.ok(extension.deactivate);
  });
});
```

### Localization

Support multiple languages:

```javascript
// Create localization files
// package.nls.json (English - default)
{
  "command.hello": "Hello World",
  "message.greeting": "Hello from my extension!"
}

// package.nls.de.json (German)
{
  "command.hello": "Hallo Welt",
  "message.greeting": "Hallo von meiner Erweiterung!"
}
```

## Conclusion

This guide provides a comprehensive foundation for developing App Shell extensions. Start with simple extensions and gradually add more features as you become familiar with the API.

Remember to:

- Follow best practices for code quality and security
- Test your extensions thoroughly
- Provide clear documentation for users
- Engage with the community for support and feedback

Happy extension development!

---

For the latest updates and additional resources, visit:

- [App Shell GitHub Repository](https://github.com/your-org/app-shell)
- [API Documentation](https://docs.app-shell.dev)
- [Community Discord](https://discord.gg/app-shell)
