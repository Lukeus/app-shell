# Command Palette

The Command Palette provides quick access to all application functionality through a searchable, keyboard-navigable interface, similar to VS Code's command palette.

## Features

### 🚀 **Opening the Command Palette**

- **Keyboard shortcut**: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- **Status bar**: Click the "⌘ Command Palette" item in the status bar
- **Programmatic**: Commands can trigger `view.commandPalette` command

### 🔍 **Search & Navigation**

- **Fuzzy search**: Type any part of command name, category, or command ID
- **Keyboard navigation**: Use `↑`/`↓` arrow keys to navigate
- **Mouse support**: Click any command to execute it
- **Smart scoring**: Commands are ranked by relevance to your search

### ⌨️ **Keyboard Shortcuts**

- `Enter` - Execute selected command
- `Escape` - Close command palette
- `↑`/`↓` - Navigate between commands

### 🎨 **Visual Features**

- **VS Code styling**: Matches the application's dark theme
- **Highlighted matches**: Search terms are highlighted in results
- **Categories**: Commands are organized by category (Application, Window, Terminal, etc.)
- **Command IDs**: Full command identifiers shown for reference
- **Loading states**: Shows spinner while loading commands
- **Empty states**: Helpful messages when no commands match

## Available Commands

The command palette includes all registered commands from:

### **Application Commands**

- `app.quit` - Quit Application
- `app.reload` - Reload Window
- `app.toggleDevTools` - Toggle Developer Tools
- `app.about` - About Application

### **Window Commands**

- `window.minimize` - Minimize Window
- `window.maximize` - Maximize Window
- `window.close` - Close Window
- `window.toggleFullScreen` - Toggle Full Screen

### **Terminal Commands**

- `terminal.new` - New Terminal
- `terminal.clear` - Clear Terminal
- `terminal.killAll` - Kill All Terminals

### **View Commands**

- `view.commandPalette` - Show Command Palette
- `view.extensions` - Show Extensions
- `view.settings` - Show Settings

### **Theme Commands**

- `theme.selectLight` - Light Theme
- `theme.selectDark` - Dark Theme

### **File Commands**

- `file.openFolder` - Open Folder

## Technical Implementation

### **Architecture**

- **React Component**: Modern React component with hooks
- **TypeScript**: Full type safety and IntelliSense
- **Tailwind CSS**: Utility-first styling with VS Code theme variables
- **IPC Communication**: Secure communication with main process

### **Command System**

Commands are managed by the `CommandManager` in the main process:

- Commands are registered with metadata (title, category, icon)
- IPC handlers expose commands to renderer process
- Extensions can register additional commands
- Command execution is logged and error-handled

### **Performance Features**

- **Lazy loading**: Commands loaded on demand
- **Debounced search**: Efficient search with fuzzy matching
- **Virtual scrolling**: Handles large command lists smoothly
- **Memory efficient**: Minimal DOM manipulation

### **Accessibility**

- **Keyboard navigation**: Full keyboard accessibility
- **Screen reader support**: Proper ARIA labels and roles
- **High contrast**: Works with system high contrast modes
- **Reduced motion**: Respects user's motion preferences

## Usage Examples

### Opening Specific Features

- Type "ext" → Find "Show Extensions"
- Type "term" → Find terminal-related commands
- Type "theme" → Find theme switching commands
- Type "dev" → Find developer tools

### Quick Actions

- Type "quit" → Instantly quit application
- Type "reload" → Reload the current window
- Type "full" → Toggle fullscreen mode

### File Operations

- Type "folder" → Open folder browser
- Type "new" → Create new terminals

## Extension Integration

Extensions can register commands that appear in the command palette:

```typescript
// In extension's activate function
const command = {
  command: 'myExtension.doSomething',
  title: 'Do Something Cool',
  category: 'My Extension',
  icon: 'star',
};

context.registerCommand(command, async () => {
  // Command implementation
});
```

Commands are automatically:

- Added to the command palette
- Searchable and executable
- Properly categorized and displayed

## Development Notes

### **Component Location**

- `src/renderer/components/CommandPalette.tsx` - Main React component
- `src/renderer/hooks/useCommandPalette.ts` - State management hook
- `src/main/managers/command-manager.ts` - Command registration and execution

### **Styling**

- Uses CSS custom properties for theming
- Follows VS Code design patterns
- Responsive and accessible

### **Testing Commands**

Use the browser developer tools console to test command execution:

```javascript
window.electronAPI?.executeCommand('app.toggleDevTools');
```

## Future Enhancements

Potential improvements for the command palette:

- Command history and favorites
- Recent commands quick access
- Command aliases and custom shortcuts
- Command parameters and input prompts
- Command grouping and tabs
- Plugin-specific command filtering
- Voice command integration
- Machine learning for command prediction

The command palette provides a powerful, extensible interface for all application functionality while maintaining the familiar VS Code experience users expect.
