# Collapsible Terminal Panel Guide

App Shell now features a VS Code-style collapsible bottom panel for the integrated terminal, defaulting to the collapsed state.

## Features

### VS Code-Compatible Panel

- **Default Collapsed State**: The terminal panel defaults to collapsed like VS Code
- **Toggle Button**: Click to expand/collapse the panel
- **Tab Support**: Supports multiple tab types (Terminal, Output)
- **Panel Header**: Always visible even when collapsed
- **Smooth Transitions**: Animated panel expansion/collapse

### User Interactions

- **Click Toggle Button**: Expand or collapse the terminal panel
- **Click Tab When Collapsed**: Automatically expands the panel and shows selected tab
- **Keyboard Shortcut**: Cmd/Ctrl+\` to toggle the panel
- **Command Palette**: Commands for showing/hiding the panel

## Panel States

### Collapsed State

- Panel is reduced to just the header (32px)
- Terminal content is hidden
- Toggle button shows downward arrow (▼)

### Expanded State

- Panel displays at saved height (default 300px)
- Terminal content is visible and interactive
- Toggle button shows upward arrow (▲)

## Technical Implementation

### Components

- **PanelManager**: Central class that manages panel state and behavior
- **Integrated Terminal**: Dynamically adjusts to panel size changes
- **Panel Header**: Contains tabs and toggle button
- **Resize Handle**: (Coming soon) For adjustable panel height

### State Management

- **Persistence**: Panel state (collapsed/expanded) is saved in localStorage
- **Default State**: Starts collapsed like VS Code for better UX
- **Tab Memory**: Remembers active tab when reopening
- **Height Persistence**: Maintains user-preferred panel height

## Integration with Commands

```
panel.togglePanel   - View: Toggle Panel
panel.showTerminal  - Terminal: Show Terminal
panel.hidePanel     - View: Hide Panel
```

These commands are accessible through the Command Palette (Cmd/Ctrl+Shift+P)

## Keyboard Shortcuts

- **Cmd/Ctrl+\`**: Toggle terminal panel
  - If collapsed, will expand the panel
  - If expanded, will collapse the panel
  - Matches VS Code's default terminal shortcut

## Future Enhancements

- **Resizable Panel**: Drag handle to resize panel height
- **Panel Position**: Option to dock panel on different sides
- **Multiple Terminals**: Support for multiple terminal instances in tabs
- **Split Terminals**: Support for split terminal views

---

This implements the same ergonomic terminal panel behavior found in VS Code, providing a familiar and efficient interface for accessing the terminal while maximizing workspace area.
