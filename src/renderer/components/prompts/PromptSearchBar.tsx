import React, { useState, useRef, useEffect } from 'react';
import { PromptSearchQuery, PromptCategory } from '../../../schemas';

interface PromptSearchBarProps {
  searchQuery: PromptSearchQuery;
  categories: PromptCategory[];
  onSearchChange: (query: PromptSearchQuery) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export const PromptSearchBar: React.FC<PromptSearchBarProps> = ({
  searchQuery,
  categories,
  onSearchChange,
  placeholder = 'Search prompts...',
  showFilters = true,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery.query || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (localQuery !== searchQuery.query) {
        onSearchChange({
          ...searchQuery,
          query: localQuery || undefined,
        });
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localQuery]);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    onSearchChange({
      ...searchQuery,
      query: undefined,
    });
    searchInputRef.current?.focus();
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = searchQuery.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];

    onSearchChange({
      ...searchQuery,
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleTagAdd = (tag: string) => {
    if (!tag.trim()) return;

    const currentTags = searchQuery.tags || [];
    if (currentTags.includes(tag.trim())) return;

    onSearchChange({
      ...searchQuery,
      tags: [...currentTags, tag.trim()],
    });
  };

  const handleTagRemove = (tag: string) => {
    const currentTags = searchQuery.tags || [];
    const newTags = currentTags.filter(t => t !== tag);

    onSearchChange({
      ...searchQuery,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleDifficultyToggle = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const currentDifficulties = searchQuery.difficulty || [];
    const newDifficulties = currentDifficulties.includes(difficulty)
      ? currentDifficulties.filter(d => d !== difficulty)
      : [...currentDifficulties, difficulty];

    onSearchChange({
      ...searchQuery,
      difficulty: newDifficulties.length > 0 ? newDifficulties : undefined,
    });
  };

  const handleSortChange = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    onSearchChange({
      ...searchQuery,
      sortBy: sortBy as any,
      sortDirection,
    });
  };

  const handleFavoritesToggle = () => {
    onSearchChange({
      ...searchQuery,
      favoritesOnly: searchQuery.favoritesOnly ? undefined : true,
    });
  };

  const handleClearAllFilters = () => {
    onSearchChange({
      query: localQuery || undefined,
      sortBy: 'name',
      sortDirection: 'asc',
      offset: 0,
      limit: 50,
    });
  };

  const hasActiveFilters = !!(
    searchQuery.categories?.length ||
    searchQuery.tags?.length ||
    searchQuery.difficulty?.length ||
    searchQuery.inputType ||
    searchQuery.outputFormat ||
    searchQuery.favoritesOnly
  );

  return (
    <div className="space-y-2">
      {/* Main search input */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={localQuery}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-16 py-2 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded-md focus:outline-none focus:ring-2 focus:ring-vscode-accent-blue focus:border-vscode-accent-blue"
          />

          {/* Search icon */}
          <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
            <span className="text-vscode-fg-muted text-sm">🔍</span>
          </div>

          {/* Clear button */}
          {localQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-vscode-fg-muted hover:text-vscode-fg-primary p-1"
              title="Clear search"
            >
              ✕
            </button>
          )}

          {/* Filter toggle */}
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded text-sm transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? 'text-vscode-accent-blue hover:text-blue-400'
                  : 'text-vscode-fg-muted hover:text-vscode-fg-primary'
              }`}
              title="Toggle filters"
            >
              🎛️
            </button>
          )}
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className="text-vscode-fg-muted">Filters:</span>
            {searchQuery.categories?.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return (
                <span
                  key={categoryId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-vscode-accent-blue bg-opacity-20 text-vscode-accent-blue rounded text-xxs"
                >
                  {category?.name || categoryId}
                  <button
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="hover:bg-vscode-accent-blue hover:bg-opacity-30 rounded"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
            {searchQuery.tags?.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-600 bg-opacity-20 text-green-400 rounded text-xxs"
              >
                #{tag}
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="hover:bg-green-600 hover:bg-opacity-30 rounded"
                >
                  ✕
                </button>
              </span>
            ))}
            {searchQuery.favoritesOnly && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-600 bg-opacity-20 text-yellow-400 rounded text-xxs">
                ⭐ Favorites
                <button
                  onClick={handleFavoritesToggle}
                  className="hover:bg-yellow-600 hover:bg-opacity-30 rounded"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="p-3 bg-vscode-bg-tertiary border border-vscode-border rounded-md space-y-3">
          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-vscode-fg-primary mb-1">
              Categories
            </label>
            <div className="flex flex-wrap gap-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    searchQuery.categories?.includes(category.id)
                      ? 'bg-vscode-accent-blue text-white'
                      : 'bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary'
                  }`}
                >
                  {category.name} ({category.promptCount})
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-vscode-fg-primary mb-1">
              Difficulty
            </label>
            <div className="flex gap-1">
              {(['beginner', 'intermediate', 'advanced'] as const).map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => handleDifficultyToggle(difficulty)}
                  className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                    searchQuery.difficulty?.includes(difficulty)
                      ? 'bg-vscode-accent-blue text-white'
                      : 'bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Sort options */}
          <div>
            <label className="block text-xs font-medium text-vscode-fg-primary mb-1">Sort by</label>
            <div className="flex gap-2">
              <select
                value={searchQuery.sortBy || 'name'}
                onChange={e => handleSortChange(e.target.value, searchQuery.sortDirection || 'asc')}
                className="flex-1 px-2 py-1 text-xs bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded"
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="created">Created</option>
                <option value="modified">Modified</option>
                <option value="usage">Usage</option>
                <option value="lastUsed">Last Used</option>
              </select>
              <select
                value={searchQuery.sortDirection || 'asc'}
                onChange={e =>
                  handleSortChange(searchQuery.sortBy || 'name', e.target.value as 'asc' | 'desc')
                }
                className="px-2 py-1 text-xs bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded"
              >
                <option value="asc">↑ Ascending</option>
                <option value="desc">↓ Descending</option>
              </select>
            </div>
          </div>

          {/* Special filters */}
          <div className="flex gap-2">
            <button
              onClick={handleFavoritesToggle}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                searchQuery.favoritesOnly
                  ? 'bg-yellow-600 bg-opacity-20 text-yellow-400'
                  : 'bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary'
              }`}
            >
              ⭐ Favorites only
            </button>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-vscode-border">
              <button
                onClick={handleClearAllFilters}
                className="px-3 py-1 text-xs bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary rounded"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
