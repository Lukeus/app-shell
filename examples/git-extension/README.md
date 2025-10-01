# Git Extension for App Shell

A comprehensive Git source control integration extension for App Shell, providing VS Code-like Git functionality.

## Features

- **Source Control View**: Dedicated sidebar panel for Git operations
- **File Status Indicators**: Visual indicators for modified, added, and deleted files
- **Staging Operations**: Stage and unstage individual files or all changes
- **Commit Operations**: Create commits with commit messages
- **Remote Operations**: Push and pull changes to/from remote repositories
- **Diff Viewer**: View changes in files with side-by-side diff
- **Repository Management**: Initialize repositories and clone from remote
- **Branch Operations**: Switch branches and manage Git branches
- **Git Configuration**: Manage Git settings and user configuration

## Commands

| Command              | Description               | Keybinding   |
| -------------------- | ------------------------- | ------------ |
| `git.stage`          | Stage selected changes    | -            |
| `git.unstage`        | Unstage selected changes  | -            |
| `git.commit`         | Commit staged changes     | `Ctrl+Enter` |
| `git.push`           | Push commits to remote    | -            |
| `git.pull`           | Pull changes from remote  | -            |
| `git.refresh`        | Refresh Git status        | `F5`         |
| `git.openDiff`       | Open diff view for file   | -            |
| `git.discardChanges` | Discard changes in file   | -            |
| `git.clone`          | Clone repository from URL | -            |
| `git.init`           | Initialize Git repository | -            |

## Configuration

The extension can be configured through the App Shell settings:

```json
{
  "git.enabled": true,
  "git.path": "git",
  "git.autoFetch": true,
  "git.autoPush": false,
  "git.confirmSync": true,
  "git.decorations.enabled": true
}
```

## Requirements

- Git must be installed and available in PATH
- App Shell version 1.0.0 or higher

## Installation

1. Copy this extension to your App Shell extensions directory
2. Restart App Shell to load the extension
3. The Source Control view will appear in the Activity Bar

## Usage

1. Open a folder containing a Git repository (or initialize one)
2. Click the Source Control icon in the Activity Bar
3. View changed files in the Source Control panel
4. Stage changes by clicking the `+` icon
5. Enter a commit message and press `Ctrl+Enter` to commit
6. Use push/pull commands to sync with remote repositories

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Clean

```bash
npm run clean
```

## Architecture

The extension is structured into several key components:

- **GitService**: Core Git operations using simple-git library
- **SourceControlProvider**: Integration with App Shell's source control system
- **Commands**: Command handlers for Git operations
- **UI Components**: React components for the source control view
- **File Decorations**: Visual indicators for file status

## License

MIT
