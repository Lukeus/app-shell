# Extension Development Guide

This guide explains how to create extensions for App Shell, an enterprise-grade, cross-platform Electron application shell.

## Overview

App Shell extensions are Node.js modules that extend the functionality of the application. Extensions can contribute:

- Commands and menu items
- Themes and UI customizations
- Settings and configuration options
- Custom views and panels
- Keybindings and shortcuts

## Extension Structure

A basic extension consists of:

```
my-extension/
├── package.json      # Extension manifest
├── extension.js      # Main extension file
├── themes/          # Theme contributions (optional)
├── icons/           # Extension icons (optional)
└── README.md        # Extension documentation
```

## Extension Manifest (package.json)

The `package.json` file defines extension metadata and contributions:

```json
{
  "name": "my-extension",
  "displayName": "My Awesome Extension",
  "version": "1.0.0",
  "description": "An example extension for App Shell",
  "main": "extension.js",
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "app-shell": "^1.0.0"
  },
  "activationEvents": ["onCommand:myExtension.command", "*"],
  "contributes": {
    "commands": [
      {
        "command": "myExtension.helloWorld",
        "title": "Hello World",
        "category": "My Extension"
      }
    ],
    "themes": [
      {
        "id": "my-theme",
        "label": "My Theme",
        "path": "./themes/my-theme.json"
      }
    ],
    "settings": [
      {
        "key": "myExtension.enabled",
        "type": "boolean",
        "default": true,
        "title": "Enable My Extension",
        "description": "Enable or disable this extension"
      }
    ]
  }
}
```

### Required Fields

- `name`: Unique extension identifier
- `version`: Semantic version string
- `main`: Entry point JavaScript file

### Optional Fields

- `displayName`: Human-readable extension name
- `description`: Extension description
- `author`: Extension author information
- `engines.app-shell`: Compatible App Shell version range
- `activationEvents`: Events that trigger extension activation
- `contributes`: Extension contributions (commands, themes, etc.)

## Extension Entry Point

The main extension file must export `activate` and `deactivate` functions:

```javascript
/**
 * Extension activation function
 * @param {ExtensionContext} context Extension context
 */
function activate(context) {
  console.log('My extension is now active!');

  // Register disposables for cleanup
  context.subscriptions.push({
    dispose: () => console.log('Extension cleanup completed'),
  });

  // Use extension state
  const count = context.globalState.get('activationCount', 0);
  context.globalState.update('activationCount', count + 1);
}

/**
 * Extension deactivation function
 */
function deactivate() {
  console.log('My extension is being deactivated');
}

// Command implementations
function helloWorld() {
  console.log('Hello World from my extension!');
  return 'Hello World!';
}

// Export functions
module.exports = {
  activate,
  deactivate,
  'myExtension.helloWorld': helloWorld,
};
```

## Extension Context

The `ExtensionContext` object provides:

- `extensionId`: Unique extension identifier
- `extensionPath`: Absolute path to extension directory
- `globalState`: Persistent global storage
- `workspaceState`: Persistent workspace storage
- `subscriptions`: Array of disposable resources

### State Management

Use global and workspace state to persist data:

```javascript
// Global state (persists across workspaces)
const globalValue = context.globalState.get('myKey', defaultValue);
await context.globalState.update('myKey', newValue);

// Workspace state (workspace-specific)
const workspaceValue = context.workspaceState.get('myKey', defaultValue);
await context.workspaceState.update('myKey', newValue);
```

## Contributing Commands

Extensions can register commands that appear in the command palette:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "myExtension.doSomething",
        "title": "Do Something Amazing",
        "category": "My Extension",
        "icon": "$(star)",
        "when": "editorTextFocus"
      }
    ]
  }
}
```

Implement the command in your extension:

```javascript
function doSomething() {
  // Command implementation
  return 'Command executed!';
}

module.exports = {
  // ... other exports
  'myExtension.doSomething': doSomething,
};
```

## Contributing Themes

Create custom themes for the application:

```json
{
  "contributes": {
    "themes": [
      {
        "id": "my-dark-theme",
        "label": "My Dark Theme",
        "path": "./themes/dark.json"
      }
    ]
  }
}
```

Theme file structure (`themes/dark.json`):

```json
{
  "id": "my-dark-theme",
  "name": "My Dark Theme",
  "type": "dark",
  "colors": {
    "app.background": "#1a1a1a",
    "app.foreground": "#ffffff",
    "panel.background": "#2d2d2d",
    "button.background": "#0078d4",
    "terminal.background": "#1a1a1a",
    "terminal.foreground": "#ffffff"
  }
}
```

## Contributing Settings

Add configuration options for your extension:

```json
{
  "contributes": {
    "settings": [
      {
        "key": "myExtension.autoSave",
        "type": "boolean",
        "default": true,
        "title": "Auto Save",
        "description": "Automatically save changes"
      },
      {
        "key": "myExtension.theme",
        "type": "string",
        "default": "dark",
        "title": "Theme",
        "description": "Extension theme",
        "enum": ["light", "dark", "auto"],
        "enumDescriptions": ["Light theme", "Dark theme", "Auto-detect"]
      }
    ]
  }
}
```

## Activation Events

Control when your extension is activated:

- `*`: Activate on startup (use sparingly)
- `onCommand:commandId`: Activate when command is invoked
- `onLanguage:languageId`: Activate for specific file types
- `onFileType:fileType`: Activate for specific file types
- `workspaceContains:filename`: Activate if workspace contains file

## Extension API

Extensions have access to a rich API:

```javascript
const appShell = require('app-shell');

// Commands
appShell.commands.registerCommand('myCommand', () => {
  // Command implementation
});

// UI
appShell.window.showInformationMessage('Hello!');
appShell.window.showErrorMessage('Something went wrong');

// Workspace
const config = appShell.workspace.getConfiguration('myKey');
await appShell.workspace.updateConfiguration('myKey', 'value');
```

## Best Practices

### Performance

- Use lazy loading and activation events
- Dispose of resources in deactivate()
- Avoid blocking the main thread
- Cache expensive computations

### User Experience

- Provide clear command titles and categories
- Use consistent naming conventions
- Handle errors gracefully
- Provide helpful error messages

### Security

- Validate all inputs
- Don't execute arbitrary code
- Be careful with file system access
- Follow principle of least privilege

### Development

- Use TypeScript for better development experience
- Write comprehensive tests
- Document your APIs
- Follow semantic versioning

## Testing Extensions

Test your extension during development:

1. Copy extension to App Shell extensions directory
2. Reload the application
3. Use Developer Tools to debug issues
4. Check logs for error messages

## Extension Packaging

Package your extension for distribution:

1. Ensure all files are included
2. Test on multiple platforms
3. Create comprehensive README
4. Use semantic versioning
5. Include proper license

## Debugging

Use these techniques to debug extensions:

- Console logging in extension code
- Electron Developer Tools
- App Shell log files
- Extension state inspection

## Example Extensions

See the `examples/` directory for complete extension examples:

- `hello-world-extension`: Basic extension with commands and themes
- More examples coming soon...

## API Reference

For complete API documentation, see:

- [Extension API TypeScript Definitions](../src/types/index.ts)
- [Extension API Utilities](../src/extensions/extension-api.ts)

## Support

- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share extensions
- Documentation: Comprehensive guides and examples
