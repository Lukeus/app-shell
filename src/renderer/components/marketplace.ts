import {
  MarketplacePlugin,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  MarketplaceCategory,
} from '../../types';

interface PluginWithUpdateInfo extends MarketplacePlugin {
  currentVersion?: string;
  changelog?: string;
  availableVersion?: string;
}

interface MarketplaceOptions {
  container: HTMLElement;
  onPluginInstall?: (pluginId: string) => void;
  onPluginUninstall?: (pluginId: string) => void;
  onPluginUpdate?: (pluginId: string) => void;
}

export class Marketplace {
  private container: HTMLElement;
  private currentQuery: MarketplaceSearchQuery = {};
  private currentResults: MarketplaceSearchResult | null = null;
  private categories: MarketplaceCategory[] = [];
  private selectedCategory: string | null = null;
  private currentView: 'browse' | 'installed' | 'updates' = 'browse';
  private onPluginInstall?: (pluginId: string) => void;
  private onPluginUninstall?: (pluginId: string) => void;
  private onPluginUpdate?: (pluginId: string) => void;

  constructor(options: MarketplaceOptions) {
    this.container = options.container;
    this.onPluginInstall = options.onPluginInstall;
    this.onPluginUninstall = options.onPluginUninstall;
    this.onPluginUpdate = options.onPluginUpdate;

    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Load categories
      this.categories = (await window.electronAPI?.getMarketplaceCategories()) || [];

      // Build UI
      this.buildUI();

      // Load initial content
      await this.loadBrowseView();
    } catch (error) {
      console.error('Failed to initialize marketplace:', error);
      this.showError('Failed to initialize marketplace');
    }
  }

  private buildUI(): void {
    this.container.innerHTML = `
      <div class="marketplace-header">
        <div class="marketplace-nav">
          <button class="nav-button active" data-view="browse">
            <span class="nav-icon">🏪</span>
            Browse
          </button>
          <button class="nav-button" data-view="installed">
            <span class="nav-icon">📦</span>
            Installed
          </button>
          <button class="nav-button" data-view="updates">
            <span class="nav-icon">🔄</span>
            Updates
          </button>
        </div>
      </div>

      <div class="marketplace-content">
        <!-- Search and filters will be inserted here -->
        <div class="marketplace-search" style="display: none;">
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="Search plugins..." />
            <button id="search-btn">Search</button>
          </div>
          <div class="filters">
            <select id="category-filter">
              <option value="">All Categories</option>
              ${this.categories
                .map(cat => `<option value="${cat.id}">${cat.name} (${cat.count})</option>`)
                .join('')}
            </select>
            <select id="sort-filter">
              <option value="relevance">Relevance</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="downloads">Downloads</option>
              <option value="updated">Updated</option>
            </select>
          </div>
        </div>

        <!-- Results area -->
        <div class="marketplace-results" id="marketplace-results">
          <div class="loading">Loading plugins...</div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.applyStyles();
  }

  private attachEventListeners(): void {
    // Navigation buttons
    this.container.querySelectorAll('.nav-button').forEach(button => {
      button.addEventListener('click', e => {
        const target = e.currentTarget as HTMLButtonElement;
        const view = target.dataset.view as 'browse' | 'installed' | 'updates';
        this.switchView(view);
      });
    });

    // Search
    const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
    const searchBtn = this.container.querySelector('#search-btn') as HTMLButtonElement;

    if (searchInput && searchBtn) {
      const performSearch = () => {
        this.currentQuery.query = searchInput.value.trim();
        this.currentQuery.page = 1; // Reset pagination
        this.searchPlugins();
      };

      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }

    // Filters
    const categoryFilter = this.container.querySelector('#category-filter') as HTMLSelectElement;
    const sortFilter = this.container.querySelector('#sort-filter') as HTMLSelectElement;

    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.currentQuery.category = categoryFilter.value || undefined;
        this.currentQuery.page = 1;
        this.searchPlugins();
      });
    }

    if (sortFilter) {
      sortFilter.addEventListener('change', () => {
        const [sortBy, sortOrder] = sortFilter.value.split(':');
        this.currentQuery.sortBy = sortBy as
          | 'relevance'
          | 'name'
          | 'rating'
          | 'downloads'
          | 'updated';
        this.currentQuery.sortOrder = (sortOrder as 'asc' | 'desc') || 'desc';
        this.currentQuery.page = 1;
        this.searchPlugins();
      });
    }
  }

  private async switchView(view: 'browse' | 'installed' | 'updates'): Promise<void> {
    this.currentView = view;

    // Update navigation
    this.container.querySelectorAll('.nav-button').forEach(btn => {
      const button = btn as HTMLButtonElement;
      button.classList.toggle('active', button.dataset.view === view);
    });

    // Show/hide search based on view
    const searchSection = this.container.querySelector('.marketplace-search') as HTMLElement;
    if (searchSection) {
      searchSection.style.display = view === 'browse' ? 'block' : 'none';
    }

    // Load content for the view
    switch (view) {
      case 'browse':
        await this.loadBrowseView();
        break;
      case 'installed':
        await this.loadInstalledView();
        break;
      case 'updates':
        await this.loadUpdatesView();
        break;
    }
  }

  private async loadBrowseView(): Promise<void> {
    try {
      this.showSearchSection();
      await this.searchPlugins();
    } catch (error) {
      console.error('Failed to load browse view:', error);
      this.showError('Failed to load plugins');
    }
  }

  private async loadInstalledView(): Promise<void> {
    try {
      this.showLoading();
      const installedPlugins = (await window.electronAPI?.getInstalledPlugins()) || [];
      this.renderPluginList(installedPlugins, 'No plugins installed');
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
      this.showError('Failed to load installed plugins');
    }
  }

  private async loadUpdatesView(): Promise<void> {
    try {
      this.showLoading();
      const updates = (await window.electronAPI?.checkPluginUpdates()) || [];

      if (updates.length === 0) {
        this.showMessage('All plugins are up to date');
        return;
      }

      const plugins = updates.map(update => ({
        ...update.plugin,
        hasUpdate: true,
        availableVersion: update.availableVersion,
        currentVersion: update.currentVersion,
        changelog: update.changelog,
      }));

      this.renderPluginList(plugins, 'No updates available');
    } catch (error) {
      console.error('Failed to check for updates:', error);
      this.showError('Failed to check for updates');
    }
  }

  private showSearchSection(): void {
    const searchSection = this.container.querySelector('.marketplace-search') as HTMLElement;
    if (searchSection) {
      searchSection.style.display = 'block';
    }
  }

  private async searchPlugins(): Promise<void> {
    try {
      this.showLoading();

      const result = await window.electronAPI?.searchMarketplacePlugins(this.currentQuery);
      if (result) {
        this.currentResults = result;
        this.renderSearchResults(result);
      } else {
        this.showError('Failed to search plugins');
      }
    } catch (error) {
      console.error('Failed to search plugins:', error);
      this.showError('Failed to search plugins');
    }
  }

  private renderSearchResults(result: MarketplaceSearchResult): void {
    if (result.plugins.length === 0) {
      this.showMessage('No plugins found');
      return;
    }

    this.renderPluginList(result.plugins);

    // Add pagination if needed
    if (result.hasMore) {
      this.addPaginationControls(result);
    }
  }

  private renderPluginList(
    plugins: MarketplacePlugin[],
    emptyMessage: string = 'No plugins available'
  ): void {
    const resultsContainer = this.container.querySelector('#marketplace-results') as HTMLElement;

    if (plugins.length === 0) {
      resultsContainer.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
      return;
    }

    const pluginsHtml = plugins.map(plugin => this.renderPluginCard(plugin)).join('');
    resultsContainer.innerHTML = `<div class="plugin-grid">${pluginsHtml}</div>`;

    // Attach event listeners for plugin actions
    this.attachPluginEventListeners();
  }

  private renderPluginCard(plugin: MarketplacePlugin): string {
    const isInstalled = plugin.isInstalled;
    const hasUpdate = plugin.hasUpdate;

    let actionButtons = '';

    if (this.currentView === 'updates' && hasUpdate) {
      actionButtons = `
        <button class="btn btn-primary btn-update" data-plugin-id="${plugin.id}">
          Update to ${(plugin as PluginWithUpdateInfo).availableVersion}
        </button>
      `;
    } else if (isInstalled) {
      actionButtons = `
        <button class="btn btn-secondary btn-uninstall" data-plugin-id="${plugin.id}">
          Uninstall
        </button>
        ${hasUpdate ? `<button class="btn btn-primary btn-update" data-plugin-id="${plugin.id}">Update</button>` : ''}
      `;
    } else {
      actionButtons = `
        <button class="btn btn-primary btn-install" data-plugin-id="${plugin.id}">
          Install
        </button>
      `;
    }

    const rating =
      plugin.rating.count > 0
        ? `<div class="rating">
          ${'★'.repeat(Math.round(plugin.rating.average))}${'☆'.repeat(5 - Math.round(plugin.rating.average))}
          (${plugin.rating.count})
         </div>`
        : '';

    const versionInfo =
      this.currentView === 'updates' && plugin.hasUpdate
        ? `<div class="version-info">
          <span class="current-version">${(plugin as PluginWithUpdateInfo).currentVersion}</span> → 
          <span class="new-version">${plugin.version}</span>
         </div>`
        : `<div class="version">v${plugin.version}</div>`;

    return `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <div class="plugin-header">
          <h3 class="plugin-name">${plugin.displayName}</h3>
          <div class="plugin-meta">
            <span class="plugin-author">by ${plugin.author.name}</span>
            ${versionInfo}
          </div>
        </div>
        
        <div class="plugin-description">
          ${plugin.description}
        </div>
        
        <div class="plugin-tags">
          ${plugin.tags
            .slice(0, 3)
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('')}
        </div>
        
        <div class="plugin-stats">
          <span class="downloads">📥 ${this.formatNumber(plugin.downloadCount)}</span>
          ${rating}
        </div>
        
        ${
          this.currentView === 'updates' && (plugin as PluginWithUpdateInfo).changelog
            ? `
          <div class="changelog">
            <details>
              <summary>What's New</summary>
              <div class="changelog-content">${(plugin as PluginWithUpdateInfo).changelog}</div>
            </details>
          </div>
        `
            : ''
        }
        
        <div class="plugin-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }

  private attachPluginEventListeners(): void {
    // Install buttons
    this.container.querySelectorAll('.btn-install').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLButtonElement;
        const pluginId = target.dataset.pluginId!;
        this.handlePluginInstall(pluginId);
      });
    });

    // Uninstall buttons
    this.container.querySelectorAll('.btn-uninstall').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLButtonElement;
        const pluginId = target.dataset.pluginId!;
        this.handlePluginUninstall(pluginId);
      });
    });

    // Update buttons
    this.container.querySelectorAll('.btn-update').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLButtonElement;
        const pluginId = target.dataset.pluginId!;
        this.handlePluginUpdate(pluginId);
      });
    });
  }

  private async handlePluginInstall(pluginId: string): Promise<void> {
    try {
      const button = this.container.querySelector(
        `[data-plugin-id="${pluginId}"] .btn-install`
      ) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Installing...';
      }

      await window.electronAPI?.installMarketplacePlugin(pluginId);

      if (this.onPluginInstall) {
        this.onPluginInstall(pluginId);
      }

      // Refresh current view
      await this.refreshCurrentView();
    } catch (error) {
      console.error(`Failed to install plugin ${pluginId}:`, error);
      this.showError(`Failed to install plugin: ${error}`);

      // Reset button
      const button = this.container.querySelector(
        `[data-plugin-id="${pluginId}"] .btn-install`
      ) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Install';
      }
    }
  }

  private async handlePluginUninstall(pluginId: string): Promise<void> {
    try {
      const button = this.container.querySelector(
        `[data-plugin-id="${pluginId}"] .btn-uninstall`
      ) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Uninstalling...';
      }

      await window.electronAPI?.uninstallMarketplacePlugin(pluginId);

      if (this.onPluginUninstall) {
        this.onPluginUninstall(pluginId);
      }

      // Refresh current view
      await this.refreshCurrentView();
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      this.showError(`Failed to uninstall plugin: ${error}`);

      // Reset button
      const button = this.container.querySelector(
        `[data-plugin-id="${pluginId}"] .btn-uninstall`
      ) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Uninstall';
      }
    }
  }

  private async handlePluginUpdate(pluginId: string): Promise<void> {
    try {
      const button = this.container.querySelector(
        `[data-plugin-id="${pluginId}"] .btn-update`
      ) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Updating...';
      }

      await window.electronAPI?.updateMarketplacePlugin(pluginId);

      if (this.onPluginUpdate) {
        this.onPluginUpdate(pluginId);
      }

      // Refresh current view
      await this.refreshCurrentView();
    } catch (error) {
      console.error(`Failed to update plugin ${pluginId}:`, error);
      this.showError(`Failed to update plugin: ${error}`);

      // Reset button
      const button = this.container.querySelector(
        `[data-plugin-id="${pluginId}"] .btn-update`
      ) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Update';
      }
    }
  }

  private async refreshCurrentView(): Promise<void> {
    switch (this.currentView) {
      case 'browse':
        await this.searchPlugins();
        break;
      case 'installed':
        await this.loadInstalledView();
        break;
      case 'updates':
        await this.loadUpdatesView();
        break;
    }
  }

  private addPaginationControls(result: MarketplaceSearchResult): void {
    const resultsContainer = this.container.querySelector('#marketplace-results') as HTMLElement;

    const paginationHtml = `
      <div class="pagination">
        <button class="btn btn-secondary" id="load-more" ${!result.hasMore ? 'disabled' : ''}>
          Load More (${result.plugins.length} of ${result.total})
        </button>
      </div>
    `;

    resultsContainer.insertAdjacentHTML('beforeend', paginationHtml);

    const loadMoreBtn = resultsContainer.querySelector('#load-more') as HTMLButtonElement;
    if (loadMoreBtn && result.hasMore) {
      loadMoreBtn.addEventListener('click', async () => {
        this.currentQuery.page = (this.currentQuery.page || 1) + 1;
        await this.searchPlugins();
      });
    }
  }

  private showLoading(): void {
    const resultsContainer = this.container.querySelector('#marketplace-results') as HTMLElement;
    resultsContainer.innerHTML = '<div class="loading">Loading...</div>';
  }

  private showError(message: string): void {
    const resultsContainer = this.container.querySelector('#marketplace-results') as HTMLElement;
    resultsContainer.innerHTML = `<div class="error">${message}</div>`;
  }

  private showMessage(message: string): void {
    const resultsContainer = this.container.querySelector('#marketplace-results') as HTMLElement;
    resultsContainer.innerHTML = `<div class="message">${message}</div>`;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  private applyStyles(): void {
    const styles = `
      <style>
        .marketplace-header {
          border-bottom: 1px solid #2d2d30;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }

        .marketplace-nav {
          display: flex;
          gap: 8px;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #cccccc;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .nav-button:hover {
          background: #404040;
          border-color: #007acc;
        }

        .nav-button.active {
          background: #007acc;
          border-color: #007acc;
          color: #ffffff;
        }

        .nav-icon {
          font-size: 14px;
        }

        .marketplace-search {
          margin-bottom: 16px;
          padding: 12px;
          background: #252526;
          border-radius: 4px;
          border: 1px solid #3e3e42;
        }

        .search-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .search-bar input {
          flex: 1;
          padding: 8px 12px;
          background: #3c3c3c;
          border: 1px solid #6c6c6c;
          border-radius: 4px;
          color: #cccccc;
          font-size: 12px;
        }

        .search-bar input:focus {
          outline: none;
          border-color: #007acc;
        }

        .filters {
          display: flex;
          gap: 12px;
        }

        .filters select {
          padding: 6px 8px;
          background: #3c3c3c;
          border: 1px solid #6c6c6c;
          border-radius: 4px;
          color: #cccccc;
          font-size: 12px;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007acc;
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1177bb;
        }

        .btn-secondary {
          background: #6c6c6c;
          color: #ffffff;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #808080;
        }

        .plugin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .plugin-card {
          padding: 16px;
          background: #252526;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .plugin-card:hover {
          border-color: #007acc;
          box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
        }

        .plugin-header {
          margin-bottom: 12px;
        }

        .plugin-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .plugin-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #808080;
        }

        .plugin-author {
          color: #cccccc;
        }

        .version-info {
          color: #ffcc02;
        }

        .current-version {
          text-decoration: line-through;
          color: #808080;
        }

        .new-version {
          color: #608b4e;
          font-weight: 500;
        }

        .plugin-description {
          font-size: 13px;
          color: #cccccc;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .plugin-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 12px;
        }

        .tag {
          padding: 2px 6px;
          background: #3e3e42;
          border-radius: 3px;
          font-size: 10px;
          color: #cccccc;
        }

        .plugin-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 11px;
          color: #808080;
        }

        .downloads {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .rating {
          color: #ffcc02;
        }

        .changelog {
          margin-bottom: 12px;
        }

        .changelog details {
          font-size: 12px;
        }

        .changelog summary {
          cursor: pointer;
          color: #007acc;
        }

        .changelog-content {
          margin-top: 8px;
          padding: 8px;
          background: #1e1e1e;
          border-radius: 4px;
          color: #cccccc;
        }

        .plugin-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .loading, .error, .message, .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #808080;
          font-style: italic;
        }

        .error {
          color: #f44747;
        }

        .pagination {
          text-align: center;
          margin-top: 20px;
        }
      </style>
    `;

    // Remove existing styles
    const existingStyles = this.container.querySelector('style');
    if (existingStyles) {
      existingStyles.remove();
    }

    // Add new styles
    this.container.insertAdjacentHTML('afterbegin', styles);
  }
}
