# Git Event-Driven Refresh Implementation Guide

## Current State

The Git context menu integration is **fully functional** with the following components working:

### ✅ Implemented Features

1. **Context Menu with Git Actions**
   - File-level: Stage, Unstage, View Diff, Discard Changes
   - Workspace-level: Stage All, Commit, Push, Pull
   - Dynamic menu items based on Git status badges

2. **Git Status Detection**
   - `gitRepoDetected` flag in ExplorerView
   - `gitDecorations` record with badge/color/tooltip per file
   - Status badges: M (modified), A (added), U (untracked), ? (new)

3. **Git Action Handlers**
   - All Git actions wired up in `handleContextMenuAction`
   - `handleGitAction` callback processes Git commands
   - Confirmation dialogs for destructive actions

## Next Enhancement: Event-Driven Refresh

To make Git status updates automatic and real-time, implement the following:

### 1. File System Watcher Integration

**Goal:** Auto-refresh Git status when files change

```typescript
// In ExplorerView.tsx
useEffect(() => {
  if (!gitRepoDetected) return;

  // Set up file watcher for Git-tracked files
  const watcher = window.electronAPI?.watchFiles?.({
    paths: [rootPath],
    ignoreInitial: true,
    ignored: /(node_modules|\.git)/,
  });

  watcher?.on('change', async (path: string) => {
    // Debounce rapid changes
    clearTimeout(gitRefreshTimeout.current);
    gitRefreshTimeout.current = setTimeout(async () => {
      await refreshGitStatus();
    }, 500);
  });

  return () => {
    watcher?.close();
  };
}, [gitRepoDetected, rootPath]);
```

### 2. Git Command Completion Hooks

**Goal:** Refresh status after Git operations complete

```typescript
// Enhance handleGitAction
const handleGitAction = async (action: string, filePath?: string) => {
  try {
    // Execute Git command
    const result = await window.electronAPI?.executeGitCommand?.({
      action,
      filePath,
      repoPath: rootPath,
    });

    // Auto-refresh Git status after successful command
    if (result.success) {
      await refreshGitStatus();

      // Optional: Show success notification
      showNotification({
        type: 'success',
        message: `Git ${action} completed successfully`,
      });
    }
  } catch (error) {
    console.error('Git action failed:', error);
    showNotification({
      type: 'error',
      message: `Git ${action} failed: ${error.message}`,
    });
  }
};
```

### 3. Extension Event Listeners

**Goal:** Subscribe to Git extension events

```typescript
// In ExplorerView.tsx initialization
useEffect(() => {
  // Listen for Git extension events
  const unsubscribeGitChange = window.electronAPI?.onGitStatusChange?.(event => {
    if (event.repoPath === rootPath) {
      refreshGitStatus();
    }
  });

  const unsubscribeGitCommand = window.electronAPI?.onGitCommandComplete?.(event => {
    if (event.repoPath === rootPath) {
      refreshGitStatus();

      // Update branch info if changed
      if (event.branchChanged) {
        refreshGitBranch();
      }
    }
  });

  return () => {
    unsubscribeGitChange?.();
    unsubscribeGitCommand?.();
  };
}, [rootPath]);
```

### 4. Optimized Git Status Refresh

**Goal:** Avoid redundant Git calls, implement caching

```typescript
const refreshGitStatus = useCallback(async () => {
  if (!gitRepoDetected) return;

  // Check if refresh is already in progress
  if (gitRefreshInProgress.current) {
    gitRefreshPending.current = true;
    return;
  }

  gitRefreshInProgress.current = true;

  try {
    const [statusResult, branchResult] = await Promise.all([
      window.electronAPI?.getGitStatus?.(rootPath),
      window.electronAPI?.getGitBranch?.(rootPath),
    ]);

    if (statusResult) {
      // Update decorations
      const newDecorations: Record<string, GitDecoration> = {};
      statusResult.files.forEach(file => {
        newDecorations[file.path] = {
          badge: file.status,
          color: getStatusColor(file.status),
          tooltip: getStatusTooltip(file.status),
        };
      });
      setGitDecorations(newDecorations);
    }

    if (branchResult) {
      setGitBranch(branchResult.branch);
      setGitAheadBehind(branchResult.aheadBehind);
    }
  } catch (error) {
    console.error('Failed to refresh Git status:', error);
  } finally {
    gitRefreshInProgress.current = false;

    // If another refresh was requested during this one, trigger it now
    if (gitRefreshPending.current) {
      gitRefreshPending.current = false;
      setTimeout(() => refreshGitStatus(), 100);
    }
  }
}, [gitRepoDetected, rootPath]);
```

### 5. Periodic Polling (Fallback)

**Goal:** Ensure status stays fresh even without events

```typescript
// In ExplorerView.tsx
useEffect(() => {
  if (!gitRepoDetected) return;

  // Poll Git status every 30 seconds as fallback
  const interval = setInterval(() => {
    refreshGitStatus();
  }, 30000);

  return () => clearInterval(interval);
}, [gitRepoDetected, refreshGitStatus]);
```

## Implementation Priority

1. **High Priority:** Git command completion hooks (item #2)
   - Immediate visual feedback after user actions
   - Already have Git action handlers in place

2. **Medium Priority:** File system watcher (item #1)
   - Catches external Git operations (command line, other tools)
   - Requires IPC handler implementation in main process

3. **Medium Priority:** Optimized refresh with caching (item #4)
   - Prevents UI jank from redundant Git calls
   - Improves performance on large repos

4. **Low Priority:** Extension event listeners (item #3)
   - Future-proofs for Git extension ecosystem
   - Can be added incrementally

5. **Low Priority:** Periodic polling (item #5)
   - Already have manual refresh (F5)
   - Only needed as safety net

## Testing Checklist

- [ ] Stage file via context menu → Git status updates immediately
- [ ] Unstage file via context menu → Decoration changes
- [ ] Discard changes → File returns to clean state
- [ ] Edit file externally → Status updates within 500ms
- [ ] Commit via context menu → Staged files cleared
- [ ] Push/Pull → Branch ahead/behind updates
- [ ] Switch branch in terminal → ExplorerView reflects new branch
- [ ] Large repo performance → No UI freezing during refresh

## Current Implementation Status

✅ **Complete:** Context menu UI with Git actions  
✅ **Complete:** Git action handlers and IPC calls  
✅ **Complete:** Type-safe Git decoration system  
⏳ **Pending:** Event-driven auto-refresh (optional enhancement)  
⏳ **Pending:** File system watcher integration (optional)

The Git context menu is **production-ready** as-is. Event-driven refresh is an enhancement for better UX.
