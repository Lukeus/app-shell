# Extension Security & Trust Boundary Documentation

## Current Security Model

### Extension Execution Context

- **Trust Level**: Extensions run in the main process with full Node.js API access
- **Isolation**: No sandboxing - extensions share the same process space
- **Permissions**: Extensions can access any Node.js API, file system, and network
- **Code Validation**: Basic manifest validation only; no code signing or integrity checks

### Security Boundaries

#### Main Process

- Extensions execute with same privileges as the application
- Can register IPC handlers, access filesystem, spawn processes
- No capability-based permissions (yet)

#### Renderer Process

- Protected by Electron's context isolation
- Cannot directly execute extension code
- Must use IPC to communicate with extension functionality

### Current Risks

1. **Supply Chain Attacks**: No signature verification on extension installation
2. **Privilege Escalation**: Extensions have full system access via Node.js APIs
3. **Data Exfiltration**: Extensions can read any file accessible to the application
4. **Malicious Commands**: Extensions can register commands that perform dangerous operations

## Recommended Security Enhancements

### Immediate (Priority 0)

1. **Code Signing**: Implement cryptographic signatures for extension verification
2. **Capability Model**: Restrict extension access via explicit permissions
3. **Path Scoping**: Limit filesystem access to workspace boundaries (✓ Implemented)
4. **Input Validation**: Validate all IPC payloads (✓ Implemented)

### Short Term (Priority 1)

1. **Process Isolation**: Run extensions in separate Node.js processes
2. **Permission Manifests**: Require extensions to declare capabilities
3. **Audit Logging**: Log all extension API calls and file access
4. **Safe Defaults**: Deny-by-default permission model

### Long Term (Priority 2)

1. **WebAssembly Sandbox**: Execute extension logic in WASM runtime
2. **Containerization**: Docker/VM-based extension isolation
3. **Security Policies**: Admin-configurable security rules
4. **Static Analysis**: Automated code scanning before installation

## Extension Development Guidelines

### Security Best Practices

- Minimize required permissions in manifest
- Validate all user inputs
- Use secure coding practices (no eval, careful with dynamic imports)
- Handle sensitive data carefully
- Follow principle of least privilege

### Dangerous Patterns to Avoid

- `eval()` or `Function()` constructor
- Dynamic require() with user input
- Direct filesystem access outside workspace
- Network requests to arbitrary URLs
- Spawning processes with user-controlled arguments

## Capability Model (Planned)

### Filesystem Capabilities

- `fs.read` - Read files within workspace
- `fs.write` - Write files within workspace
- `fs.delete` - Delete files within workspace
- `fs.execute` - Execute files

### Network Capabilities

- `net.http` - Make HTTP requests
- `net.local` - Access localhost services
- `net.external` - Access external services

### System Capabilities

- `system.process` - Spawn processes
- `system.env` - Access environment variables
- `system.clipboard` - Access clipboard

### UI Capabilities

- `ui.command` - Register commands
- `ui.dialog` - Show dialogs
- `ui.notification` - Show notifications
- `ui.statusbar` - Modify status bar

## Migration Path

### Phase 1: Capability Declaration (No Enforcement)

- Add `capabilities` field to extension manifest
- Log capability usage for auditing
- Educate extension developers

### Phase 2: Capability Enforcement

- Enforce declared capabilities at runtime
- Reject extensions with dangerous capability combinations
- Provide capability management UI

### Phase 3: Process Isolation

- Move extension execution to child processes
- Implement secure IPC bridge
- Maintain API compatibility

## Risk Assessment

### High Risk Extensions

- Extensions requesting filesystem write access
- Extensions with network capabilities
- Extensions that spawn processes
- Extensions from unverified publishers

### Medium Risk Extensions

- Extensions with only read access
- Extensions with UI-only capabilities
- Extensions from known publishers

### Low Risk Extensions

- Pure data transformation extensions
- Theme-only extensions
- Extensions with minimal capabilities

## Monitoring & Detection

### Security Events to Log

- Extension installation/uninstallation
- Capability usage beyond declared permissions
- File access outside workspace boundaries
- Suspicious API call patterns
- Network requests to unexpected destinations

### Automated Detection

- Unusual filesystem access patterns
- High-frequency API calls
- Attempts to access sensitive system files
- Network communication to suspicious hosts

---

**Note**: This security model is under active development. Current implementation provides basic input validation and path scoping. Full capability model and process isolation planned for future releases.

**Last Updated**: 2025-09-30
