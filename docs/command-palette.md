# Command Palette System

This document describes the VS Code-style command palette implementation in the App Shell project.

## Overview

The command palette provides a unified interface for discovering and executing commands throughout the application. It features:

- **Fuzzy search**: Intelligent search with character matching and highlighting
- **Keyboard navigation**: Full keyboard support with arrow keys and Enter/Escape
- **Extensible commands**: Built-in commands plus support for extension-contributed commands
- **Cross-platform shortcuts**: Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)
- **Real-time filtering**: Instant search results as you type
- **Visual feedback**: Animated overlay with smooth transitions

## Architecture

### Components

1. **CommandPalette** (`src/renderer/components/command-palette.ts`)
   - Frontend TypeScript class handling UI and user interactions
   - Implements fuzzy search algorithm and keyboard navigation
   - Manages DOM manipulation and styling

2. **CommandManager** (`src/main/managers/command-manager.ts`)
   - Backend service in the main process
   - Handles command registration, execution, and IPC communication
   - Provides built-in application commands

3. **Command Types** (`src/types/command.ts`)
   - TypeScript interfaces for command definitions
   - Includes Command, CommandRegistration, and CommandContext types

### Data Flow

```
User Input → CommandPalette → IPC → CommandManager → Command Execution
     ↑                                      ↓
   Results ← UI Update ← IPC Response ← Command Result
```

## Usage

### Opening the Command Palette

The command palette can be opened using:

- **Keyboard shortcut**: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- **Programmatically**: `commandPalette.show()`

### Navigation

- **Arrow keys**: Navigate up/down through results
- **Enter**: Execute the selected command
- **Escape**: Close the command palette
- **Type**: Filter commands in real-time

## Built-in Commands

The system includes these built-in commands:

### Application Commands

- `app.quit` - Quit Application
- `app.reload` - Reload Window
- `app.toggleDevTools` - Toggle Developer Tools
- `app.about` - About Application

### Window Commands

- `window.minimize` - Minimize Window
- `window.maximize` - Maximize Window
- `window.close` - Close Window
- `window.toggleFullScreen` - Toggle Full Screen

### Terminal Commands

- `terminal.new` - New Terminal
- `terminal.clear` - Clear Terminal
- `terminal.killAll` - Kill All Terminals

### View Commands

- `view.commandPalette` - Show Command Palette
- `view.extensions` - Show Extensions
- `view.settings` - Show Settings

### Theme Commands

- `theme.selectLight` - Light Theme
- `theme.selectDark` - Dark Theme

### File Commands

- `file.openFolder` - Open Folder

## Extension Integration

Extensions can register custom commands using the extension API:

```javascript
// In your extension's activate function
export function activate(context) {
  // Register a command
  const disposable = vscode.commands.registerCommand('myExtension.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from My Extension!');
  });

  context.subscriptions.push(disposable);
}
```

Commands are automatically discovered and included in the command palette.

## Technical Implementation

### Fuzzy Search Algorithm

The command palette implements a sophisticated fuzzy search with:

- **Character matching**: Finds commands containing search characters in order
- **Consecutive character bonus**: Boosts score for consecutive matches
- **Word boundary bonus**: Prioritizes matches at word starts
- **Score normalization**: Relative scoring based on command length
- **Configurable threshold**: Minimum score required for inclusion

### Performance Features

- **Lazy loading**: Commands loaded on first palette open
- **Debounced search**: Optimized filtering for smooth typing
- **Virtual scrolling**: Efficient rendering for large command sets
- **Memory management**: Proper cleanup on component disposal

### Accessibility

- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Full keyboard accessibility
- **Focus management**: Proper focus handling and restoration
- **High contrast support**: Respects system accessibility settings

## Customization

### Styling

The command palette uses CSS custom properties for theming:

```css
:root {
  --panel-background: #252526;
  --app-foreground: #d4d4d4;
  --button-background: #0e639c;
  --button-foreground: #ffffff;
  --app-border: #2d2d30;
}
```

### Configuration Options

```typescript
const commandPalette = new CommandPalette({
  placeholder: 'Type a command...',
  maxResults: 50,
  fuzzyThreshold: 0.3,
});
```

## API Reference

### CommandPalette Class

#### Constructor Options

- `placeholder?: string` - Input placeholder text
- `maxResults?: number` - Maximum results to display
- `fuzzyThreshold?: number` - Minimum fuzzy search score

#### Methods

- `show()` - Open the command palette
- `hide()` - Close the command palette
- `toggle()` - Toggle visibility
- `refresh()` - Reload available commands
- `dispose()` - Clean up resources

### Command Registration

#### Command Interface

```typescript
interface Command {
  command: string; // Unique command ID
  title: string; // Display name
  category?: string; // Grouping category
  icon?: string; // Icon identifier
  when?: string; // Conditional display
}
```

#### CommandManager Methods

- `registerCommand(command: Command, callback: Function)` - Register new command
- `executeCommand(commandId: string, ...args: any[])` - Execute command
- `getAllCommands()` - Get all registered commands
- `unregisterCommand(commandId: string)` - Remove command

## Error Handling

The system includes comprehensive error handling:

- **Command not found**: Clear error messages for invalid commands
- **Execution failures**: Graceful error recovery with user notification
- **IPC failures**: Fallback behavior for communication issues
- **Loading errors**: Retry mechanisms for command loading

## Testing

Test the command palette functionality:

1. **Build the project**: `pnpm build`
2. **Run the application**: `pnpm dev`
3. **Open command palette**: Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P`
4. **Test search**: Type partial command names
5. **Test navigation**: Use arrow keys to navigate
6. **Execute commands**: Press Enter to run commands

## Future Enhancements

Potential improvements for future versions:

- **Command history**: Recently used commands
- **Keyboard shortcuts**: Display and edit command shortcuts
- **Command grouping**: Visual separation by category
- **Custom icons**: Icon support for commands
- **Command descriptions**: Extended help text
- **Favorites system**: Pin frequently used commands

## Troubleshooting

### Common Issues

**Command palette doesn't open:**

- Check keyboard shortcut registration
- Verify IPC communication setup
- Ensure CommandPalette is properly initialized

**Commands not appearing:**

- Confirm CommandManager is instantiated
- Check IPC handler registration
- Verify command registration syntax

**Search not working:**

- Check fuzzy search threshold setting
- Verify input event handling
- Test with simpler search terms

**Styling issues:**

- Confirm CSS custom properties are defined
- Check for conflicting styles
- Verify theme system integration

For additional support, check the main project documentation or create an issue on the project repository.
