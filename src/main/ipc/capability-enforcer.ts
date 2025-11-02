import { Logger } from '../logger';

/**
 * Capability-based permission system for IPC operations
 * Provides fine-grained access control for different operations
 */

export interface CapabilityDescriptor {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'filesystem' | 'network' | 'system' | 'ui' | 'extension' | 'app';
}

/**
 * Built-in capability definitions
 */
export const CAPABILITIES: Record<string, CapabilityDescriptor> = {
  // Filesystem capabilities
  'fs.read': {
    name: 'fs.read',
    description: 'Read files and directories within workspace',
    riskLevel: 'low',
    category: 'filesystem',
  },
  'fs.write': {
    name: 'fs.write',
    description: 'Create and modify files within workspace',
    riskLevel: 'medium',
    category: 'filesystem',
  },
  'fs.delete': {
    name: 'fs.delete',
    description: 'Delete files and directories',
    riskLevel: 'high',
    category: 'filesystem',
  },
  'fs.info': {
    name: 'fs.info',
    description: 'Access filesystem metadata and paths',
    riskLevel: 'low',
    category: 'filesystem',
  },

  // Settings capabilities
  'settings.read': {
    name: 'settings.read',
    description: 'Read application settings',
    riskLevel: 'low',
    category: 'app',
  },
  'settings.write': {
    name: 'settings.write',
    description: 'Modify application settings',
    riskLevel: 'medium',
    category: 'app',
  },

  // Terminal capabilities
  'terminal.create': {
    name: 'terminal.create',
    description: 'Create new terminal instances',
    riskLevel: 'medium',
    category: 'system',
  },
  'terminal.write': {
    name: 'terminal.write',
    description: 'Send input to terminals',
    riskLevel: 'high',
    category: 'system',
  },
  'terminal.control': {
    name: 'terminal.control',
    description: 'Control terminal lifecycle (resize, kill)',
    riskLevel: 'medium',
    category: 'system',
  },

  // Command capabilities
  'command.execute': {
    name: 'command.execute',
    description: 'Execute application commands',
    riskLevel: 'high',
    category: 'app',
  },
  'command.list': {
    name: 'command.list',
    description: 'List available commands',
    riskLevel: 'low',
    category: 'app',
  },

  // Extension capabilities
  'extensions.read': {
    name: 'extensions.read',
    description: 'List installed extensions',
    riskLevel: 'low',
    category: 'extension',
  },
  'extensions.manage': {
    name: 'extensions.manage',
    description: 'Enable/disable extensions',
    riskLevel: 'high',
    category: 'extension',
  },
  'extensions.install': {
    name: 'extensions.install',
    description: 'Install new extensions',
    riskLevel: 'critical',
    category: 'extension',
  },

  // Theme capabilities
  'themes.read': {
    name: 'themes.read',
    description: 'List available themes',
    riskLevel: 'low',
    category: 'ui',
  },
  'themes.apply': {
    name: 'themes.apply',
    description: 'Change application theme',
    riskLevel: 'low',
    category: 'ui',
  },

  // Marketplace capabilities
  'marketplace.browse': {
    name: 'marketplace.browse',
    description: 'Browse marketplace catalog',
    riskLevel: 'low',
    category: 'network',
  },
  'marketplace.install': {
    name: 'marketplace.install',
    description: 'Install plugins from marketplace',
    riskLevel: 'critical',
    category: 'network',
  },
  'marketplace.manage': {
    name: 'marketplace.manage',
    description: 'Manage installed marketplace plugins',
    riskLevel: 'high',
    category: 'extension',
  },

  // UI capabilities
  'ui.dialog': {
    name: 'ui.dialog',
    description: 'Show file dialogs',
    riskLevel: 'low',
    category: 'ui',
  },

  // App control capabilities
  'app.info': {
    name: 'app.info',
    description: 'Access application metadata',
    riskLevel: 'low',
    category: 'app',
  },
  'app.control': {
    name: 'app.control',
    description: 'Control application lifecycle (quit, restart)',
    riskLevel: 'critical',
    category: 'app',
  },

  // Workspace capabilities
  'workspace.read': {
    name: 'workspace.read',
    description: 'Read workspace definitions and metadata',
    riskLevel: 'low',
    category: 'app',
  },
  'workspace.manage': {
    name: 'workspace.manage',
    description: 'Switch active workspace and update metadata',
    riskLevel: 'medium',
    category: 'app',
  },
  'workspace.pipeline': {
    name: 'workspace.pipeline',
    description: 'Execute workspace pipelines that modify repository files',
    riskLevel: 'medium',
    category: 'filesystem',
  },
};

/**
 * Permission context for capability checks
 */
export interface PermissionContext {
  sessionId?: string;
  userId?: string;
  extensionId?: string;
  origin?: string;
  timestamp: number;
}

/**
 * Capability enforcement engine
 */
export class CapabilityEnforcer {
  private logger: Logger;
  private enabled: boolean;
  private grantedCapabilities: Map<string, Set<string>> = new Map(); // contextId -> capabilities
  private deniedOperations: Map<string, number> = new Map(); // Track denied operations for monitoring

  constructor(enabled = false) {
    this.logger = new Logger('CapabilityEnforcer');
    this.enabled = enabled;
  }

  /**
   * Enable or disable capability enforcement
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.info(`Capability enforcement ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if a capability is granted for a context
   */
  checkCapability(capability: string, context: PermissionContext): boolean {
    if (!this.enabled) {
      // In development/disabled mode, log but allow all operations
      this.logger.debug(`Capability check (disabled): ${capability}`);
      return true;
    }

    const contextId = this.getContextId(context);
    const granted = this.grantedCapabilities.get(contextId);

    if (!granted || !granted.has(capability)) {
      this.logger.warn(`Capability denied: ${capability} for context ${contextId}`);
      this.recordDeniedOperation(capability);
      return false;
    }

    this.logger.debug(`Capability granted: ${capability} for context ${contextId}`);
    return true;
  }

  /**
   * Grant a capability to a context
   */
  grantCapability(capability: string, context: PermissionContext): void {
    const contextId = this.getContextId(context);

    if (!this.grantedCapabilities.has(contextId)) {
      this.grantedCapabilities.set(contextId, new Set());
    }

    this.grantedCapabilities.get(contextId)!.add(capability);
    this.logger.info(`Granted capability: ${capability} to context ${contextId}`);
  }

  /**
   * Revoke a capability from a context
   */
  revokeCapability(capability: string, context: PermissionContext): void {
    const contextId = this.getContextId(context);
    const granted = this.grantedCapabilities.get(contextId);

    if (granted) {
      granted.delete(capability);
      this.logger.info(`Revoked capability: ${capability} from context ${contextId}`);
    }
  }

  /**
   * Grant default capabilities for a context based on risk tolerance
   */
  grantDefaultCapabilities(
    context: PermissionContext,
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ): void {
    const allowedRiskLevels =
      riskLevel === 'high'
        ? ['low', 'medium', 'high']
        : riskLevel === 'medium'
          ? ['low', 'medium']
          : ['low'];

    for (const [capName, capDesc] of Object.entries(CAPABILITIES)) {
      if (allowedRiskLevels.includes(capDesc.riskLevel)) {
        this.grantCapability(capName, context);
      }
    }
  }

  /**
   * Get granted capabilities for a context
   */
  getGrantedCapabilities(context: PermissionContext): string[] {
    const contextId = this.getContextId(context);
    const granted = this.grantedCapabilities.get(contextId);
    return granted ? Array.from(granted) : [];
  }

  /**
   * Get denied operations statistics
   */
  getDeniedOperationsStats(): Array<{ capability: string; count: number }> {
    return Array.from(this.deniedOperations.entries()).map(([capability, count]) => ({
      capability,
      count,
    }));
  }

  /**
   * Clear all capabilities for a context
   */
  clearContext(context: PermissionContext): void {
    const contextId = this.getContextId(context);
    this.grantedCapabilities.delete(contextId);
    this.logger.info(`Cleared capabilities for context ${contextId}`);
  }

  private getContextId(context: PermissionContext): string {
    // Generate a unique context ID from available identifiers
    const parts = [
      context.sessionId || 'default',
      context.userId || 'anonymous',
      context.extensionId || 'core',
      context.origin || 'local',
    ];
    return parts.join(':');
  }

  private recordDeniedOperation(capability: string): void {
    const current = this.deniedOperations.get(capability) || 0;
    this.deniedOperations.set(capability, current + 1);
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.grantedCapabilities.clear();
    this.deniedOperations.clear();
  }
}

/**
 * Global capability enforcer instance
 */
let globalCapabilityEnforcer: CapabilityEnforcer | null = null;

export function getGlobalCapabilityEnforcer(): CapabilityEnforcer {
  if (!globalCapabilityEnforcer) {
    globalCapabilityEnforcer = new CapabilityEnforcer(process.env.NODE_ENV === 'production');
  }
  return globalCapabilityEnforcer;
}
