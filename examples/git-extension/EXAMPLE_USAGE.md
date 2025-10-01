# Git Extension Usage Examples

This document provides examples of how to use the Git Extension in your App Shell application.

## Basic Setup

1. **Install the extension** in your App Shell extensions directory
2. **Restart App Shell** to load the extension
3. **Open a folder** containing a Git repository

## Command Examples

### Using Git Commands via Command Palette

```typescript
// Stage a file
appShell.commands.executeCommand('git.stage', '/path/to/file.txt');

// Stage all changes
appShell.commands.executeCommand('git.stage');

// Commit changes
appShell.commands.executeCommand('git.commit');

// Push to remote
appShell.commands.executeCommand('git.push');

// Pull from remote
appShell.commands.executeCommand('git.pull');
```

### Using the Extension API

```typescript
import { api } from '@your-org/git-extension';

// Get the Git service
const gitService = api.getGitService();
if (gitService) {
  // Check repository status
  const status = await gitService.getStatus();
  console.log('Repository status:', status);

  // Get commit history
  const commits = await gitService.getCommitHistory(10);
  console.log('Recent commits:', commits);
}

// Use command API
const commands = api.commands;
if (commands) {
  // Stage a specific file
  await commands.stage('/path/to/file.txt');

  // Create a commit
  await commands.commit();
}
```

## Configuration Examples

### Basic Git Configuration

```json
{
  "git.enabled": true,
  "git.path": "git",
  "git.autoFetch": true,
  "git.autoPush": false,
  "git.confirmSync": true,
  "git.defaultCloneDirectory": "/home/user/projects",
  "git.decorations.enabled": true
}
```

### Advanced Configuration

```json
{
  "git.enabled": true,
  "git.path": "/usr/local/bin/git",
  "git.autoFetch": false,
  "git.autoPush": true,
  "git.confirmSync": false,
  "git.defaultCloneDirectory": "C:\\Projects",
  "git.decorations.enabled": true,
  "git.showActivationMessage": true
}
```

## Source Control View Integration

### Accessing Repository Data

```typescript
import { api } from '@your-org/git-extension';

// Get source control provider
const sourceControl = api.getSourceControlProvider();
if (sourceControl) {
  // Get current repository
  const repository = sourceControl.getRepository();
  if (repository) {
    console.log(`Repository: ${repository.name}`);
    console.log(`Branch: ${repository.branch}`);
    console.log(`Ahead: ${repository.status.ahead}`);
    console.log(`Behind: ${repository.status.behind}`);
  }

  // Get resource groups (staged, unstaged, etc.)
  const groups = sourceControl.getResourceGroups();
  groups.forEach(group => {
    console.log(`${group.label}: ${group.resources.length} files`);
  });
}
```

### Listening to Git Events

```typescript
// Listen for Git status changes
appShell.events.on('git.statusChanged', event => {
  console.log('Git status changed:', event);
  // Update UI accordingly
});

// Listen for repository activation
appShell.events.on('git.repositoryActivated', event => {
  console.log('Git repository activated:', event.repository);
});

// Listen for decoration changes
appShell.events.on('git.decorationsChanged', event => {
  console.log('File decorations changed:', event.changedFiles);
  // Update file explorer decorations
});
```

## UI Component Integration

### Using Source Control View Component

```tsx
import React from 'react';
import { SourceControlView } from '@your-org/git-extension/ui';
import { api } from '@your-org/git-extension';

function MySourceControlPanel() {
  const sourceControlProvider = api.getSourceControlProvider();

  if (!sourceControlProvider) {
    return <div>Git extension not available</div>;
  }

  return (
    <div className="source-control-panel">
      <SourceControlView sourceControlProvider={sourceControlProvider} />
    </div>
  );
}
```

### Custom File Status Display

```tsx
import React, { useState, useEffect } from 'react';
import { api } from '@your-org/git-extension';

function FileStatusBadge({ filePath }: { filePath: string }) {
  const [decoration, setDecoration] = useState(null);

  useEffect(() => {
    const gitService = api.getGitService();
    if (gitService) {
      // Get file decoration
      const fileDecoration = gitService.getFileDecoration?.(filePath);
      setDecoration(fileDecoration);
    }

    // Listen for decoration changes
    const handleDecorationChange = (changedPath: string) => {
      if (changedPath === filePath) {
        // Refresh decoration
        const gitService = api.getGitService();
        const fileDecoration = gitService?.getFileDecoration?.(filePath);
        setDecoration(fileDecoration);
      }
    };

    appShell.events.on('git.decorationsChanged', handleDecorationChange);

    return () => {
      // Cleanup listener
    };
  }, [filePath]);

  if (!decoration) {
    return null;
  }

  return (
    <span
      className="file-status-badge"
      style={{ color: decoration.color }}
      title={decoration.tooltip}
    >
      {decoration.badge}
    </span>
  );
}
```

## Error Handling

### Handling Git Operations

```typescript
import { api } from '@your-org/git-extension';

async function safeGitOperation() {
  try {
    const gitService = api.getGitService();
    if (!gitService) {
      throw new Error('Git service not available');
    }

    // Check if we're in a repository
    const isRepo = await gitService.isRepository();
    if (!isRepo) {
      appShell.window.showWarningMessage('Not in a Git repository');
      return;
    }

    // Perform Git operation
    await gitService.stageAll();
    appShell.window.showInformationMessage('All changes staged');
  } catch (error) {
    console.error('Git operation failed:', error);
    appShell.window.showErrorMessage(`Git operation failed: ${error.message}`);
  }
}
```

## Extension Development

### Extending the Git Extension

```typescript
// Your custom extension that depends on the Git extension
export function activate(context: ExtensionContext) {
  // Wait for Git extension to be available
  const gitExtension = api.getExtensionInfo();

  if (gitExtension?.isActive) {
    setupGitIntegration();
  } else {
    // Listen for Git extension activation
    appShell.events.on('git.repositoryActivated', () => {
      setupGitIntegration();
    });
  }
}

function setupGitIntegration() {
  const gitService = api.getGitService();
  const sourceControl = api.getSourceControlProvider();

  // Your custom Git-related functionality
  if (gitService && sourceControl) {
    console.log('Git integration ready');
    // Add your custom commands, UI, etc.
  }
}
```

## Troubleshooting

### Common Issues

1. **Git not found**: Ensure Git is installed and in PATH
2. **No repository**: Open a folder containing a Git repository
3. **Permission errors**: Ensure proper file permissions
4. **Extension not loading**: Check App Shell extension directory

### Debug Information

```typescript
// Get extension debug info
const info = api.getExtensionInfo();
console.log('Git Extension Info:', info);

// Check Git service status
const gitService = api.getGitService();
if (gitService) {
  const config = gitService.getConfig();
  console.log('Git Configuration:', config);

  const isRepo = await gitService.isRepository();
  console.log('Is Repository:', isRepo);
}
```

This extension provides comprehensive Git integration for your App Shell application, similar to VS Code's Git features. You can customize and extend it based on your specific needs.
