# Repository Security Enforcement

This document outlines the security enforcement mechanisms in place for the App Shell repository.

## Table of Contents

- [Overview](#overview)
- [Automated Security Enforcement](#automated-security-enforcement)
- [Branch Protection Rules](#branch-protection-rules)
- [Required Security Checks](#required-security-checks)
- [Local Development Security](#local-development-security)
- [Security Workflows](#security-workflows)
- [Manual Security Reviews](#manual-security-reviews)
- [Incident Response](#incident-response)

## Overview

Repository security is enforced through multiple layers:

1. **Branch Protection Rules** - Prevent direct pushes to main
2. **Required Status Checks** - CI/CD must pass before merge
3. **Code Review Requirements** - CODEOWNERS enforced reviews
4. **Automated Security Scanning** - Multiple security tools
5. **Pre-commit Hooks** - Local security validation
6. **Dependency Management** - Automated vulnerability fixes

## Automated Security Enforcement

### GitHub Security Features

- **Secret Scanning**: Automatically detects committed secrets
- **Push Protection**: Prevents secret commits from being pushed
- **Vulnerability Alerts**: Notifies of dependency vulnerabilities
- **Dependabot**: Automatically creates PRs for security updates
- **CodeQL Analysis**: Static application security testing (SAST)
- **License Compliance**: Ensures only approved licenses are used

### Security Workflows

The following GitHub Actions workflows enforce security:

#### `security.yml`

- **Dependency Scanning**: Daily vulnerability scans
- **Secret Detection**: TruffleHog for historical secret detection
- **License Compliance**: Ensures only approved licenses
- **Security Policy Check**: Validates security files exist

#### `codeql.yml`

- **Static Analysis**: CodeQL security scanning
- **Vulnerability Detection**: Finds security vulnerabilities in code
- **Weekly Scans**: Scheduled security analysis

## Branch Protection Rules

The `main` branch is protected with the following rules:

### Required Status Checks

- `lint` - Code style and quality checks must pass
- `build` - Application must build successfully
- `test` - All tests must pass
- `security-policy-check` - Security files must be present

### Pull Request Reviews

- **Required Reviewers**: 1 approving review required
- **Dismiss Stale Reviews**: New commits dismiss previous approvals
- **Code Owner Reviews**: CODEOWNERS must approve relevant changes

### Additional Protections

- **Linear History**: Prevents merge commits
- **Force Push Prevention**: No force pushes allowed
- **Branch Deletion Prevention**: Main branch cannot be deleted
- **Conversation Resolution**: All review comments must be resolved

## Required Security Checks

Before any code can be merged to main, the following checks must pass:

### Automated Checks

1. **ESLint**: No linting errors allowed
2. **Security Audit**: No high/critical vulnerability findings
3. **Build Verification**: Application must compile successfully
4. **Test Suite**: All tests must pass
5. **Secret Scanning**: No secrets detected
6. **License Compliance**: All dependencies must use approved licenses

### Manual Reviews

1. **Security-sensitive changes** require security team review
2. **Architecture changes** require maintainer approval
3. **Dependency updates** are reviewed for security implications

## Local Development Security

### Pre-commit Hooks

Install pre-commit hooks for local security validation:

```bash
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg
```

Pre-commit hooks enforce:

- **Secret Detection**: Prevents committing secrets
- **Security Audits**: Dependency vulnerability checks
- **Code Quality**: Linting and formatting
- **License Compliance**: Ensures approved licenses only
- **File Permissions**: Prevents dangerous file permissions
- **Conventional Commits**: Enforces commit message standards

### Development Workflow

1. **Clone Repository**

   ```bash
   git clone https://github.com/Lukeus/app-shell.git
   cd app-shell
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   pre-commit install
   ```

3. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature
   ```

4. **Security Validation (Automatic)**
   - Pre-commit hooks run on every commit
   - Failed security checks prevent commits

5. **Push and Create PR**
   - Security workflows run automatically
   - Branch protection prevents merge until checks pass

## Security Workflows

### Continuous Security Monitoring

#### Daily Scans

- **Dependency Vulnerabilities**: Check for new CVEs
- **Secret Scanning**: Historical secret detection
- **License Changes**: Monitor for license violations

#### Weekly Scans

- **CodeQL Analysis**: Deep static analysis
- **Dependency Updates**: Automated Dependabot PRs

#### On Every PR/Push

- **Security Policy Validation**
- **Lint and Build Checks**
- **Test Suite Execution**
- **Vulnerability Scanning**

### Incident Response Workflow

1. **Security Alert Received**
   - GitHub Security Advisory
   - Dependabot Alert
   - Manual Report

2. **Assessment**
   - Severity evaluation
   - Impact analysis
   - Affected versions identified

3. **Response**
   - Critical: Immediate patch
   - High: 48-hour response
   - Medium: Weekly update
   - Low: Next release cycle

4. **Communication**
   - Security advisory published
   - Users notified of updates
   - Changelog updated

## Manual Security Reviews

### Code Owner Requirements

The `CODEOWNERS` file defines mandatory reviewers for:

- **Security-critical files**: `SECURITY.md`, workflows, etc.
- **Core application files**: Main process, preload scripts
- **Configuration files**: Package.json, build configs
- **Extension system**: Due to security implications
- **CI/CD workflows**: Build and deployment scripts

### Review Checklist

Security reviewers should verify:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation and sanitization
- [ ] Secure coding practices followed
- [ ] No dangerous permissions or file operations
- [ ] Dependencies are from trusted sources
- [ ] Error handling doesn't leak sensitive information
- [ ] Security best practices followed

## Repository Security Settings

### Automated Setup

Run the security setup script to configure repository security:

```bash
./scripts/setup-repo-security.sh
```

This script configures:

- Branch protection rules
- Security scanning features
- Repository settings
- Security labels
- Advanced security features

### Manual Configuration

Some settings require manual configuration:

1. **Private Vulnerability Reporting**: Enable in repository settings
2. **Security Advisories**: Configure notification preferences
3. **Repository Secrets**: Add CI/CD secrets securely
4. **Team Permissions**: Configure security team access

## Compliance and Auditing

### Security Metrics

Track the following security metrics:

- **Mean Time to Fix (MTTF)**: Average time to resolve security issues
- **Vulnerability Backlog**: Number of open security issues
- **Test Coverage**: Percentage of code covered by security tests
- **Dependency Health**: Percentage of dependencies without known vulnerabilities

### Audit Trail

All security-relevant actions are logged:

- **Code Reviews**: GitHub maintains review history
- **Security Scans**: Workflow logs and artifacts
- **Dependency Updates**: Automated PR history
- **Access Changes**: Repository audit log

## Additional Security Measures

### Recommended Practices

1. **Enable MFA**: All contributors should use multi-factor authentication
2. **Signed Commits**: Consider requiring commit signing
3. **Private Forks**: Restrict forking for sensitive repositories
4. **Access Reviews**: Regularly review repository access permissions

### Advanced Security

For enhanced security, consider:

- **Custom Security Policies**: Organization-level security requirements
- **Security Training**: Regular security awareness training
- **Penetration Testing**: Periodic security assessments
- **Threat Modeling**: Architecture security analysis

## Support and Resources

### Documentation

- [GitHub Security Features](https://docs.github.com/en/code-security)
- [Electron Security](https://electronjs.org/docs/tutorial/security)
- [OWASP Guidelines](https://owasp.org/)

### Contacts

- **Security Issues**: security@yourorg.com
- **Maintainer**: [@Lukeus](https://github.com/Lukeus)
- **GitHub Security**: [Security Advisories](https://github.com/Lukeus/app-shell/security)

---

_This document is regularly updated to reflect current security practices and should be reviewed quarterly._
