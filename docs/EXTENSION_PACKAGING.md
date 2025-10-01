# Extension Installation & Distribution Guide

## Overview

This guide covers how to package, distribute, and install extensions for App Shell.

## Available Extensions

### 1. Git Source Control Extension

**Package:** `git-extension-1.0.0.zip`
**Location:** `dist/extensions/git-extension-1.0.0.zip`

**Features:**

- Full Git integration with file decorations
- Stage, commit, push, pull operations
- Real-time status updates
- Visual diff viewing
- Context menu Git actions
- Branch management

### 2. Cyberpunk Theme Collection

**Package:** `cyberpunk-theme-1.0.0.zip`
**Location:** `dist/extensions/cyberpunk-theme-1.0.0.zip`

**Features:**

- 3 futuristic cyberpunk themes
- Neon color schemes
- Glitch effects (optional)
- Command palette integration

## Packaging Extensions

### Git Extension

```bash
cd examples/git-extension
pnpm package
```

This will:

1. Build the TypeScript source (`pnpm build`)
2. Create a zip file at `dist/extensions/git-extension-1.0.0.zip`

### Cyberpunk Theme

```bash
cd examples/cyberpunk-theme-extension
pnpm install  # Install archiver if needed
pnpm package
```

### Manual Packaging

If you need to package an extension manually:

```bash
cd examples/your-extension
zip -r your-extension-1.0.0.zip . \
  -i "dist/**" "themes/**" "package.json" "README.md" \
  -x "node_modules/**" "src/**" ".git/**"
```

## Installing Extensions

### Method 1: Using Extension Manager UI (Recommended)

1. Launch App Shell
2. Open Command Palette (`Ctrl+Shift+P`)
3. Type "Extensions: Install Extension"
4. Browse to the `.zip` file
5. Click "Open"
6. Extension will be extracted and activated

### Method 2: Manual Installation

1. Locate your extensions directory:
   - **Windows:** `%APPDATA%\app-shell\extensions\`
   - **macOS:** `~/Library/Application Support/app-shell/extensions/`
   - **Linux:** `~/.config/app-shell/extensions/`

2. Extract the `.zip` file into the extensions directory:

   ```
   extensions/
   ├── git-extension/
   │   ├── dist/
   │   ├── package.json
   │   └── ...
   └── cyberpunk-theme/
       ├── themes/
       ├── src/
       └── package.json
   ```

3. Restart App Shell

### Method 3: Development Mode

For development and testing:

```bash
# Create symlink to your extension
ln -s /path/to/examples/git-extension ~/.config/app-shell/extensions/git-extension
```

Or on Windows (as Administrator):

```powershell
mklink /D "%APPDATA%\app-shell\extensions\git-extension" "C:\path\to\examples\git-extension"
```

## Distributing Extensions

### Option 1: Direct Download

Host the `.zip` file on:

- GitHub Releases
- Your own website
- File sharing service

Users can download and install via Extension Manager.

### Option 2: Extension Marketplace (Future)

App Shell includes a marketplace service foundation. Future versions will support:

- Central extension registry
- One-click installation
- Automatic updates
- Version management

### Option 3: Git Repository

Users can clone and install:

```bash
cd ~/.config/app-shell/extensions
git clone https://github.com/username/my-extension.git
cd my-extension
pnpm install
pnpm build
```

## Extension Structure

A packaged extension should contain:

```
my-extension-1.0.0.zip
├── package.json          # Required: Extension manifest
├── dist/                 # Required for compiled extensions
│   └── extension.js      # Main entry point
├── themes/               # Optional: Theme files
│   └── my-theme.json
├── README.md             # Recommended: Documentation
├── CHANGELOG.md          # Recommended: Version history
└── LICENSE               # Recommended: License file
```

## Extension Manifest (package.json)

### Required Fields

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "description": "Extension description",
  "main": "./dist/extension.js",
  "engines": {
    "app-shell": "^1.0.0"
  }
}
```

### Optional Fields

```json
{
  "categories": ["Themes", "SCM Providers", "Programming Languages"],
  "keywords": ["keyword1", "keyword2"],
  "author": "Your Name",
  "license": "MIT",
  "contributes": {
    "commands": [...],
    "themes": [...],
    "settings": [...],
    "keybindings": [...]
  }
}
```

## Verifying Extension Package

Before distributing, verify your package:

1. **Test Installation:**

   ```bash
   # Extract to temp directory
   unzip git-extension-1.0.0.zip -d /tmp/test-extension

   # Check structure
   ls -la /tmp/test-extension
   ```

2. **Verify package.json:**

   ```bash
   cat /tmp/test-extension/package.json
   ```

3. **Check file permissions:**
   - All files should be readable
   - No executable bits on non-script files

4. **Test in App Shell:**
   - Install the extension
   - Check for errors in console
   - Test all contributed features
   - Verify uninstall works

## Troubleshooting

### Extension Won't Install

**Symptoms:** Error message when installing

**Solutions:**

- Verify `.zip` file is not corrupted
- Check `package.json` is valid JSON
- Ensure `main` field points to existing file
- Verify App Shell version compatibility

### Extension Doesn't Activate

**Symptoms:** Extension installed but not working

**Solutions:**

- Check console for activation errors
- Verify `main` entry point exists
- Ensure all dependencies are bundled
- Check activation events in manifest

### Missing Dependencies

**Symptoms:** Runtime errors about missing modules

**Solutions:**

- Bundle all dependencies in `dist/`
- Use webpack or bundler to package
- Don't rely on node_modules in production

### File Paths Not Found

**Symptoms:** Can't find theme files or resources

**Solutions:**

- Use relative paths from extension root
- Check case sensitivity (Linux/macOS)
- Verify paths in `package.json` contributes

## Best Practices

### 1. Version Management

Use semantic versioning (semver):

- **1.0.0** → Initial release
- **1.0.1** → Bug fix
- **1.1.0** → New features
- **2.0.0** → Breaking changes

### 2. Size Optimization

Keep extension packages small:

- Minify JavaScript
- Compress images
- Remove source maps in production
- Exclude unnecessary files

### 3. Documentation

Include comprehensive docs:

- README.md with features and usage
- CHANGELOG.md with version history
- LICENSE file
- Screenshots (optional)

### 4. Testing

Test before releasing:

- Fresh installation
- All contributed features
- Cross-platform (Windows/macOS/Linux)
- Uninstall/reinstall

### 5. Security

Follow security best practices:

- Don't include credentials
- Validate user input
- Use secure dependencies
- Follow principle of least privilege

## Publishing Checklist

Before publishing your extension:

- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated
- [ ] README.md complete and accurate
- [ ] All features tested
- [ ] No console errors
- [ ] License file included
- [ ] Package built and zipped
- [ ] Package size reasonable (<10 MB)
- [ ] Tested fresh installation
- [ ] Cross-platform compatibility verified
- [ ] Documentation reviewed

## Example: Creating a New Extension

### 1. Create Extension Structure

```bash
mkdir my-extension
cd my-extension
pnpm init
```

### 2. Add package.json Fields

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "main": "./dist/extension.js",
  "engines": { "app-shell": "^1.0.0" }
}
```

### 3. Create Entry Point

```typescript
// src/extension.ts
export function activate(context: ExtensionContext) {
  console.log('My extension activated!');
}

export function deactivate() {
  console.log('My extension deactivated');
}
```

### 4. Add Build Script

```bash
pnpm add -D typescript
npx tsc --init
```

Update package.json:

```json
{
  "scripts": {
    "build": "tsc",
    "package": "pnpm build && node package-extension.js"
  }
}
```

### 5. Build and Package

```bash
pnpm build
pnpm package
```

### 6. Test Installation

Install the generated `.zip` file in App Shell and verify it works.

## Support

For issues or questions:

- GitHub Issues: https://github.com/Lukeus/app-shell/issues
- Documentation: See project README.md
- Examples: Check `examples/` directory

## Additional Resources

- [Extension Development Guide](../EXTENSION_DEVELOPMENT.md)
- [Extension API Reference](../src/extensions/extension-api.ts)
- [Git Extension Example](../examples/git-extension/)
- [Theme Extension Example](../examples/cyberpunk-theme-extension/)
