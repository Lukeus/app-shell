# WARP.md - App Shell Project Context

## ⚠️ CRITICAL PROJECT RULES - READ FIRST ⚠️

### **NEVER TAKE SHORTCUTS - QUALITY ABOVE ALL**

🛑 **STOP**: Before making any changes, remember:

- **Quality and correctness ALWAYS take precedence over speed**
- **No shortcuts, hacks, or "quick fixes" are acceptable**
- **If the task seems too complex, break it into smaller, well-architected pieces**
- **Every line of code must be production-ready and maintainable**
- **Test thoroughly on all target platforms (Windows, macOS, Linux)**
- **Follow TypeScript strict mode - no `any` types or compiler warnings**
- **Implement proper error handling with comprehensive logging**
- **Maintain security boundaries - never bypass Electron security features**

**Enterprise-grade means enterprise-quality. No exceptions.**

---

## Project Overview

App Shell is an enterprise-grade, cross-platform Electron application shell designed as a reusable template for building extensible desktop applications. Think VS Code's architecture, but as a foundation for any type of application that needs extension support, theming, and cross-platform compatibility.

## Architecture Philosophy

This project follows clean architecture principles with strict separation of concerns:

- **Main Process**: Node.js backend handling system integration
- **Renderer Process**: Frontend UI using modern web technologies
- **Preload Scripts**: Security bridge between main and renderer
- **Extension System**: Plugin architecture for extensibility

## Key Technical Decisions

### Language & Framework

- **TypeScript**: All code must be TypeScript with strict type checking
- **Electron**: Cross-platform desktop framework
- **pnpm**: Package manager for better dependency management
- **Webpack**: Module bundling with separate configs for each process

### Cross-Platform Support

- **Primary Targets**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Architecture Support**: x64 and ARM64 for all platforms
- **Shell Integration**: OS-native terminal support (cmd/PowerShell/bash/zsh)
- **Path Handling**: Always use Node.js path utilities, never hardcode paths

### Security Model

- Context isolation enabled
- Node.js integration disabled in renderers
- Secure IPC communication via preload scripts
- Content Security Policy enforced
- No direct file system access from renderer

## Current Project Status

### ✅ Completed (Foundation)

- Project structure and build configuration
- TypeScript definitions and interfaces (329+ lines)
- Main process architecture with managers
- Cross-platform window management
- Settings persistence system
- Terminal integration framework
- Basic extension system architecture
- Secure IPC communication bridge
- Logging system with file rotation
- Theme system foundation

### 🔧 In Progress

- TypeScript compilation errors (need resolution)
- Extension loading implementation
- Command palette system

### 📋 TODO (Priority Order)

1. Fix TypeScript compilation issues
2. Complete extension system implementation
3. Build command palette with fuzzy search
4. Create settings UI with dynamic tabs
5. Implement extension store interface
6. Add comprehensive testing
7. Create extension development documentation

## Development Guidelines

### Code Quality Standards

- **No shortcuts**: Quality and correctness over speed
- **TypeScript strict mode**: All code must pass strict type checking
- **Error handling**: Comprehensive try-catch blocks with logging
- **Cross-platform**: Test on Windows, macOS, and Linux
- **Security first**: Never bypass Electron security features

### Architecture Patterns

- **Manager Pattern**: Each major subsystem has a dedicated manager class
- **Event-driven**: Use Electron's IPC for inter-process communication
- **Dependency Injection**: Managers receive dependencies via constructor
- **Separation of Concerns**: Keep main, renderer, and preload code separate
- **Interface-driven**: Define TypeScript interfaces for all public APIs

### File Organization

```
src/
├── main/                 # Electron main process
│   ├── main.ts              # Application entry point
│   ├── window-manager.ts    # Window lifecycle management
│   ├── extension-manager.ts # Plugin system
│   ├── terminal-manager.ts  # Terminal integration
│   ├── settings-manager.ts  # Configuration management
│   ├── ipc-manager.ts       # Inter-process communication
│   └── logger.ts            # Logging system
├── renderer/             # Frontend UI
│   ├── index.ts             # Renderer entry point
│   ├── index.html           # Application template
│   ├── components/          # UI components (future)
│   └── services/            # Business logic (future)
├── preload/              # Security bridge
│   └── preload.ts           # IPC bridge implementation
└── types/                # TypeScript definitions
    └── index.ts             # All interfaces and types
```

### Naming Conventions

- **Classes**: PascalCase (`WindowManager`, `ExtensionManager`)
- **Files**: kebab-case (`window-manager.ts`, `extension-manager.ts`)
- **Variables/Functions**: camelCase (`createWindow`, `loadExtension`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_WINDOW_SIZE`)
- **Interfaces**: PascalCase with descriptive names (`Extension`, `Theme`)

### Error Handling Patterns

```typescript
async someOperation(): Promise<void> {
  try {
    // Operation logic
    this.logger.info('Operation completed successfully');
  } catch (error) {
    this.logger.error('Operation failed', error);
    throw error; // Re-throw unless you can handle gracefully
  }
}
```

### IPC Communication Pattern

```typescript
// Main process
this.ipcManager.handle('feature:action', async (event, data: DataType) => {
  try {
    const result = await this.featureManager.performAction(data);
    return result;
  } catch (error) {
    this.logger.error('IPC action failed', error);
    throw error;
  }
});

// Preload
featureAction: (data: DataType) => ipcRenderer.invoke('feature:action', data),
```

## Extension System Design

### Extension Structure

```json
{
  "name": "extension-name",
  "displayName": "Human Readable Name",
  "version": "1.0.0",
  "main": "./extension.js",
  "contributes": {
    "commands": [...],
    "themes": [...],
    "settings": [...],
    "menus": [...]
  }
}
```

### Extension Lifecycle

1. **Discovery**: Scan extension directories
2. **Validation**: Verify extension manifest
3. **Loading**: Import extension module
4. **Activation**: Call extension's activate function
5. **Registration**: Register contributed features
6. **Deactivation**: Cleanup on disable/uninstall

## Terminal Integration

### Cross-Platform Shell Detection

- **Windows**: PowerShell (preferred) or cmd.exe
- **macOS**: User's default shell ($SHELL) or zsh
- **Linux**: User's default shell ($SHELL) or bash

### Terminal Features

- **xterm.js**: Modern terminal emulator
- **node-pty**: Native pseudo-terminal bindings
- **Addons**: Fit, web links, search capabilities
- **Theming**: Integrated with app theme system

## Settings System

### Settings Categories

- **Application**: Global app preferences
- **Window**: Window-specific settings
- **Terminal**: Terminal configuration
- **Extensions**: Extension-specific settings
- **Themes**: Theme preferences

### Settings Storage

- **Format**: JSON with type validation
- **Location**: Platform-specific user data directory
- **Persistence**: Auto-save on changes
- **Migration**: Version-aware schema updates

## Build System

### Development

```bash
pnpm dev                # Start development server
pnpm build:preload      # Build preload script first
```

### Production

```bash
pnpm build              # Build all processes
pnpm package            # Package for current platform
pnpm package:all        # Package for all platforms
```

### Platform-Specific Packaging

- **Windows**: NSIS installer + portable
- **macOS**: DMG with app bundle + notarization ready
- **Linux**: AppImage, deb, rpm, snap

## Testing Strategy

### Unit Testing

- **Framework**: Jest with TypeScript
- **Coverage**: Minimum 80% for core managers
- **Mocking**: Mock Electron APIs for isolated testing

### Integration Testing

- **E2E**: Electron test runner
- **Cross-platform**: Automated testing on CI/CD
- **Extension API**: Test extension loading/unloading

### Manual Testing

- **Platforms**: Test on Windows 10/11, macOS 12+, Ubuntu 20.04+
- **Architectures**: x64 and ARM64
- **Features**: Terminal, extensions, themes, settings

## Security Considerations

### Electron Security

- Context isolation: ✅ Enabled
- Node.js integration: ❌ Disabled in renderer
- Remote module: ❌ Disabled
- Web security: ✅ Enabled
- Secure defaults: ✅ Applied

### Extension Security

- **Sandboxing**: Extensions run in controlled environment
- **Permissions**: Explicit permission model for sensitive APIs
- **Validation**: Code signing and manifest validation
- **Updates**: Secure update mechanism with integrity checks

## Performance Guidelines

### Main Process

- **Async operations**: Use promises/async-await
- **Non-blocking**: Never block main thread
- **Memory management**: Proper cleanup in dispose methods
- **Native modules**: Minimize usage, prefer pure JS

### Renderer Process

- **Bundle optimization**: Tree shaking and code splitting
- **Memory leaks**: Proper event listener cleanup
- **DOM updates**: Use requestAnimationFrame for animations
- **Worker threads**: CPU-intensive tasks in workers

### Extension Performance

- **Lazy loading**: Load extensions on demand
- **Resource monitoring**: Track memory usage
- **API rate limiting**: Prevent extension abuse
- **Cleanup**: Proper disposal on deactivation

## Debugging & Troubleshooting

### Common Issues

1. **IPC timeout**: Check handler registration
2. **Module not found**: Verify path aliases in webpack config
3. **Permission denied**: Check file system permissions
4. **Extension loading**: Verify manifest structure

### Debug Tools

- **Chrome DevTools**: Renderer debugging
- **VSCode**: Main process debugging with attach
- **Logging**: Comprehensive log files in user data directory
- **Performance**: Built-in performance monitoring

## Contributing Guidelines

### Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] Cross-platform compatibility tested
- [ ] Proper error handling with logging
- [ ] IPC security boundaries respected
- [ ] Extension API backward compatibility
- [ ] Performance impact assessed
- [ ] Documentation updated

### Git Workflow

1. Feature branches from main
2. Descriptive commit messages
3. Pull request with description
4. Code review required
5. CI/CD checks must pass
6. Squash merge to main

---

## Quick Start for AI Assistants

When working on this project:

1. **Always consider cross-platform implications**
2. **Use the existing architectural patterns**
3. **Follow TypeScript strict mode**
4. **Maintain security boundaries**
5. **Add proper error handling and logging**
6. **Update this WARP.md if architecture changes**

The codebase prioritizes **quality and maintainability** over development speed. Every change should be production-ready and follow enterprise standards.

---

## Rules

- Make sure to follow the rules.

_Last Updated: September 27, 2025_  
_Status: Foundation Complete, Extension System In Progress_
