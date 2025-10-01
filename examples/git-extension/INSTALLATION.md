# Git Extension - Installation and Setup Guide

## Overview

The Git Extension for App Shell provides comprehensive Git source control integration, similar to VS Code's Git features. It includes staging, committing, pushing, pulling, branch management, file decorations, and a complete source control UI.

## Features

✅ **Complete Git Operations**

- Stage/unstage files and hunks
- Commit with messages and conventional commit support
- Push/pull from remote repositories
- Branch creation and switching
- Repository initialization and cloning

✅ **Visual Source Control Interface**

- Dedicated source control sidebar panel
- File status indicators and decorations
- Diff viewing capabilities
- Interactive staging controls

✅ **File Explorer Integration**

- Visual file status decorations
- Git status badges on files
- Color-coded file states

✅ **Command System Integration**

- All Git operations available via command palette
- Keyboard shortcuts support
- Contextual commands

✅ **Configuration Management**

- Git user configuration (name/email)
- Extension settings and preferences
- Remote repository management

## Installation

### Prerequisites

1. **Git** must be installed and available in your system PATH
2. **App Shell** version 1.0.0 or higher
3. **Node.js** and **npm** (for building from source)

### Option 1: Install Pre-built Extension

1. Copy the entire `git-extension` folder to your App Shell extensions directory
2. Restart App Shell to load the extension
3. The Source Control icon will appear in the Activity Bar

### Option 2: Build from Source

1. **Clone or download** the extension source code
2. **Install dependencies**:
   ```bash
   cd git-extension
   npm install
   ```
3. **Build the extension**:
   ```bash
   npm run build
   ```
4. **Copy to extensions directory**:
   - Copy the entire folder to your App Shell extensions directory
   - Ensure the `dist/` folder is included

### Extensions Directory Locations

- **Windows**: `%APPDATA%/AppShell/extensions/git-extension`
- **macOS**: `~/Library/Application Support/AppShell/extensions/git-extension`
- **Linux**: `~/.config/AppShell/extensions/git-extension`

## Initial Setup

### 1. Configure Git User (First Time)

```json
{
  \"git.user.name\": \"Your Name\",
  \"git.user.email\": \"your.email@example.com\"
}
```

Or use the command palette:

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run \"Git: Configure Settings\"
3. Select \"Set User Name and Email\"

### 2. Extension Settings

Add to your App Shell settings:

```json
{
  \"git.enabled\": true,
  \"git.path\": \"git\",
  \"git.autoFetch\": true,
  \"git.autoPush\": false,
  \"git.confirmSync\": true,
  \"git.decorations.enabled\": true,
  \"git.defaultCloneDirectory\": \"/path/to/your/projects\"
}
```

### 3. Open a Git Repository

1. **Open folder** containing a Git repository, or
2. **Initialize new repository** using \"Git: Initialize Repository\", or
3. **Clone repository** using \"Git: Clone Repository\"

## Usage

### Basic Workflow

1. **View Changes**: Click the Source Control icon in Activity Bar
2. **Stage Files**: Click `+` next to files or use \"Stage All\"
3. **Commit**: Enter commit message and press `Ctrl+Enter`
4. **Push/Pull**: Use toolbar buttons or commands

### Commands Available

| Command              | Description            | Shortcut     |
| -------------------- | ---------------------- | ------------ |
| `git.stage`          | Stage selected files   | -            |
| `git.unstage`        | Unstage selected files | -            |
| `git.commit`         | Commit staged changes  | `Ctrl+Enter` |
| `git.push`           | Push to remote         | -            |
| `git.pull`           | Pull from remote       | -            |
| `git.refresh`        | Refresh Git status     | `F5`         |
| `git.openDiff`       | View file changes      | -            |
| `git.discardChanges` | Discard file changes   | -            |
| `git.switchBranch`   | Switch Git branch      | -            |
| `git.clone`          | Clone repository       | -            |
| `git.init`           | Initialize repository  | -            |

### File Status Indicators

- 🟢 **Green M**: Modified and staged
- 🟠 **Orange M**: Modified (unstaged)
- 🟢 **Green A**: Added (new file)
- 🔴 **Red D**: Deleted
- 🔵 **Blue R**: Renamed
- ⚪ **Gray ?**: Untracked

## Architecture

The extension consists of several key components:

### Core Services

- **GitService**: Git operations using simple-git library
- **SourceControlProvider**: Integration with App Shell's source control system
- **FileDecorationProvider**: Visual file status indicators
- **GitConfigManager**: Configuration and settings management

### UI Components

- **SourceControlView**: Main source control panel (React)
- **FileStatusItem**: Individual file status display
- **CommitBox**: Commit message input with conventional commit support
- **RepositoryHeader**: Repository information and quick actions

### Command System

- **GitCommands**: Command handlers for all Git operations
- Integration with App Shell's command palette
- Contextual menus and shortcuts

## Development

### Project Structure

```
git-extension/
├── src/
│   ├── services/           # Core Git services
│   ├── ui/                # React UI components
│   ├── commands/          # Command handlers
│   ├── types.ts           # TypeScript interfaces
│   └── extension.ts       # Main extension entry
├── dist/                  # Compiled JavaScript
├── package.json           # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── README.md             # Documentation
```

### Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run watch

# Clean build artifacts
npm run clean
```

### Extending the Extension

The extension exposes an API for other extensions:

```typescript
import { api } from '@your-org/git-extension';

// Get Git service
const gitService = api.getGitService();

// Use commands
await api.commands.stage('/path/to/file');
await api.commands.commit();
```

## Troubleshooting

### Common Issues

1. **\"Git not found\"**
   - Ensure Git is installed and in your system PATH
   - Set `git.path` in settings if Git is in a custom location

2. **Extension not loading**
   - Check App Shell extensions directory
   - Ensure `dist/` folder exists with compiled JavaScript
   - Check developer console for errors

3. **No repository detected**
   - Open a folder containing a `.git` directory
   - Initialize a new repository with \"Git: Initialize Repository\"

4. **Commands not working**
   - Ensure you're in a Git repository
   - Check Git user configuration is set
   - Verify file permissions

### Debug Information

Use the command \"Git: View Current Configuration\" to see:

- Extension status and settings
- Git user configuration
- Repository information
- Remote repositories

### Support

- Check the developer console (`F12`) for error messages
- Enable verbose logging in extension settings
- Verify Git installation: `git --version`

## Contributing

To contribute to the Git Extension:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Enjoy using Git in your App Shell! 🚀**
