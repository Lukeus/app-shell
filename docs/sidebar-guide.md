# VS Code-Style Sidebar Guide

App Shell now features a VS Code-inspired sidebar system with an activity bar and collapsible panels.

## Architecture

### Activity Bar

- **Location**: Far left vertical bar (48px wide)
- **Purpose**: Navigation between different views
- **Features**:
  - Visual icons for each view
  - Active state indicator with blue accent
  - Hover states for better UX
  - Toggle button at bottom

### Sidebar Panel

- **Location**: Next to activity bar (320px wide when expanded)
- **Purpose**: Display content for the active view
- **Features**:
  - Collapsible with smooth animation
  - View-specific content
  - Header with title and actions
  - Persistent state across sessions

## Available Views

### 🗂️ Explorer (Coming Soon)

- File and folder navigation
- Project workspace management

### 📦 Extensions

- List of installed extensions
- Extension management controls
- Refresh button

### 🏪 Marketplace

- Browse available plugins
- Install/uninstall functionality
- Search and filtering
- Update management

### ⚙️ Settings

- Theme selection
- Terminal configuration
- Application preferences

## User Interactions

### Navigation (VS Code-Style)

- **Click Different Activity Item**: Switch to that view and expand sidebar if collapsed
- **Click Active Item**: Toggle sidebar visibility (collapse if open, expand if closed)
- **Toggle Button**: Show/hide sidebar while preserving current view
- **Close Button**: Hide sidebar while preserving current view

### State Management

- Sidebar remembers last active view
- Collapse state persists across sessions
- Smooth animations for better UX

## Technical Implementation

### Components

- `SidebarManager`: Handles state and navigation logic
- `Marketplace`: Plugin marketplace functionality
- Activity bar: Pure HTML/CSS with JavaScript events

### CSS Classes

- `.activity-bar`: Main activity bar container
- `.activity-item`: Individual navigation items
- `.activity-item.active`: Active state styling
- `.sidebar`: Main sidebar panel
- `.sidebar.collapsed`: Hidden state
- `.sidebar-view`: Individual view containers

### Event Handling

- Activity bar clicks toggle views
- Sidebar state changes are persisted
- View-specific actions are handled appropriately

## Keyboard Shortcuts (Planned)

- `Cmd+B` / `Ctrl+B`: Toggle sidebar
- `Cmd+Shift+E` / `Ctrl+Shift+E`: Show Extensions
- `Cmd+Shift+X` / `Ctrl+Shift+X`: Show Marketplace
- `Cmd+,` / `Ctrl+,`: Show Settings

## Customization

The sidebar system is designed to be extensible. New views can be added by:

1. Adding HTML structure in `index.html`
2. Registering the view in `SidebarManager`
3. Adding appropriate styling
4. Implementing view-specific logic

This creates a familiar, professional interface that matches modern code editor expectations while maintaining the App Shell's enterprise-grade architecture.
