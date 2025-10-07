import React from 'react';
import { Prompt } from '../../../schemas';

interface PromptCardProps {
  prompt: Prompt;
  isSelected?: boolean;
  onSelect?: (prompt: Prompt) => void;
  onExecute?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onToggleFavorite?: (prompt: Prompt) => void;
  showActions?: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  isSelected = false,
  onSelect,
  onExecute,
  onEdit,
  onDelete,
  onToggleFavorite,
  showActions = true,
}) => {
  const handleClick = () => {
    onSelect?.(prompt);
  };

  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExecute?.(prompt);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(prompt);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      onDelete?.(prompt);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(prompt);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-red-400';
      default:
        return 'text-vscode-fg-muted';
    }
  };

  const getInputTypeIcon = (inputType: string) => {
    switch (inputType) {
      case 'text':
        return '📝';
      case 'markdown':
        return '📄';
      case 'code':
        return '💻';
      case 'file':
        return '📁';
      case 'url':
        return '🔗';
      case 'clipboard':
        return '📋';
      case 'selection':
        return '✂️';
      case 'none':
        return '🚀';
      default:
        return '📝';
    }
  };

  const getOutputFormatIcon = (outputFormat: string) => {
    switch (outputFormat) {
      case 'markdown':
        return '📋';
      case 'json':
        return '🔧';
      case 'html':
        return '🌐';
      case 'code':
        return '⌨️';
      case 'csv':
        return '📊';
      case 'mixed':
        return '🎨';
      default:
        return '📄';
    }
  };

  return (
    <div
      className={`
        group relative p-3 rounded-md border transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? 'bg-vscode-accent-blue bg-opacity-20 border-vscode-accent-blue'
            : 'bg-vscode-bg-tertiary border-vscode-border hover:bg-vscode-bg-quaternary hover:border-vscode-fg-muted'
        }
      `}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-vscode-fg-primary truncate">{prompt.name}</h3>
            {prompt.isFavorite && <span className="text-yellow-400 text-xs">⭐</span>}
            {prompt.isBuiltIn && (
              <span className="px-1.5 py-0.5 text-xxs rounded bg-vscode-accent-blue text-white">
                Built-in
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="text-xxs text-vscode-fg-muted capitalize">{prompt.category}</span>
            {prompt.difficulty && (
              <span className={`text-xxs ${getDifficultyColor(prompt.difficulty)} capitalize`}>
                {prompt.difficulty}
              </span>
            )}
            {prompt.estimatedTime && (
              <span className="text-xxs text-vscode-fg-muted">⏱️ {prompt.estimatedTime}</span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 rounded text-vscode-fg-muted hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary"
              onClick={handleToggleFavorite}
              title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {prompt.isFavorite ? '⭐' : '☆'}
            </button>

            <button
              className="p-1 rounded text-vscode-fg-muted hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary"
              onClick={handleExecute}
              title="Execute prompt"
            >
              ▶️
            </button>

            <button
              className="p-1 rounded text-vscode-fg-muted hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary"
              onClick={handleEdit}
              title="Edit prompt"
            >
              ✏️
            </button>

            {!prompt.isBuiltIn && (
              <button
                className="p-1 rounded text-vscode-fg-muted hover:text-red-400 hover:bg-vscode-bg-quaternary"
                onClick={handleDelete}
                title="Delete prompt"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-vscode-fg-secondary mb-2 line-clamp-2">{prompt.description}</p>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prompt.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 text-xxs rounded bg-vscode-bg-quaternary text-vscode-fg-muted border border-vscode-border"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-xxs text-vscode-fg-muted">+{prompt.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer - Input/Output info */}
      <div className="flex items-center justify-between text-xxs text-vscode-fg-muted">
        <div className="flex items-center gap-3">
          <span title={`Input: ${prompt.inputType}`}>
            {getInputTypeIcon(prompt.inputType)} {prompt.inputType}
          </span>
          <span title={`Output: ${prompt.outputFormat}`}>
            {getOutputFormatIcon(prompt.outputFormat)} {prompt.outputFormat}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {prompt.usageCount > 0 && <span title="Usage count">📊 {prompt.usageCount}</span>}
          {prompt.content.variables.length > 0 && (
            <span title={`${prompt.content.variables.length} variables`}>
              🔧 {prompt.content.variables.length}
            </span>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-vscode-accent-blue rounded-l-md" />
      )}
    </div>
  );
};
