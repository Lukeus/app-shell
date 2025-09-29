# App Shell

[![CI](https://img.shields.io/github/actions/workflow/status/Lukeus/app-shell/ci.yml?branch=main&logo=github)](https://github.com/Lukeus/app-shell/actions/workflows/ci.yml)
[![Electron Release](https://img.shields.io/github/actions/workflow/status/Lukeus/app-shell/electron-release.yml?branch=main&label=Electron%20Release&logo=github)](https://github.com/Lukeus/app-shell/actions/workflows/electron-release.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/Lukeus/app-shell/codeql.yml?branch=main&label=CodeQL&logo=github)](https://github.com/Lukeus/app-shell/actions/workflows/codeql.yml)

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Lukeus/app-shell?sort=semver&logo=github)](https://github.com/Lukeus/app-shell/releases/latest)
[![GitHub all releases](https://img.shields.io/github/downloads/Lukeus/app-shell/total?logo=github)](https://github.com/Lukeus/app-shell/releases)
[![GitHub issues](https://img.shields.io/github/issues/Lukeus/app-shell?logo=github)](https://github.com/Lukeus/app-shell/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Lukeus/app-shell?logo=github)](https://github.com/Lukeus/app-shell/pulls)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

[![Platform Support](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?logo=electron)](#getting-started)
[![Architecture](https://img.shields.io/badge/Architecture-x64%20%7C%20ARM64-blue)](#getting-started)
[![License](https://img.shields.io/github/license/Lukeus/app-shell?logo=open-source-initiative)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

An enterprise-grade, cross-platform Electron application shell with extension support - similar to VS Code but designed as a reusable template for building extensible desktop applications.

## Preview

Coming soon.

## 📥 Download

[![Latest Release](https://img.shields.io/github/v/release/Lukeus/app-shell?label=Download&logo=github&style=for-the-badge)](https://github.com/Lukeus/app-shell/releases/latest)

**Quick Downloads:**

| Platform                                                                             | Package                                                                                                                                                                                                                                                     | Architecture |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| ![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white) | [.exe Installer](https://github.com/Lukeus/app-shell/releases/latest) • [.msi Package](https://github.com/Lukeus/app-shell/releases/latest)                                                                                                                 | x64, ARM64   |
| ![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)       | [.dmg Disk Image](https://github.com/Lukeus/app-shell/releases/latest) • [.zip Archive](https://github.com/Lukeus/app-shell/releases/latest)                                                                                                                | x64, ARM64   |
| ![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)       | [.AppImage](https://github.com/Lukeus/app-shell/releases/latest) • [.deb](https://github.com/Lukeus/app-shell/releases/latest) • [.rpm](https://github.com/Lukeus/app-shell/releases/latest) • [.snap](https://github.com/Lukeus/app-shell/releases/latest) | x64, ARM64   |

> **Note:** Releases are automatically built and published when changes are pushed to the main branch. All packages are code-signed and verified.

## Features

### 🎯 Core Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Extension System**: VS Code-style extension architecture
- **Command Palette**: Searchable command interface
- **Integrated Terminal**: OS-native terminal with xterm.js
- **Theme System**: Light/dark themes with full customization
- **Settings Management**: Persistent configuration with UI
- **Extension Store**: Built-in marketplace for extensions

### 🏗️ Architecture

- **Clean Architecture**: Modular, maintainable codebase
- **TypeScript**: Full type safety throughout
- **IPC Communication**: Secure main-renderer communication
- **State Management**: Persistent application state
- **Plugin API**: Rich extension development API

#### System Architecture Overview

```mermaid
graph TB
    subgraph "Electron App"
        subgraph "Main Process (Node.js)"
            Main["main.ts<br/>Application Entry"]
            WM["WindowManager<br/>Window Lifecycle"]
            EM["ExtensionManager<br/>Plugin System"]
            SM["SettingsManager<br/>Configuration"]
            TM["TerminalManager<br/>Terminal Integration"]
            IPC["IPCManager<br/>Communication Bridge"]
            Logger["Logger<br/>Centralized Logging"]
        end

        subgraph "Preload Script (Bridge)"
            Preload["preload.ts<br/>Security Bridge"]
            API["Exposed APIs<br/>window.electronAPI"]
        end

        subgraph "Renderer Process (Chromium)"
            React["React App<br/>UI Framework"]
            Components["UI Components<br/>TitleBar, Sidebar, etc."]
            Context["React Context<br/>State Management"]
            Terminal["xterm.js<br/>Terminal Emulator"]
        end
    end

    subgraph "Extensions"
        Ext1["Extension 1<br/>Custom Logic"]
        Ext2["Extension 2<br/>Themes/Commands"]
        ExtN["Extension N<br/>Marketplace"]
    end

    subgraph "External Systems"
        FS["File System<br/>Settings, Logs"]
        OS["Operating System<br/>Terminal, Shell"]
        Network["Network<br/>Extension Store"]
    end

    %% Main Process connections
    Main --> WM
    Main --> EM
    Main --> SM
    Main --> TM
    Main --> IPC
    Main --> Logger

    %% IPC Bridge
    IPC <--> Preload
    Preload --> API
    API <--> React

    %% Renderer connections
    React --> Components
    React --> Context
    React --> Terminal

    %% Extension system
    EM --> Ext1
    EM --> Ext2
    EM --> ExtN

    %% External connections
    SM <--> FS
    TM <--> OS
    EM <--> Network
    Logger --> FS

    %% Styling
    classDef mainProcess fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef renderer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef preload fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef extension fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fafafa,stroke:#424242,stroke-width:2px

    class Main,WM,EM,SM,TM,IPC,Logger mainProcess
    class React,Components,Context,Terminal renderer
    class Preload,API preload
    class Ext1,Ext2,ExtN extension
    class FS,OS,Network external
```

## 📊 Platform Flow Diagrams

### Application Startup Sequence

```mermaid
sequenceDiagram
    participant User
    participant Main as Main Process
    participant WM as WindowManager
    participant EM as ExtensionManager
    participant SM as SettingsManager
    participant TM as TerminalManager
    participant Preload
    participant Renderer as Renderer Process
    participant UI as React UI

    User->>Main: Launch Application

    Note over Main: Application Initialization
    Main->>Main: Initialize Logger
    Main->>SM: Initialize Settings
    SM->>SM: Load user preferences
    SM-->>Main: Settings loaded

    Main->>WM: Create main window
    WM->>WM: Configure window options
    WM->>Preload: Load preload script
    Preload->>Preload: Setup IPC bridge
    WM->>Renderer: Create renderer process
    Renderer->>UI: Initialize React app

    UI->>Preload: Request initial state
    Preload->>Main: IPC: app:getInitialState
    Main->>SM: Get current settings
    SM-->>Main: Return settings
    Main-->>Preload: Return initial state
    Preload-->>UI: Provide initial state

    Main->>EM: Initialize extensions
    EM->>EM: Scan extension directories
    EM->>EM: Validate extension manifests
    EM->>EM: Load enabled extensions
    EM-->>Main: Extensions initialized

    Main->>TM: Initialize terminal
    TM->>TM: Detect system shell
    TM-->>Main: Terminal ready

    UI->>UI: Render application UI
    UI->>Preload: Request terminal creation
    Preload->>TM: Create new terminal
    TM->>TM: Spawn shell process
    TM-->>Preload: Terminal created
    Preload-->>UI: Terminal ready

    Note over User,UI: Application Ready
    UI-->>User: Display interface
```

### Extension Loading Flow

```mermaid
sequenceDiagram
    participant EM as ExtensionManager
    participant FS as File System
    participant Ext as Extension
    participant CM as CommandManager
    participant TM as ThemeManager
    participant UI as UI Components

    Note over EM: Extension Discovery Phase
    EM->>FS: Scan extensions directory
    FS-->>EM: Return extension folders

    loop For each extension
        EM->>FS: Read package.json
        FS-->>EM: Extension manifest
        EM->>EM: Validate manifest schema

        alt Valid extension
            EM->>EM: Add to extension registry
        else Invalid extension
            EM->>EM: Log validation error
            EM->>EM: Skip extension
        end
    end

    Note over EM: Extension Loading Phase
    loop For each enabled extension
        EM->>FS: Load extension module
        FS-->>EM: Extension code
        EM->>Ext: Call activate(context)

        Note over Ext: Extension Initialization
        Ext->>Ext: Register event listeners

        alt Has commands
            Ext->>CM: Register commands
            CM->>CM: Add to command registry
        end

        alt Has themes
            Ext->>TM: Register themes
            TM->>TM: Add to theme registry
        end

        alt Has UI contributions
            Ext->>UI: Register UI components
            UI->>UI: Update interface
        end

        Ext-->>EM: Activation complete
    end

    EM->>EM: Extensions loaded successfully
```

### Command Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant CP as Command Palette
    participant Preload
    participant IPC as IPC Manager
    participant CM as Command Manager
    participant Ext as Extension
    participant Main as Main Process

    User->>UI: Press Ctrl+Shift+P
    UI->>CP: Open command palette
    CP->>CP: Display command list
    CP->>Preload: Get available commands
    Preload->>IPC: commands:list
    IPC->>CM: Get all commands
    CM-->>IPC: Return command list
    IPC-->>Preload: Commands data
    Preload-->>CP: Command list
    CP->>CP: Update UI with commands

    User->>CP: Type search query
    CP->>CP: Filter commands (fuzzy search)
    CP->>CP: Update display

    User->>CP: Select command
    CP->>Preload: Execute command
    Preload->>IPC: commands:execute
    IPC->>CM: Execute command by ID

    alt Built-in command
        CM->>Main: Execute built-in handler
        Main->>Main: Perform action
        Main-->>CM: Action complete
    else Extension command
        CM->>Ext: Call command handler
        Ext->>Ext: Execute custom logic
        Ext-->>CM: Execution complete
    end

    CM-->>IPC: Command executed
    IPC-->>Preload: Execution result
    Preload-->>CP: Result
    CP->>CP: Close command palette
    CP->>UI: Return focus to main UI

    Note over User,UI: Command completed
```

### Terminal Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Terminal UI
    participant Preload
    participant TM as TerminalManager
    participant PTY as node-pty
    participant Shell as System Shell
    participant XTerm as xterm.js

    User->>UI: Click "New Terminal"
    UI->>Preload: Create new terminal
    Preload->>TM: terminal:create

    TM->>TM: Detect system shell
    TM->>PTY: Create pseudo-terminal
    PTY->>Shell: Spawn shell process
    Shell-->>PTY: Shell ready
    PTY-->>TM: PTY created

    TM->>TM: Setup data handlers
    TM->>TM: Generate terminal ID
    TM-->>Preload: Terminal created (ID)
    Preload-->>UI: Terminal ready

    UI->>XTerm: Initialize terminal emulator
    XTerm->>XTerm: Setup terminal display
    XTerm-->>UI: Terminal UI ready

    Note over User,Shell: Terminal Active

    User->>XTerm: Type command
    XTerm->>Preload: Send input data
    Preload->>TM: terminal:input
    TM->>PTY: Write to shell
    PTY->>Shell: Execute command

    Shell->>PTY: Output data
    PTY->>TM: Data event
    TM->>Preload: terminal:data
    Preload->>XTerm: Display output
    XTerm->>UI: Update terminal display
    UI-->>User: Show command output

    Note over User,UI: Interactive Terminal Session
```

## Project Status

### ✅ Completed (Foundation)

- Project structure and build configuration
- TypeScript definitions and interfaces
- Main process architecture with managers
- Cross-platform window management
- Settings persistence system
- Terminal integration framework
- Basic extension system architecture
- Secure IPC communication bridge
- Logging system with file rotation
- Theme system foundation

### 🔧 In Progress

- TypeScript compilation errors resolution
- Extension loading implementation
- Command palette system enhancements

### 📋 Next Up

1. Complete extension system implementation
2. Build command palette with fuzzy search
3. Create settings UI with dynamic tabs
4. Implement extension store interface
5. Add comprehensive testing suite
6. Create extension development documentation

## Getting Started

### Prerequisites

- Node.js >= 18.0.0 (v20 LTS recommended)
- pnpm >= 8.0.0 (v8.14 or later recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/lukeusadams/app-shell.git
cd app-shell

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Building

```bash
# Build for current platform
pnpm run package

# Build for specific platforms
pnpm run package:win    # Windows
pnpm run package:mac    # macOS
pnpm run package:linux  # Linux

# Build for all platforms
pnpm run package:all
```

## Development

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── main.ts           # Application entry point
│   ├── window-manager.ts # Window management
│   ├── extension-manager.ts # Extension system
│   ├── terminal-manager.ts  # Terminal integration
│   └── settings-manager.ts  # Configuration
├── renderer/       # Frontend application
│   ├── index.ts          # Renderer entry point
│   ├── index.html        # Application template
│   ├── components/       # UI components
│   └── services/         # Business logic
├── preload/        # Secure IPC bridge
└── types/          # TypeScript definitions
```

### Available Scripts

```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix linting issues
pnpm format        # Format code with Prettier
pnpm package       # Package for current platform
pnpm test          # Run end-to-end tests
pnpm test:headed   # Run tests in headed mode
pnpm test:ui       # Open test UI for debugging
pnpm test:debug    # Run tests in debug mode
pnpm test:report   # View test results report
pnpm screenshot    # Capture application screenshots
```

### Testing

This project includes comprehensive testing:

- **Build Verification**: Automated build testing across platforms
- **E2E Tests**: Playwright-based Electron testing (run locally with `pnpm test`)
- **Linting**: ESLint with TypeScript support (`pnpm lint`)
- **Formatting**: Prettier code formatting (`pnpm format`)
- **Security**: Automated dependency auditing

**CI/CD**: The GitHub Actions pipeline provides comprehensive automation including cross-platform builds, code quality checks, security scanning, and automatic releases.

### 🚀 CI/CD Pipeline Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GitHub
    participant CI as GitHub Actions
    participant Build as Build Matrix
    participant Release as Release Process
    participant Users

    Dev->>GitHub: Push to main branch
    GitHub->>CI: Trigger CI workflow

    Note over CI: Parallel Job Execution

    par Lint & Format
        CI->>CI: ESLint checks
        CI->>CI: Prettier formatting
        CI->>CI: TypeScript compilation
    and Build Matrix
        CI->>Build: Ubuntu + Node 18,20
        CI->>Build: Windows + Node 18,20
        CI->>Build: macOS + Node 18,20
        Build->>Build: Install dependencies
        Build->>Build: Build application
        Build->>Build: Verify artifacts
    and Security
        CI->>CI: Dependency audit
        CI->>CI: CodeQL analysis
        CI->>CI: Security scanning
    end

    alt All jobs pass
        Note over CI: Success - Trigger Release
        CI->>Release: Start release process

        par Cross-Platform Packaging
            Release->>Release: Build Linux (.AppImage, .deb, .rpm, .snap)
            Release->>Release: Build Windows (.exe, .msi)
            Release->>Release: Build macOS (.dmg, .zip)
        end

        Release->>Release: Calculate version
        Release->>Release: Create git tag
        Release->>Release: Update package.json
        Release->>GitHub: Create GitHub release
        Release->>GitHub: Upload all artifacts
        GitHub->>Users: 🎉 New release available!

    else Any job fails
        CI->>Dev: ❌ Build failed notification
        Note over Dev: Fix issues and retry
    end
```

#### Build Status

| Component        | Status                                                                                                                                                    | Description                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Linting**      | [![Lint Status](https://img.shields.io/github/workflow/status/Lukeus/app-shell/CI?label=lint)](https://github.com/Lukeus/app-shell/actions)               | ESLint + Prettier code quality     |
| **Build Matrix** | [![Build Status](https://img.shields.io/github/workflow/status/Lukeus/app-shell/CI?label=build)](https://github.com/Lukeus/app-shell/actions)             | Cross-platform build verification  |
| **Security**     | [![Security Status](https://img.shields.io/github/workflow/status/Lukeus/app-shell/Security?label=security)](https://github.com/Lukeus/app-shell/actions) | Dependency audit + CodeQL          |
| **Release**      | [![Release Status](https://img.shields.io/github/workflow/status/Lukeus/app-shell/CI?label=release)](https://github.com/Lukeus/app-shell/releases)        | Automated packaging + distribution |

> 💡 **Tip**: E2E tests run locally with `pnpm test` due to Electron's complexity in CI environments. All other quality checks are automated.

## Extension Development

### Creating Extensions

Extensions are the primary way to extend the functionality of App Shell. Each extension is a directory with a `package.json` file that defines its metadata and contributions.

#### Basic Extension Structure

```
my-extension/
├── package.json      # Extension manifest
├── extension.ts      # Main extension file
├── themes/          # Theme contributions
└── commands/        # Command contributions
```

#### Example Extension Package.json

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "description": "An example extension",
  "main": "./extension.js",
  "contributes": {
    "commands": [
      {
        "command": "myExtension.helloWorld",
        "title": "Hello World"
      }
    ],
    "themes": [
      {
        "id": "my-theme",
        "label": "My Theme",
        "path": "./themes/my-theme.json"
      }
    ]
  },
  "engines": {
    "app-shell": "^1.0.0" // Update to match your app-shell version
  }
}
```

### Extension API

Extensions have access to a rich API for interacting with the application:

```typescript
import { ExtensionContext, commands, window } from 'app-shell';

export function activate(context: ExtensionContext) {
  // Register a command
  const disposable = commands.registerCommand('myExtension.helloWorld', () => {
    window.showInformationMessage('Hello World from my extension!');
  });

  context.subscriptions.push(disposable);
}
```

## Theming

### Creating Themes

Themes define the visual appearance of the application. They are JSON files that specify colors for various UI elements.

```json
{
  "id": "my-theme",
  "name": "My Custom Theme",
  "type": "dark",
  "colors": {
    "app.background": "#1e1e1e",
    "app.foreground": "#d4d4d4",
    "panel.background": "#252526",
    "terminal.background": "#1e1e1e",
    "terminal.foreground": "#d4d4d4"
  }
}
```

## Testing

### End-to-End Testing with Playwright

App Shell uses Playwright for comprehensive end-to-end testing of the Electron application.

#### Running Tests

```bash
# Run all tests in headless mode
pnpm test

# Run tests with browser visible (helpful for debugging)
pnpm test:headed

# Open interactive test UI
pnpm test:ui

# Run specific test file
pnpm test tests/e2e/app-startup.spec.ts

# Run tests in debug mode (with debugger)
pnpm test:debug

# View test results report
pnpm test:report
```

#### Test Categories

- **Application Startup**: Tests basic app initialization, window creation, and UI structure
- **Command Palette**: Tests keyboard shortcuts, search functionality, and command execution
- **Terminal Integration**: Tests terminal panel, tab switching, and xterm.js integration

#### Writing Tests

Tests are located in the `tests/e2e/` directory and follow Playwright conventions:

```typescript
import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async () => {
    // Test implementation
  });
});
```

#### CI/CD Integration

Tests automatically run in CI with the following features:

- Retry failed tests up to 2 times
- Generate HTML and JUnit reports
- Capture screenshots and videos on failure
- Upload test artifacts

### Developer Tools

By default, the application launches without DevTools opened for a clean user experience. You can enable DevTools when needed:

```bash
# Enable DevTools via environment variable
OPEN_DEVTOOLS=true pnpm start:prod

# Enable DevTools via command line flag
pnpm start:prod -- --devtools

# In development with webpack dev server
pnpm dev  # DevTools can be toggled with F12 or Cmd+Opt+I
```

**DevTools Shortcuts:**

- **Toggle**: `F12` or `Cmd+Option+I` (macOS) / `Ctrl+Shift+I` (Windows/Linux)
- **Inspect Element**: `Cmd+Shift+C` (macOS) / `Ctrl+Shift+C` (Windows/Linux)

## Configuration

### Application Settings

App Shell uses a JSON-based configuration system. Settings can be modified through the UI or directly in the settings file.

Default settings location:

- **Windows**: `%APPDATA%/app-shell/settings.json`
- **macOS**: `~/Library/Application Support/app-shell/settings.json`
- **Linux**: `~/.config/app-shell/settings.json`

### Example Settings

```json
{
  "theme": "dark",
  "terminal": {
    "shell": "/bin/zsh",
    "fontSize": 14,
    "fontFamily": "Menlo, Monaco, monospace"
  },
  "extensions": {
    "enabled": ["extension1", "extension2"]
  }
}
```

## 🔒 Security

### Security Badges Status

| Security Check         | Status                                                                                                                                                                                             | Description                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **CodeQL Analysis**    | [![CodeQL](https://github.com/Lukeus/app-shell/workflows/CodeQL/badge.svg)](https://github.com/Lukeus/app-shell/actions/workflows/codeql.yml)                                                      | GitHub's semantic code analysis             |
| **Security Audit**     | [![Security Audit](https://github.com/Lukeus/app-shell/workflows/Security/badge.svg)](https://github.com/Lukeus/app-shell/actions/workflows/security.yml)                                          | Automated dependency vulnerability scanning |
| **Snyk Monitoring**    | [![Known Vulnerabilities](https://snyk.io/test/github/Lukeus/app-shell/badge.svg)](https://snyk.io/test/github/Lukeus/app-shell)                                                                   | Real-time vulnerability monitoring          |
| **License Compliance** | [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FLukeus%2Fapp-shell.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FLukeus%2Fapp-shell?ref=badge_shield) | Open source license compliance              |

### Electron Security Best Practices

App Shell implements comprehensive Electron security measures:

#### ✅ **Core Security Features**

- **Context Isolation**: ✅ Enabled - Prevents access between main world and isolated world
- **Node.js Integration**: ❌ Disabled in renderers - No direct Node.js access from UI
- **Remote Module**: ❌ Disabled - No remote module usage
- **Preload Scripts**: ✅ Secure - Limited API exposure via contextBridge
- **Content Security Policy**: ✅ Implemented - Prevents XSS and code injection
- **Sandboxed Renderers**: ✅ Enabled - Renderer processes run in sandbox mode

#### 🛡️ **IPC Security**

- **Secure Channels**: All IPC communication uses predefined, validated channels
- **Input Validation**: All IPC messages are type-checked and validated
- **No Arbitrary Code**: Extension system prevents arbitrary code execution
- **Permission Model**: Extensions require explicit permissions for sensitive operations

#### 🔐 **Extension Security**

- **Manifest Validation**: All extensions must have valid manifests
- **Code Signing**: Extensions are verified before loading
- **Sandbox Isolation**: Extensions run in isolated contexts
- **API Restrictions**: Limited API surface exposed to extensions

#### 📊 **Security Monitoring**

- **Automated Scans**: Daily security audits via GitHub Actions
- **Dependency Checks**: Automated vulnerability scanning with Snyk
- **Code Analysis**: Static analysis with CodeQL
- **License Compliance**: FOSSA license scanning

### Security Reporting

Found a security issue? Please report it responsibly:

- **Email**: [security@lukeus.dev](mailto:security@lukeus.dev)
- **GPG**: Available upon request
- **Response Time**: Within 48 hours
- **Disclosure**: Coordinated disclosure preferred

See our [Security Policy](SECURITY.md) for detailed reporting guidelines.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Run `pnpm lint` and `pnpm format` before committing
- Write meaningful commit messages

## License

MIT License - see LICENSE file for details.

## Roadmap

### Phase 1: Core Features (In Progress)

- [x] Basic extension system architecture
- [x] Terminal integration framework
- [x] Theme system foundation
- [ ] Complete extension system implementation
- [ ] Command palette with fuzzy search
- [ ] Settings UI with dynamic tabs

### Phase 2: Extension Ecosystem

- [ ] Plugin marketplace integration
- [ ] Extension store interface
- [ ] Developer documentation
- [ ] Sample extension templates
- [ ] Extension debugging support

### Phase 3: Advanced Features

- [ ] Multiple terminal tabs
- [ ] Workspace support
- [ ] Git integration
- [ ] File explorer
- [ ] Advanced theme system
- [ ] Performance monitoring dashboard

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: [Wiki](https://github.com/lukeusadams/app-shell/wiki)

---

Built with ❤️ using Electron, TypeScript, and modern web technologies.
