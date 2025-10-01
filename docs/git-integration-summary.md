# Git Integration Summary

## Overview

This document summarizes the Git workspace integration implementation for the App Shell file explorer. The integration provides real-time Git status decorations, context menu actions, and event-driven updates.

## Implementation Date

October 1, 2025

## Components Modified

### 1. Extension Manager (`src/main/extension-manager.ts`)

**Changes:**

- Added `eventListeners` Map to store event callbacks across extensions
- Added `mainWindow` reference for forwarding events to renderer
- Implemented `setMainWindow()` method
- Enhanced `events.on()` to properly register listeners with cleanup
- Enhanced `events.emit()` to:
  - Notify all registered extension listeners
  - Forward events to renderer process via IPC
- Updated `dispose()` to clean up event listeners

**Purpose:**
Enables cross-extension and extension-to-renderer communication for real-time Git status updates.

### 2. Main Process (`src/main/main.ts`)

**Changes:**

- Added call to `extensionManager.setMainWindow(mainWindow)` after window creation

**Purpose:**
Provides the extension manager with window reference for event forwarding.

### 3. Preload Script (`src/preload/preload.ts`)

**Changes:**

- Added `onExtensionEvent` method to ElectronAPI interface
- Added `removeExtensionEventListener` method
- Implemented IPC listener for 'extension-event' channel
- Exposed event system to renderer via contextBridge

**Purpose:**
Securely bridges extension events from main process to renderer process.

### 4. Explorer View (`src/renderer/components/sidebar/ExplorerView.tsx`)

**Changes:**

- Replaced CustomEvent-based listeners with `electronAPI.onExtensionEvent`
- Added comprehensive event handling for:
  - `git.decorationsChanged` - Updates file decoration map
  - `git.statusChanged` - Updates branch info and decorations
  - `git.repositoryActivated` - Sets repo detected flag
  - `git.noRepository` - Clears all Git state
- Improved decoration map building logic
- Added proper cleanup on unmount

**Purpose:**
Receives and processes Git events from the extension in real-time.

### 5. File Tree Item (`src/renderer/components/explorer/FileTreeItem.tsx`)

**Changes:**

- Improved badge styling:
  - Changed background to use decoration color
  - Added shadow for better visibility
  - Enhanced border styling
  - Improved sizing and positioning
  - Added tooltip on badge hover
- Fixed missing `decorations` prop forwarding to child items

**Purpose:**
Renders Git status badges with improved visual design and ensures decorations propagate through the tree.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Git Extension                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  FileDecorationProvider                                 │    │
│  │  - Monitors Git status every 3 seconds                  │    │
│  │  - Emits git.decorationsChanged event                   │    │
│  │  - Provides decoration data (badge, color, tooltip)     │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  SourceControlProvider                                  │    │
│  │  - Manages Git repository state                         │    │
│  │  - Emits git.statusChanged event                        │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────────┘
                     │ appShell.events.emit()
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Extension Manager (Main Process)               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Event System                                           │    │
│  │  - Stores listeners in Map<string, Set<callback>>      │    │
│  │  - Forwards events to renderer via IPC                 │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────────┘
                     │ webContents.send('extension-event')
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Preload (Security Bridge)                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  onExtensionEvent API                                   │    │
│  │  - Listens for 'extension-event' IPC                   │    │
│  │  - Exposes callback registration to renderer           │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────────┘
                     │ window.electronAPI.onExtensionEvent()
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Renderer (ExplorerView)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Event Handler                                          │    │
│  │  - Receives git.decorationsChanged                      │    │
│  │  - Receives git.statusChanged                           │    │
│  │  - Updates React state (gitDecorations, gitBranch, etc) │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  FileTreeItem                                           │    │
│  │  - Renders badges with colors from decorations prop    │    │
│  │  - Shows tooltips on hover                              │    │
│  │  - Propagates decorations to child items                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow

### 1. Git Status Change Detection

```
Git File Modified
    ↓
FileDecorationProvider.refreshDecorations()
    ↓
appShell.events.emit('git.decorationsChanged', { changedFiles, decorations })
```

### 2. Event Propagation

```
Extension
    ↓ appShell.events.emit()
ExtensionManager.events.emit()
    ↓ Notify extension listeners
    ↓ Forward to renderer
mainWindow.webContents.send('extension-event', { event, args })
    ↓
Preload onExtensionEvent listener
    ↓
Renderer callback with event data
    ↓
ExplorerView updates state
    ↓
FileTreeItem re-renders with new decorations
```

## Git Status Decorations

### Badge Types

| Status | Badge | Color   | Description         |
| ------ | ----- | ------- | ------------------- |
| M      | M     | #ff8c00 | Modified            |
| A      | A     | #00ff00 | Added               |
| D      | D     | #ff0000 | Deleted             |
| R      | R     | #0066cc | Renamed             |
| C      | C     | #9966cc | Copied              |
| U      | U     | #ff0000 | Unmerged/Conflicted |
| ??     | ?     | #999999 | Untracked           |

### Visual Design

- **Badge Position**: Top-right corner of file icon
- **Background**: Matches Git status color
- **Text**: White for maximum contrast
- **Border**: Semi-transparent black for depth
- **Shadow**: Subtle shadow for separation
- **Size**: 12px minimum width, 9px line height
- **Tooltip**: Shows full status description on hover

## Explorer Header Git Indicators

The explorer header shows repository information when a Git repository is detected:

- **Branch Name**: Current Git branch
- **Ahead/Behind Count**: Number of commits ahead/behind remote
- **Repository Icon**: Git icon indicating repository status
- **Tooltip**: Shows full repository details

Example display:

```
 main ↑2↓1
```

## Context Menu Integration

The file context menu dynamically shows Git actions based on:

1. **Repository Detection**: Git actions only visible when `gitRepoDetected` is true
2. **File Status**: Actions available based on file's Git status badge
   - Modified files: Stage, View Diff, Discard Changes
   - Staged files: Unstage
   - Untracked files: Stage

### Available Git Actions

**File-level actions:**

- Stage Changes (Alt+S)
- Unstage Changes (Alt+U)
- View Diff (Alt+D)
- Discard Changes (Alt+R)

**Workspace actions:**

- Stage All Changes
- Commit
- Push
- Pull

## Testing the Integration

### Prerequisites

1. Build the main application:

   ```bash
   pnpm run build
   ```

2. Build the Git extension:

   ```bash
   cd examples/git-extension
   pnpm build
   cd ../..
   ```

3. Ensure Git extension is installed in the extensions directory

### Manual Testing Steps

1. **Launch Application**: `pnpm run dev`

2. **Open Git Repository**:
   - Click folder icon in explorer header
   - Navigate to a Git repository
   - Select the repository folder

3. **Verify Repository Detection**:
   - Check for Git icon with branch name in explorer header
   - Verify ahead/behind counts if applicable

4. **Test File Decorations**:
   - Modify a tracked file in the repository
   - Observe badge appears on file (M badge, orange color)
   - Hover over badge to see tooltip
   - Create a new file
   - Observe ? badge (gray color) for untracked file

5. **Test Context Menu**:
   - Right-click modified file
   - Verify "Git" section appears in context menu
   - Verify appropriate actions are available
   - Test keyboard shortcuts (Alt+S, etc.)

6. **Test Real-time Updates**:
   - Stage a file using context menu
   - Observe badge changes immediately
   - Verify color changes to green for staged files

7. **Test Event System**:
   - Open browser DevTools (Ctrl+Shift+I)
   - Check console for event messages
   - Verify no errors during Git operations

## Known Limitations

1. **Polling-based Updates**: FileDecorationProvider uses 3-second polling. For immediate updates after Git actions, the extension manually triggers refresh.

2. **Single Repository**: Current implementation focuses on single repository. Multi-workspace support is in the backlog.

3. **Performance**: Large repositories with thousands of files may experience slight delays in decoration updates.

4. **Submodules**: Git submodule detection and separate status tracking not yet implemented.

## Future Enhancements

See `docs/TODOS.md` for planned improvements:

- Real-time Git status updates (fswatch/chokidar)
- Multiple workspace folder support
- .gitignore file filtering
- Git history timeline view
- Branch switching dropdown
- Git LFS indicators
- Improved repository detection (submodules, nested repos)

## Troubleshooting

### Decorations Not Showing

1. Check Git extension is installed and activated
2. Verify repository has .git directory
3. Check browser console for errors
4. Ensure Git extension FileDecorationProvider initialized successfully

### Events Not Firing

1. Verify extension manager has main window reference
2. Check IPC channel 'extension-event' is registered
3. Verify electronAPI.onExtensionEvent is called in ExplorerView
4. Check for errors in main process logs

### Badge Styling Issues

1. Clear browser cache
2. Rebuild renderer: `pnpm run build:renderer`
3. Check Tailwind CSS classes are properly applied
4. Verify inline styles are not being overridden

## Performance Considerations

- **Event Throttling**: Decoration changes are batched by FileDecorationProvider
- **Conditional Rendering**: Badges only rendered when decoration exists
- **Memo Optimization**: Consider React.memo for FileTreeItem in large trees
- **Decoration Map**: Uses Record for O(1) lookup by file path

## Security

- All extension events pass through the secure IPC bridge
- Event data is validated in renderer before processing
- File paths are not directly exposed to extensions without validation
- Extension API follows principle of least privilege

## Conclusion

The Git workspace integration provides a solid foundation for Git functionality in the file explorer. The event-driven architecture allows for real-time updates while maintaining security through the Electron IPC bridge. The visual design follows VS Code patterns for familiarity and usability.

Future work will focus on performance optimization, additional Git features, and improved multi-repository support.
