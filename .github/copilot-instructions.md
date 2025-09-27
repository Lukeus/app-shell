# GitHub Copilot Instructions for App Shell

## Project Overview

This is an enterprise-grade, cross-platform Electron application shell with extension support, similar to VS Code. It's designed as a reusable template for building extensible desktop applications.

## Architecture Guidelines

### Code Quality

- Always use TypeScript for new code
- Follow the existing architectural patterns
- Maintain clean separation between main process, renderer, and preload scripts
- Use proper error handling and logging throughout

### Cross-Platform Compatibility

- Ensure all code works on Windows, macOS, and Linux
- Use Node.js path utilities for file paths
- Handle platform-specific shell commands appropriately
- Test UI elements across different operating systems

### Extension System

- Follow the established extension API patterns
- Maintain backward compatibility when adding new features
- Use proper TypeScript interfaces for all extension contracts
- Document all public APIs

### Security

- Never bypass Electron's security features
- Use contextBridge for all renderer-to-main communication
- Validate all inputs from extensions
- Follow principle of least privilege

## Development Patterns

### File Organization

```
src/
├── main/           # Electron main process
├── renderer/       # Frontend application
├── preload/        # Secure IPC bridge
└── types/          # TypeScript definitions
```

### Naming Conventions

- Use PascalCase for classes and interfaces
- Use camelCase for variables and functions
- Use kebab-case for file names
- Use UPPER_SNAKE_CASE for constants

### Error Handling

- Always use try-catch blocks for async operations
- Log errors with appropriate context
- Provide user-friendly error messages
- Don't swallow exceptions

### IPC Communication

- Use typed interfaces for all IPC calls
- Handle async operations properly
- Validate data at boundaries
- Use descriptive channel names

### Testing

- Write unit tests for business logic
- Test cross-platform compatibility
- Verify security boundaries
- Test extension loading and unloading

## Code Examples

### Adding a new IPC handler:

```typescript
// In main process
this.ipcManager.handle('myFeature:action', async (data: MyData) => {
  try {
    const result = await this.myService.performAction(data);
    return result;
  } catch (error) {
    this.logger.error('Failed to perform action', error);
    throw error;
  }
});

// In preload
myFeatureAction: (data: MyData) => ipcRenderer.invoke('myFeature:action', data),
```

### Creating a manager class:

```typescript
export class MyManager {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MyManager');
  }

  async init(): Promise<void> {
    try {
      // Initialization logic
      this.logger.info('MyManager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize MyManager', error);
      throw error;
    }
  }

  dispose(): void {
    // Cleanup logic
    this.logger.info('MyManager disposed');
  }
}
```

## Best Practices

1. **Always consider cross-platform implications**
2. **Use the existing logging system consistently**
3. **Follow the established error handling patterns**
4. **Maintain TypeScript strict mode compliance**
5. **Document public APIs and complex logic**
6. **Use the existing settings management system**
7. **Follow the extension contribution model**
8. **Prioritize security in all implementations**
9. **Test on multiple platforms when possible**
10. **Keep dependencies up to date and secure**

## Common Pitfalls to Avoid

- Don't use Node.js APIs directly in renderer processes
- Don't bypass the preload security bridge
- Don't ignore TypeScript errors or warnings
- Don't hardcode platform-specific paths
- Don't create memory leaks in long-running processes
- Don't expose sensitive APIs to extensions
- Don't break backward compatibility without major version bump

## Performance Considerations

- Use lazy loading for heavy operations
- Implement proper cleanup in dispose methods
- Avoid blocking the main thread
- Use workers for CPU-intensive tasks
- Monitor memory usage in extensions
- Optimize renderer bundle size

Remember: This project prioritizes quality, security, and maintainability over development speed. Always consider the long-term implications of your code changes.
