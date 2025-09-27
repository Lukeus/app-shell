import React, { useState, useEffect, useCallback } from 'react';
import {
  MarketplacePlugin,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  MarketplaceCategory,
} from '../../../types';

type MarketplaceView = 'browse' | 'installed' | 'updates';

export const MarketplaceView: React.FC = () => {
  const [currentView, setCurrentView] = useState<MarketplaceView>('browse');
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [currentQuery, setCurrentQuery] = useState<MarketplaceSearchQuery>({});
  const [currentResults, setCurrentResults] = useState<MarketplaceSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const cats = (await window.electronAPI?.getMarketplaceCategories()) || [];
        setCategories(cats);
        await loadBrowseView();
      } catch (err) {
        console.error('Failed to initialize marketplace:', err);
        setError('Failed to initialize marketplace');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadBrowseView = async () => {
    try {
      setLoading(true);
      setError(null);
      await searchPlugins({ query: '', page: 1 });
    } catch (err) {
      console.error('Failed to load browse view:', err);
      setError('Failed to load plugins');
    } finally {
      setLoading(false);
    }
  };

  const searchPlugins = async (query?: Partial<MarketplaceSearchQuery>) => {
    try {
      setLoading(true);
      const searchQuery = { ...currentQuery, ...query };
      setCurrentQuery(searchQuery);

      const results = await window.electronAPI?.searchMarketplacePlugins(searchQuery);
      setCurrentResults(results || null);
    } catch (err) {
      console.error('Failed to search plugins:', err);
      setError('Failed to search plugins');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    searchPlugins({
      query: searchInput.trim(),
      category: selectedCategory || undefined,
      sortBy: sortBy as any,
      page: 1,
    });
  }, [searchInput, selectedCategory, sortBy]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const switchView = async (view: MarketplaceView) => {
    setCurrentView(view);
    setLoading(true);
    setError(null);

    try {
      switch (view) {
        case 'browse':
          await loadBrowseView();
          break;
        case 'installed':
          const installed = (await window.electronAPI?.getInstalledPlugins()) || [];
          setCurrentResults({
            plugins: installed,
            total: installed.length,
            page: 1,
            limit: 50,
            hasMore: false,
          });
          break;
        case 'updates':
          const updates = (await window.electronAPI?.checkPluginUpdates()) || [];
          // Convert updates to plugins for consistency
          const updatePlugins = updates.map((update: any) => update.plugin);
          setCurrentResults({
            plugins: updatePlugins,
            total: updatePlugins.length,
            page: 1,
            limit: 50,
            hasMore: false,
          });
          break;
      }
    } catch (err) {
      console.error(`Failed to load ${view} view:`, err);
      setError(`Failed to load ${view}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePluginAction = async (
    plugin: MarketplacePlugin,
    action: 'install' | 'uninstall' | 'update'
  ) => {
    try {
      switch (action) {
        case 'install':
          await window.electronAPI?.installMarketplacePlugin(plugin.id);
          console.log(`Installed plugin: ${plugin.id}`);
          break;
        case 'uninstall':
          await window.electronAPI?.uninstallMarketplacePlugin(plugin.id);
          console.log(`Uninstalled plugin: ${plugin.id}`);
          break;
        case 'update':
          await window.electronAPI?.updateMarketplacePlugin(plugin.id);
          console.log(`Updated plugin: ${plugin.id}`);
          break;
      }
      // Refresh current view
      await switchView(currentView);
    } catch (err) {
      console.error(`Failed to ${action} plugin:`, err);
      setError(`Failed to ${action} plugin`);
    }
  };

  const renderPluginCard = (plugin: MarketplacePlugin) => (
    <div
      key={plugin.id}
      className="p-3 rounded border mb-2 hover:bg-gray-700 transition-colors"
      style={{
        backgroundColor: 'var(--color-vscode-bg-tertiary)',
        borderColor: 'var(--color-vscode-border)',
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4
            className="font-semibold text-sm mb-1"
            style={{ color: 'var(--color-vscode-fg-secondary)' }}
          >
            {plugin.displayName || plugin.name}
          </h4>
          <p className="text-xs mb-2" style={{ color: 'var(--color-vscode-fg-muted)' }}>
            {plugin.description}
          </p>
          <div className="text-xxs" style={{ color: 'var(--color-vscode-fg-disabled)' }}>
            v{plugin.version} •{' '}
            {typeof plugin.author === 'string' ? plugin.author : plugin.author?.name || 'Unknown'}
            {plugin.downloadCount && ` • ${plugin.downloadCount.toLocaleString()} downloads`}
            {plugin.rating && <span> • ⭐ {plugin.rating.average.toFixed(1)}</span>}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          {currentView === 'browse' && (
            <button
              className="px-2 py-1 text-xxs rounded transition-colors"
              style={{
                backgroundColor: 'var(--color-vscode-accent-blue)',
                color: 'white',
              }}
              onClick={() => handlePluginAction(plugin, 'install')}
            >
              Install
            </button>
          )}
          {currentView === 'installed' && (
            <button
              className="px-2 py-1 text-xxs rounded transition-colors bg-red-600 text-white hover:bg-red-700"
              onClick={() => handlePluginAction(plugin, 'uninstall')}
            >
              Uninstall
            </button>
          )}
          {currentView === 'updates' && (
            <button
              className="px-2 py-1 text-xxs rounded transition-colors"
              style={{
                backgroundColor: 'var(--color-vscode-accent-blue)',
                color: 'white',
              }}
              onClick={() => handlePluginAction(plugin, 'update')}
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-400 text-sm">{error}</div>
        <button
          className="mt-2 px-3 py-1 text-xs rounded"
          style={{ backgroundColor: 'var(--color-vscode-accent-blue)', color: 'white' }}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-vscode-border)' }}>
        {[
          { key: 'browse', label: '🏪 Browse' },
          { key: 'installed', label: '📦 Installed' },
          { key: 'updates', label: '🔄 Updates' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`px-3 py-2 text-xs font-medium transition-colors ${currentView === key ? 'border-b-2' : ''}`}
            style={{
              color:
                currentView === key
                  ? 'var(--color-vscode-accent-blue)'
                  : 'var(--color-vscode-fg-secondary)',
              borderColor: currentView === key ? 'var(--color-vscode-accent-blue)' : 'transparent',
              backgroundColor:
                currentView === key ? 'var(--color-vscode-bg-quaternary)' : 'transparent',
            }}
            onClick={() => switchView(key as MarketplaceView)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      {currentView === 'browse' && (
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-vscode-border)' }}>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Search plugins..."
              className="flex-1 px-2 py-1 text-xs rounded setting-input"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="px-2 py-1 text-xs rounded"
              style={{ backgroundColor: 'var(--color-vscode-accent-blue)', color: 'white' }}
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
          <div className="flex gap-2">
            <select
              className="setting-input"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
            <select
              className="setting-input"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="downloads">Downloads</option>
              <option value="updated">Updated</option>
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 p-2 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm" style={{ color: 'var(--color-vscode-fg-muted)' }}>
              Loading...
            </div>
          </div>
        ) : currentResults?.plugins.length ? (
          <div>
            {currentResults.plugins.map(plugin => renderPluginCard(plugin))}
            {currentResults.hasMore && (
              <button
                className="w-full mt-2 py-2 text-xs rounded"
                style={{
                  backgroundColor: 'var(--color-vscode-bg-quaternary)',
                  color: 'var(--color-vscode-fg-secondary)',
                }}
                onClick={() =>
                  searchPlugins({ ...currentQuery, page: (currentQuery.page || 1) + 1 })
                }
              >
                Load More
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-sm" style={{ color: 'var(--color-vscode-fg-muted)' }}>
              {currentView === 'browse'
                ? 'No plugins found'
                : currentView === 'installed'
                  ? 'No plugins installed'
                  : 'No updates available'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
