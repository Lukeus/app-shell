import React, { useState, useEffect, useMemo } from 'react';
import {
  Prompt,
  PromptCategory,
  PromptSearchQuery,
  PromptSearchResult,
  PromptImportResult,
} from '../../../schemas';
import { PromptCard } from '../prompts/PromptCard';
import { PromptSearchBar } from '../prompts/PromptSearchBar';

interface PromptRegistryViewProps {
  onPromptExecute?: (prompt: Prompt) => void;
  onPromptEdit?: (prompt: Prompt) => void;
}

export const PromptRegistryView: React.FC<PromptRegistryViewProps> = ({
  onPromptExecute,
  onPromptEdit,
}) => {
  // State management
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<PromptSearchQuery>({
    sortBy: 'name',
    sortDirection: 'asc',
    limit: 50,
    offset: 0,
  });
  const [searchResult, setSearchResult] = useState<PromptSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadPrompts();
  }, []);

  // Load prompts when search query changes
  useEffect(() => {
    if (activeTab === 'all') {
      searchPrompts();
    } else if (activeTab === 'recent') {
      loadRecentPrompts();
    } else if (activeTab === 'favorites') {
      loadFavoritePrompts();
    }
  }, [searchQuery, activeTab]);

  // Set up event listeners
  useEffect(() => {
    const handlePromptAdded = (prompt: Prompt) => {
      setPrompts(prev => [...(prev || []), prompt]);
      updateCategoryCount(prompt.category, 1);
    };

    const handlePromptUpdated = (prompt: Prompt) => {
      setPrompts(prev => (prev || []).map(p => (p.id === prompt.id ? prompt : p)));
      if (selectedPrompt?.id === prompt.id) {
        setSelectedPrompt(prompt);
      }
    };

    const handlePromptRemoved = (promptId: string) => {
      setPrompts(prev => {
        const safeArray = prev || [];
        const removed = safeArray.find(p => p.id === promptId);
        if (removed) {
          updateCategoryCount(removed.category, -1);
        }
        return safeArray.filter(p => p.id !== promptId);
      });
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
      }
    };

    const handleImportCompleted = (result: PromptImportResult) => {
      if (result.imported > 0) {
        loadPrompts(); // Reload all prompts
        loadCategories(); // Update category counts
      }
    };

    // Register event listeners
    window.electronAPI?.onPromptAdded?.(handlePromptAdded);
    window.electronAPI?.onPromptUpdated?.(handlePromptUpdated);
    window.electronAPI?.onPromptRemoved?.(handlePromptRemoved);
    window.electronAPI?.onPromptImportCompleted?.(handleImportCompleted);

    return () => {
      // Cleanup listeners
      window.electronAPI?.removePromptEventListener?.('prompt-added', handlePromptAdded);
      window.electronAPI?.removePromptEventListener?.('prompt-updated', handlePromptUpdated);
      window.electronAPI?.removePromptEventListener?.('prompt-removed', handlePromptRemoved);
      window.electronAPI?.removePromptEventListener?.('import-completed', handleImportCompleted);
    };
  }, [selectedPrompt]);

  const updateCategoryCount = (categoryId: string, delta: number) => {
    setCategories(prev =>
      (prev || []).map(cat =>
        cat.id === categoryId ? { ...cat, promptCount: Math.max(0, cat.promptCount + delta) } : cat
      )
    );
  };

  const loadCategories = async () => {
    try {
      if (!window.electronAPI?.getPromptCategories) {
        console.warn('Prompt categories API not available');
        setCategories([]);
        return;
      }
      const result = await window.electronAPI.getPromptCategories();
      if (result && Array.isArray(result)) {
        setCategories(result);
      } else {
        setCategories([]); // Ensure we have a default empty array
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
      setCategories([]); // Set empty array on error
    }
  };

  const loadPrompts = async () => {
    try {
      setLoading(true);
      if (!window.electronAPI?.getAllPrompts) {
        console.warn('Get all prompts API not available');
        setPrompts([]);
        return;
      }
      const result = await window.electronAPI.getAllPrompts();
      if (result && Array.isArray(result)) {
        setPrompts(result);
      } else {
        setPrompts([]); // Ensure we have a default empty array
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError('Failed to load prompts');
      setPrompts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const searchPrompts = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI?.searchPrompts?.(searchQuery);
      if (result) {
        setSearchResult(result);
        setPrompts(result.prompts || []);
      } else {
        setPrompts([]);
        setSearchResult(null);
      }
    } catch (err) {
      console.error('Failed to search prompts:', err);
      setError('Failed to search prompts');
      setPrompts([]);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentPrompts = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI?.getRecentPrompts?.();
      if (result) {
        setPrompts(result);
        setSearchResult(null);
      } else {
        setPrompts([]);
        setSearchResult(null);
      }
    } catch (err) {
      console.error('Failed to load recent prompts:', err);
      setError('Failed to load recent prompts');
      setPrompts([]);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritePrompts = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI?.getFavoritePrompts?.();
      if (result) {
        setPrompts(result);
        setSearchResult(null);
      } else {
        setPrompts([]);
        setSearchResult(null);
      }
    } catch (err) {
      console.error('Failed to load favorite prompts:', err);
      setError('Failed to load favorite prompts');
      setPrompts([]);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const handlePromptExecute = async (prompt: Prompt) => {
    try {
      await window.electronAPI?.recordPromptUsage?.(prompt.id);
      onPromptExecute?.(prompt);
    } catch (err) {
      console.error('Failed to execute prompt:', err);
      setError('Failed to execute prompt');
    }
  };

  const handlePromptEdit = (prompt: Prompt) => {
    onPromptEdit?.(prompt);
  };

  const handlePromptDelete = async (prompt: Prompt) => {
    try {
      await window.electronAPI?.deletePrompt?.(prompt.id);
      // Event listener will handle UI updates
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError('Failed to delete prompt');
    }
  };

  const handleToggleFavorite = async (prompt: Prompt) => {
    try {
      const isFavorite = await window.electronAPI?.togglePromptFavorite?.(prompt.id);
      // Update local state immediately for better UX
      if (typeof isFavorite === 'boolean') {
        setPrompts(prev => (prev || []).map(p => (p.id === prompt.id ? { ...p, isFavorite } : p)));
        if (selectedPrompt?.id === prompt.id) {
          setSelectedPrompt({ ...selectedPrompt, isFavorite });
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setError('Failed to toggle favorite');
    }
  };

  const handleImportFromFabric = async () => {
    try {
      const result = await window.electronAPI?.selectImportSource?.({
        title: 'Select Fabric Patterns Directory or File',
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!result?.canceled && result?.filePaths && result.filePaths.length > 0) {
        const sourcePath = result.filePaths[0];

        const importResult = await window.electronAPI?.importFromFabric?.({
          source: sourcePath,
          targetCategory: 'fabric',
          overwrite: false,
          preserveMetadata: true,
        });

        if (importResult) {
          alert(
            `Import completed: ${importResult.imported} prompts imported, ${importResult.skipped} skipped, ${importResult.failed} failed`
          );
        }
      }
    } catch (err) {
      console.error('Failed to import from Fabric:', err);
      setError('Failed to import from Fabric');
    }
  };

  const filteredPrompts = useMemo(() => {
    return prompts || []; // Ensure we never return undefined
  }, [prompts]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-vscode-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-vscode-fg-primary">Prompt Registry</h2>

          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded text-xs text-vscode-fg-muted hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary"
              onClick={handleImportFromFabric}
              title="Import from Fabric"
            >
              📥
            </button>
            <button
              className="p-1 rounded text-xs text-vscode-fg-muted hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary"
              onClick={() => loadPrompts()}
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex mb-3 border border-vscode-border rounded-md overflow-hidden">
          {[
            { key: 'all', label: 'All', icon: '📝' },
            { key: 'recent', label: 'Recent', icon: '🕐' },
            { key: 'favorites', label: 'Favorites', icon: '⭐' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-2 py-1 text-xs flex items-center justify-center gap-1 transition-colors ${
                activeTab === tab.key
                  ? 'bg-vscode-accent-blue text-white'
                  : 'text-vscode-fg-secondary hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        {activeTab === 'all' && (
          <PromptSearchBar
            searchQuery={searchQuery}
            categories={categories}
            onSearchChange={setSearchQuery}
            placeholder="Search prompts..."
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-2 bg-red-900 bg-opacity-20 border-b border-red-700 text-red-200 text-xs">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Results info */}
      {searchResult && activeTab === 'all' && (
        <div className="px-2 py-1 bg-vscode-bg-tertiary border-b border-vscode-border text-xs text-vscode-fg-muted">
          Found {searchResult.total} prompts in {searchResult.searchTime}ms
          {searchQuery.query && ` for "${searchQuery.query}"`}
        </div>
      )}

      {/* Prompt list */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-vscode-fg-muted">Loading prompts...</div>
          </div>
        ) : !filteredPrompts || filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm text-vscode-fg-muted mb-2">
              {activeTab === 'recent'
                ? 'No recent prompts'
                : activeTab === 'favorites'
                  ? 'No favorite prompts'
                  : searchQuery.query
                    ? 'No prompts found'
                    : 'No prompts available'}
            </div>
            {activeTab === 'all' && !searchQuery.query && (
              <button
                onClick={handleImportFromFabric}
                className="px-3 py-1 text-xs bg-vscode-accent-blue text-white rounded hover:bg-blue-600"
              >
                Import from Fabric
              </button>
            )}
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isSelected={selectedPrompt?.id === prompt.id}
              onSelect={handlePromptSelect}
              onExecute={handlePromptExecute}
              onEdit={handlePromptEdit}
              onDelete={handlePromptDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        )}
      </div>

      {/* Pagination for search results */}
      {searchResult && searchResult.total > searchQuery.limit! && (
        <div className="p-2 border-t border-vscode-border flex items-center justify-between text-xs">
          <span className="text-vscode-fg-muted">
            Showing {searchQuery.offset! + 1}-
            {Math.min(searchQuery.offset! + searchQuery.limit!, searchResult.total)} of{' '}
            {searchResult.total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() =>
                setSearchQuery(prev => ({
                  ...prev,
                  offset: Math.max(0, prev.offset! - prev.limit!),
                }))
              }
              disabled={searchQuery.offset === 0}
              className="px-2 py-1 rounded bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() =>
                setSearchQuery(prev => ({ ...prev, offset: prev.offset! + prev.limit! }))
              }
              disabled={searchQuery.offset! + searchQuery.limit! >= searchResult.total}
              className="px-2 py-1 rounded bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
