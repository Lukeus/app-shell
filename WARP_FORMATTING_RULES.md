# 🎯 Formatting and Code Quality Rules

## 📋 Mandatory Pre-Commit Checks

### 1. **Prettier Formatting** (Required)
```bash
# MUST pass before any commit
pnpm run format:check

# Auto-fix formatting issues
pnpm run format
```

### 2. **ESLint Code Quality** (Required)
```bash
# MUST pass before any commit  
pnpm run lint

# Auto-fix linting issues where possible
pnpm run lint:fix
```

### 3. **TypeScript Compilation** (Required)
```bash
# MUST compile without errors
pnpm run build
```

## 🚫 Pre-Commit Hook Rules

All developers MUST install and use the pre-commit hooks:

```bash
# Install pre-commit hooks
npx husky install

# This will automatically run on every commit:
# 1. Prettier formatting check
# 2. ESLint code quality check  
# 3. TypeScript compilation check
```

## 🔒 Repository Protection Rules

### Branch Protection Settings:
- **Require pull request reviews**: ✅ Enabled
- **Require status checks**: ✅ Enabled
  - `Lint & Format Check` - Must pass
  - `Build` - Must pass on all platforms
  - `Security Audit` - Must pass
- **Require branches to be up to date**: ✅ Enabled
- **Restrict pushes that create files**: ✅ Enabled

### Status Check Requirements:
1. **✅ Formatting**: `pnpm run format:check` must pass
2. **✅ Linting**: `pnpm run lint` must pass (warnings allowed)
3. **✅ Build**: All webpack builds must compile successfully
4. **✅ Cross-Platform**: Tests must pass on Ubuntu, Windows, macOS
5. **✅ Security**: `pnpm audit` must pass

## 📝 File-Specific Rules

### Workflow Files (`.github/workflows/*.yml`)
- **MUST** be formatted with Prettier
- **MUST** use explicit `shell:` specifications for cross-platform compatibility
- **MUST** handle Windows PowerShell vs bash differences

### Code Files (`src/**/*.ts`, `src/**/*.tsx`)
- **MUST** pass TypeScript strict mode compilation
- **MUST** be formatted with Prettier
- **MUST** pass ESLint checks
- **SHOULD** have JSDoc comments for public APIs

### Configuration Files (`*.json`, `*.yml`, `*.md`)
- **MUST** be formatted with Prettier
- **MUST** use consistent indentation (2 spaces)

## 🛠️ Developer Workflow

### Before Every Commit:
```bash
# 1. Format code
pnpm run format

# 2. Fix linting issues
pnpm run lint:fix

# 3. Verify everything passes
pnpm run format:check && pnpm run lint && pnpm run build
```

### Before Creating PR:
```bash
# Run full test suite
pnpm run format:check
pnpm run lint  
pnpm run build
pnpm audit

# If any of these fail, fix issues before PR
```

## 🚨 Enforcement

### Automated Enforcement:
- **GitHub Actions**: All PRs must pass formatting and linting checks
- **Pre-commit hooks**: Prevent commits with formatting/linting issues
- **Branch protection**: Prevent merging PRs that don't pass checks

### Manual Review Requirements:
- All PRs require at least 1 approval
- Reviewers should verify code quality beyond automated checks
- Large architectural changes require additional review

## 💡 IDE Setup Recommendations

### VS Code Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off"
}
```

### Extensions:
- **Prettier - Code formatter**: Auto-formatting
- **ESLint**: Real-time linting
- **TypeScript Importer**: Auto-imports

## 🎯 Benefits

1. **Consistent Code Style**: All code follows the same formatting standards
2. **Reduced Review Time**: Formatting issues caught before PR creation
3. **Higher Quality**: Linting catches potential bugs early
4. **CI Reliability**: Formatting issues don't cause CI failures
5. **Developer Experience**: IDE auto-formatting reduces manual work

---

## 🔧 Implementation Status

- ✅ **Prettier Configuration**: `.prettierrc` configured
- ✅ **ESLint Configuration**: `eslint.config.mjs` configured  
- ✅ **Pre-commit Hooks**: `husky` and `lint-staged` configured
- ✅ **GitHub Actions**: CI checks implemented
- ✅ **Branch Protection**: Repository rules enabled
- ⚠️ **Developer Adoption**: Needs team communication

## 📞 Support

If you encounter issues with formatting or linting:

1. **Auto-fix**: Run `pnpm run format && pnpm run lint:fix`
2. **Check Configuration**: Verify `.prettierrc` and `eslint.config.mjs`
3. **IDE Integration**: Ensure VS Code extensions are installed
4. **Ask for Help**: Create issue or ask in team chat

---

**Last Updated**: September 27, 2025  
**Status**: Active - All developers must follow these rules