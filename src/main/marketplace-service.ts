import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import {
  MarketplacePlugin,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  MarketplaceCategory,
  PluginInstallation,
  PluginUpdate,
  MarketplaceRegistry,
  MarketplaceService as IMarketplaceService,
  Extension,
} from '../types';
import { Logger } from './logger';
import { ExtensionManager } from './extension-manager';
import { SettingsManager } from './settings-manager';

export class MarketplaceService implements IMarketplaceService {
  private logger: Logger;
  private extensionManager: ExtensionManager;
  private settingsManager: SettingsManager;
  private marketplacePath: string;
  private cachePath: string;
  private registries: MarketplaceRegistry[];
  private installations: Map<string, PluginInstallation> = new Map();

  constructor(extensionManager: ExtensionManager, settingsManager: SettingsManager) {
    this.logger = new Logger('MarketplaceService');
    this.extensionManager = extensionManager;
    this.settingsManager = settingsManager;

    const userDataPath = app.getPath('userData');
    this.marketplacePath = path.join(userDataPath, 'marketplace');
    this.cachePath = path.join(this.marketplacePath, 'cache');

    // Default registry - for demo purposes, we'll use a mock registry
    this.registries = [
      {
        name: 'Official Registry',
        url: 'https://marketplace.app-shell.dev/api',
        enabled: true,
      },
    ];

    this.ensureDirectories();
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing Marketplace Service...');

      // Load custom registries from settings
      const registriesValue = await this.settingsManager.get('marketplace.registries');
      const customRegistries = Array.isArray(registriesValue)
        ? (registriesValue as MarketplaceRegistry[])
        : [];
      this.registries = [...this.registries, ...customRegistries];

      // Sync plugin metadata from registries
      await this.syncRegistries();

      this.logger.info('Marketplace service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize marketplace service', error);
      throw error;
    }
  }

  private ensureDirectories(): void {
    const dirs = [this.marketplacePath, this.cachePath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async syncRegistries(): Promise<void> {
    for (const registry of this.registries) {
      if (!registry.enabled) continue;

      try {
        this.logger.debug(`Syncing registry: ${registry.name}`);
        // In a real implementation, this would fetch from the registry API
        // For now, we'll create mock data
        await this.createMockPluginData();
        registry.lastSync = new Date().toISOString();
      } catch (error) {
        this.logger.error(`Failed to sync registry ${registry.name}`, error);
      }
    }
  }

  private async createMockPluginData(): Promise<void> {
    // Create some mock marketplace plugins for demonstration
    const mockPlugins: MarketplacePlugin[] = [
      {
        id: 'theme-dark-plus',
        name: 'theme-dark-plus',
        displayName: 'Dark+ Theme',
        version: '1.0.0',
        description: 'Enhanced dark theme with better syntax highlighting',
        longDescription:
          'A carefully crafted dark theme that provides excellent readability and reduces eye strain during long coding sessions.',
        author: {
          name: 'Theme Studio',
          email: 'themes@example.com',
          url: 'https://themestudio.dev',
        },
        publisher: 'theme-studio',
        category: 'themes',
        tags: ['theme', 'dark', 'coding', 'syntax-highlighting'],
        icon: 'https://example.com/icons/dark-plus.png',
        license: 'MIT',
        engines: {
          'app-shell': '^1.0.0',
        },
        downloadCount: 15420,
        rating: {
          average: 4.8,
          count: 342,
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-03-20T14:30:00Z',
        versions: [
          {
            version: '1.0.0',
            downloadUrl: 'https://example.com/plugins/theme-dark-plus-1.0.0.zip',
            size: 52480,
            publishedAt: '2024-03-20T14:30:00Z',
            engines: {
              'app-shell': '^1.0.0',
            },
          },
        ],
        isInstalled: false,
      },
      {
        id: 'terminal-enhancer',
        name: 'terminal-enhancer',
        displayName: 'Terminal Enhancer',
        version: '2.1.0',
        description: 'Enhanced terminal with tabs, split panes, and custom themes',
        longDescription:
          'Supercharge your terminal experience with multiple tabs, split panes, custom themes, and advanced features like session persistence.',
        author: {
          name: 'DevTools Inc',
          email: 'contact@devtools.com',
        },
        publisher: 'devtools-inc',
        category: 'productivity',
        tags: ['terminal', 'tabs', 'productivity', 'enhancement'],
        license: 'Apache-2.0',
        engines: {
          'app-shell': '^1.0.0',
        },
        downloadCount: 8932,
        rating: {
          average: 4.6,
          count: 198,
        },
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-03-18T11:45:00Z',
        versions: [
          {
            version: '2.1.0',
            downloadUrl: 'https://example.com/plugins/terminal-enhancer-2.1.0.zip',
            size: 128000,
            publishedAt: '2024-03-18T11:45:00Z',
            engines: {
              'app-shell': '^1.0.0',
            },
          },
        ],
        isInstalled: false,
      },
      {
        id: 'git-integration',
        name: 'git-integration',
        displayName: 'Git Integration',
        version: '3.0.2',
        description: 'Full Git integration with visual diff, branch management, and commit history',
        longDescription:
          'Complete Git integration that brings version control directly into your workspace with visual diffs, branch management, commit history, and merge conflict resolution.',
        author: {
          name: 'VCS Solutions',
          email: 'git@vcs-solutions.com',
        },
        publisher: 'vcs-solutions',
        category: 'version-control',
        tags: ['git', 'version-control', 'diff', 'merge', 'branches'],
        license: 'MIT',
        engines: {
          'app-shell': '^1.0.0',
        },
        downloadCount: 23741,
        rating: {
          average: 4.9,
          count: 512,
        },
        createdAt: '2023-11-10T08:00:00Z',
        updatedAt: '2024-03-22T16:20:00Z',
        versions: [
          {
            version: '3.0.2',
            downloadUrl: 'https://example.com/plugins/git-integration-3.0.2.zip',
            size: 256000,
            publishedAt: '2024-03-22T16:20:00Z',
            engines: {
              'app-shell': '^1.0.0',
            },
          },
        ],
        isInstalled: false,
      },
    ];

    // Save mock plugins to cache
    const cachePath = path.join(this.cachePath, 'plugins.json');
    fs.writeFileSync(cachePath, JSON.stringify(mockPlugins, null, 2), 'utf8');
  }

  async searchPlugins(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult> {
    try {
      this.logger.debug('Searching plugins', query);

      // Load cached plugins
      const plugins = await this.getCachedPlugins();

      // Mark installed plugins
      const installedExtensions = this.extensionManager.getAllExtensions();
      const enrichedPlugins = plugins.map(plugin => ({
        ...plugin,
        isInstalled: installedExtensions.some(ext => ext.id === plugin.id),
        installedVersion: installedExtensions.find(ext => ext.id === plugin.id)?.version,
      }));

      // Apply filters
      let filteredPlugins = enrichedPlugins;

      if (query.query) {
        const searchTerm = query.query.toLowerCase();
        filteredPlugins = filteredPlugins.filter(
          plugin =>
            plugin.name.toLowerCase().includes(searchTerm) ||
            plugin.displayName.toLowerCase().includes(searchTerm) ||
            plugin.description.toLowerCase().includes(searchTerm) ||
            plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (query.category) {
        filteredPlugins = filteredPlugins.filter(plugin => plugin.category === query.category);
      }

      if (query.tags && query.tags.length > 0) {
        filteredPlugins = filteredPlugins.filter(plugin =>
          query.tags!.some(tag => plugin.tags.includes(tag))
        );
      }

      // Apply sorting
      const sortBy = query.sortBy || 'relevance';
      const sortOrder = query.sortOrder || 'desc';

      filteredPlugins.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.displayName.localeCompare(b.displayName);
            break;
          case 'rating':
            comparison = a.rating.average - b.rating.average;
            break;
          case 'downloads':
            comparison = a.downloadCount - b.downloadCount;
            break;
          case 'updated':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          default: // relevance
            // For relevance, prioritize exact matches, then partial matches
            if (query.query) {
              const searchTerm = query.query.toLowerCase();
              const aExact = a.name.toLowerCase().includes(searchTerm) ? 1 : 0;
              const bExact = b.name.toLowerCase().includes(searchTerm) ? 1 : 0;
              comparison = bExact - aExact;
            } else {
              comparison = b.downloadCount - a.downloadCount; // Default to downloads
            }
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedPlugins = filteredPlugins.slice(startIndex, endIndex);

      return {
        plugins: paginatedPlugins,
        total: filteredPlugins.length,
        page,
        limit,
        hasMore: endIndex < filteredPlugins.length,
      };
    } catch (error) {
      this.logger.error('Failed to search plugins', error);
      throw error;
    }
  }

  async getPlugin(pluginId: string): Promise<MarketplacePlugin | null> {
    try {
      const plugins = await this.getCachedPlugins();
      const plugin = plugins.find(p => p.id === pluginId);

      if (plugin) {
        // Check if installed
        const installedExtensions = this.extensionManager.getAllExtensions();
        const installedExtension = installedExtensions.find(ext => ext.id === plugin.id);

        return {
          ...plugin,
          isInstalled: !!installedExtension,
          installedVersion: installedExtension?.version,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get plugin', error);
      throw error;
    }
  }

  async getCategories(): Promise<MarketplaceCategory[]> {
    try {
      const plugins = await this.getCachedPlugins();
      const categoryMap = new Map<string, MarketplaceCategory>();

      plugins.forEach(plugin => {
        if (!categoryMap.has(plugin.category)) {
          categoryMap.set(plugin.category, {
            id: plugin.category,
            name: this.formatCategoryName(plugin.category),
            description: this.getCategoryDescription(plugin.category),
            count: 0,
          });
        }
        categoryMap.get(plugin.category)!.count++;
      });

      return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      this.logger.error('Failed to get categories', error);
      throw error;
    }
  }

  async installPlugin(pluginId: string, version?: string): Promise<void> {
    try {
      this.logger.info(`Installing plugin: ${pluginId}${version ? `@${version}` : ''}`);

      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      if (plugin.isInstalled) {
        throw new Error(`Plugin already installed: ${pluginId}`);
      }

      // Create installation tracking
      const installation: PluginInstallation = {
        plugin,
        status: 'downloading',
        progress: 0,
      };
      this.installations.set(pluginId, installation);

      // For demo purposes, simulate installation process
      await this.simulateInstallation(installation);

      // Convert marketplace plugin to extension format and install
      const extension = this.convertToExtension(plugin);
      await this.createExtensionFiles(extension);

      // For theme plugins, just install without module activation
      if (plugin.category === 'themes') {
        await this.extensionManager.installExtension(
          path.join(app.getPath('userData'), 'extensions', extension.id)
        );
      } else {
        // For regular plugins, load and activate the extension
        await this.extensionManager.installExtension(
          path.join(app.getPath('userData'), 'extensions', extension.id)
        );
        await this.extensionManager.activateExtension(extension.id);
      }

      installation.status = 'completed';
      installation.progress = 100;

      this.logger.info(`Plugin installed successfully: ${pluginId}`);
    } catch (error) {
      const installation = this.installations.get(pluginId);
      if (installation) {
        installation.status = 'failed';
        installation.error = error instanceof Error ? error.message : 'Unknown error';
      }

      this.logger.error(`Failed to install plugin: ${pluginId}`, error);
      throw error;
    }
  }

  async updatePlugin(pluginId: string): Promise<void> {
    try {
      this.logger.info(`Updating plugin: ${pluginId}`);

      // First uninstall the current version
      await this.extensionManager.uninstallExtension(pluginId);

      // Then install the latest version
      await this.installPlugin(pluginId);

      this.logger.info(`Plugin updated successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to update plugin: ${pluginId}`, error);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      this.logger.info(`Uninstalling plugin: ${pluginId}`);

      await this.extensionManager.uninstallExtension(pluginId);

      // Remove installation tracking
      this.installations.delete(pluginId);

      this.logger.info(`Plugin uninstalled successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to uninstall plugin: ${pluginId}`, error);
      throw error;
    }
  }

  async checkForUpdates(): Promise<PluginUpdate[]> {
    try {
      const installedExtensions = this.extensionManager.getAllExtensions();
      const plugins = await this.getCachedPlugins();
      const updates: PluginUpdate[] = [];

      for (const extension of installedExtensions) {
        const plugin = plugins.find(p => p.id === extension.id);
        if (plugin && this.isVersionNewer(plugin.version, extension.version)) {
          updates.push({
            plugin,
            currentVersion: extension.version,
            availableVersion: plugin.version,
            changelog: plugin.versions[0]?.changelog,
          });
        }
      }

      return updates;
    } catch (error) {
      this.logger.error('Failed to check for updates', error);
      throw error;
    }
  }

  async getInstalledPlugins(): Promise<MarketplacePlugin[]> {
    try {
      const installedExtensions = this.extensionManager.getAllExtensions();
      const plugins = await this.getCachedPlugins();

      return plugins
        .filter(plugin => installedExtensions.some(ext => ext.id === plugin.id))
        .map(plugin => {
          const extension = installedExtensions.find(ext => ext.id === plugin.id)!;
          return {
            ...plugin,
            isInstalled: true,
            installedVersion: extension.version,
            hasUpdate: this.isVersionNewer(plugin.version, extension.version),
          };
        });
    } catch (error) {
      this.logger.error('Failed to get installed plugins', error);
      throw error;
    }
  }

  getInstallationStatus(pluginId: string): PluginInstallation | null {
    return this.installations.get(pluginId) || null;
  }

  private async getCachedPlugins(): Promise<MarketplacePlugin[]> {
    try {
      const cachePath = path.join(this.cachePath, 'plugins.json');
      if (!fs.existsSync(cachePath)) {
        await this.createMockPluginData();
      }

      const content = fs.readFileSync(cachePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Failed to load cached plugins', error);
      return [];
    }
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getCategoryDescription(category: string): string {
    const descriptions: { [key: string]: string } = {
      themes: 'Visual themes and color schemes',
      productivity: 'Tools to enhance your workflow',
      'version-control': 'Git and version control integration',
      debugging: 'Debugging and development tools',
      'language-support': 'Language-specific features and syntax highlighting',
      extensions: 'Extend functionality with new features',
    };

    return descriptions[category] || 'Miscellaneous plugins';
  }

  private async simulateInstallation(installation: PluginInstallation): Promise<void> {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      installation.progress = i;
      if (i <= 60) {
        installation.status = 'downloading';
      } else if (i <= 80) {
        installation.status = 'extracting';
      } else {
        installation.status = 'installing';
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private convertToExtension(plugin: MarketplacePlugin): Extension {
    return {
      id: plugin.id,
      name: plugin.displayName,
      version: plugin.version,
      description: plugin.description,
      main: 'extension.js',
      author: plugin.author.name,
      repository: plugin.repository?.url,
      license: plugin.license,
      keywords: plugin.tags,
      engines: plugin.engines,
      contributes: {
        // Default empty contributes - real plugins would have actual contributions
        commands: [],
        themes:
          plugin.category === 'themes'
            ? [
                {
                  id: plugin.id,
                  label: plugin.displayName,
                  path: './theme.json',
                },
              ]
            : undefined,
      },
    };
  }

  private async createExtensionFiles(extension: Extension): Promise<void> {
    const extensionPath = path.join(app.getPath('userData'), 'extensions', extension.id);

    if (!fs.existsSync(extensionPath)) {
      fs.mkdirSync(extensionPath, { recursive: true });
    }

    // Create package.json
    const manifest = {
      name: extension.id,
      displayName: extension.name,
      version: extension.version,
      description: extension.description,
      main: extension.main,
      contributes: extension.contributes,
      author: extension.author,
      repository: extension.repository,
      license: extension.license,
      keywords: extension.keywords,
      engines: extension.engines,
    };

    fs.writeFileSync(
      path.join(extensionPath, 'package.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    // Create minimal extension.js
    const extensionCode = `// Generated extension file for ${extension.name}

// Extension API is provided globally by the extension system
function activate(context) {
    console.log('Extension "${extension.name}" is now active!');
    
    // Register theme contribution if it exists
    if (context && context.subscriptions) {
        const themeDisposable = {
            dispose: () => {
                console.log('Theme "${extension.name}" is now deactivated!');
            }
        };
        context.subscriptions.push(themeDisposable);
    }
}

function deactivate() {
    console.log('Extension "${extension.name}" is now deactivated!');
}

module.exports = { activate, deactivate };
`;

    fs.writeFileSync(path.join(extensionPath, 'extension.js'), extensionCode, 'utf8');

    // Create theme file if it's a theme extension
    if (extension.contributes?.themes && extension.contributes.themes.length > 0) {
      const theme = {
        id: extension.id,
        name: extension.name,
        type: 'dark',
        colors: {
          'app.background': '#1e1e1e',
          'app.foreground': '#d4d4d4',
          'app.border': '#2d2d30',
          'panel.background': '#252526',
          'panel.foreground': '#cccccc',
          'terminal.background': '#1e1e1e',
          'terminal.foreground': '#d4d4d4',
          'button.background': '#0e639c',
          'button.foreground': '#ffffff',
          'button.hoverBackground': '#1177bb',
          'input.background': '#3c3c3c',
          'input.foreground': '#cccccc',
          'input.border': '#6c6c6c',
          'sideBar.background': '#252526',
          'sideBar.foreground': '#cccccc',
          'sideBar.border': '#2d2d30',
          'tab.activeBackground': '#1e1e1e',
          'tab.activeForeground': '#ffffff',
          'tab.inactiveBackground': '#2d2d2d',
          'tab.inactiveForeground': '#8f8f8f',
        },
      };

      fs.writeFileSync(
        path.join(extensionPath, 'theme.json'),
        JSON.stringify(theme, null, 2),
        'utf8'
      );
    }
  }

  private isVersionNewer(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => {
      return version.split('.').map(n => parseInt(n, 10));
    };

    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }

    return false;
  }

  async dispose(): Promise<void> {
    this.logger.info('Disposing marketplace service...');
    this.installations.clear();
    this.logger.info('Marketplace service disposed');
  }
}
