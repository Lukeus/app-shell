# Contributing to App Shell

Thank you for your interest in contributing to App Shell! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contribution Process](#contribution-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher
- **pnpm**: Version 8.x or higher (preferred package manager)
- **Git**: Latest stable version

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/app-shell.git
   cd app-shell
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Build the Application**

   ```bash
   pnpm run build
   ```

4. **Run in Development Mode**

   ```bash
   pnpm run dev
   ```

5. **Run Tests**
   ```bash
   pnpm run test
   ```

## Contribution Process

### 1. Issue First

- **Bug Reports**: Use the bug report template
- **Feature Requests**: Use the feature request template
- **Questions**: Use GitHub Discussions for general questions

### 2. Branch Strategy

- `main`: Production-ready code
- `develop`: Development integration branch
- Feature branches: `feature/your-feature-name`
- Bugfix branches: `fix/issue-description`
- Hotfix branches: `hotfix/critical-fix`

### 3. Pull Request Process

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Quality Checks**

   ```bash
   pnpm run lint          # Check code style
   pnpm run lint:fix      # Auto-fix issues
   pnpm run format        # Format code
   pnpm run test          # Run all tests
   pnpm run build         # Verify build works
   ```

4. **Commit Changes**
   - Use [Conventional Commits](https://conventionalcommits.org/)
   - Examples:
     - `feat: add command palette search functionality`
     - `fix: resolve terminal rendering issue on Windows`
     - `docs: update API documentation for extensions`
     - `test: add integration tests for window manager`

5. **Submit Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Request review from maintainers

## Coding Standards

### TypeScript

- **Strict Mode**: All TypeScript must compile without errors
- **Type Safety**: Avoid `any` types; use proper interfaces and types
- **Naming Conventions**:
  - Classes: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Interfaces: `PascalCase` (prefix with `I` if needed for clarity)

### Code Style

- **ESLint**: Code must pass all ESLint checks
- **Prettier**: Code must be formatted with Prettier
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces

### File Organization

```
src/
├── main/           # Electron main process
├── renderer/       # Electron renderer process
├── preload/        # Preload scripts
├── types/          # TypeScript type definitions
└── extensions/     # Extension system
```

### Error Handling

- Use proper error types
- Log errors appropriately
- Provide user-friendly error messages
- Handle edge cases gracefully

## Testing Guidelines

### Test Structure

- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full application workflow testing (Playwright)

### Test Requirements

- **Coverage**: Minimum 80% code coverage for new features
- **Test Files**: Place tests near the code they test
- **Naming**: `*.test.ts` for unit tests, `*.spec.ts` for E2E tests

### Running Tests

```bash
# All tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage

# E2E tests only
pnpm run test:e2e
```

## Documentation

### Code Documentation

- **JSDoc**: Document all public APIs
- **README Updates**: Keep README.md current
- **Changelog**: Update CHANGELOG.md for notable changes

### Documentation Requirements

- API documentation for new features
- Usage examples for complex functionality
- Architecture decisions in ADRs (Architecture Decision Records)

## Architecture Guidelines

### Extension System

- Extensions must follow the defined API interface
- Extensions should be sandboxed and secure
- Extension manifest must be valid JSON

### Security Considerations

- No `eval()` or similar dynamic code execution
- Sanitize all user inputs
- Follow Electron security best practices
- Regular dependency security audits

## Performance Standards

- **Bundle Size**: Monitor and optimize bundle sizes
- **Memory Usage**: Profile memory usage for performance critical paths
- **Startup Time**: Keep application startup time under 3 seconds
- **Responsiveness**: UI should remain responsive during all operations

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- Breaking changes increment MAJOR
- New features increment MINOR
- Bug fixes increment PATCH

### Release Workflow

1. Create release branch from `develop`
2. Update version numbers
3. Update CHANGELOG.md
4. Create pull request to `main`
5. After merge, tag release
6. CI/CD automatically builds and publishes

## Getting Help

### Resources

- **Documentation**: Check the `docs/` directory
- **Examples**: See `examples/` directory
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions

### Contact

- **Maintainer**: [@Lukeus](https://github.com/Lukeus)
- **Issues**: [GitHub Issues](https://github.com/Lukeus/app-shell/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Lukeus/app-shell/discussions)

## Recognition

Contributors who make significant contributions will be recognized in:

- README.md contributors section
- Release notes
- Special contributor badges

Thank you for contributing to App Shell! 🚀
