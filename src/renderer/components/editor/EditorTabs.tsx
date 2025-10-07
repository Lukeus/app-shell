import React, { useCallback, useState } from 'react';
import { EditorFile } from './MonacoEditor';

export interface EditorTabsProps {
  tabs: EditorFile[];
  activeTabPath: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
  onTabMove: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabPath,
  onTabSelect,
  onTabClose,
  onTabMove,
  className,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleTabClick = useCallback(
    (path: string) => {
      onTabSelect(path);
    },
    [onTabSelect]
  );

  const handleTabClose = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      onTabClose(path);
    },
    [onTabClose]
  );

  const handleTabMiddleClick = useCallback(
    (e: React.MouseEvent, path: string) => {
      if (e.button === 1) {
        // Middle mouse button
        e.preventDefault();
        onTabClose(path);
      }
    },
    [onTabClose]
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        onTabMove(draggedIndex, targetIndex);
      }
      setDraggedIndex(null);
    },
    [draggedIndex, onTabMove]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Get file icon based on extension
  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    const iconMap: Record<string, string> = {
      // JavaScript/TypeScript
      js: '🟨',
      jsx: '⚛️',
      ts: '🔷',
      tsx: '⚛️',

      // Web
      html: '🌐',
      css: '🎨',
      scss: '🎨',
      sass: '🎨',

      // Data
      json: '📄',
      xml: '📄',
      yaml: '⚙️',
      yml: '⚙️',

      // Documentation
      md: '📝',
      txt: '📄',

      // Programming languages
      py: '🐍',
      java: '☕',
      cpp: '⚡',
      c: '⚡',
      go: '🐹',
      rs: '🦀',
      php: '🐘',

      // Shell
      sh: '💻',
      bash: '💻',

      // Default
      default: '📄',
    };

    return iconMap[extension] || iconMap.default;
  };

  // Get shortened file name for display
  const getDisplayName = (filePath: string, maxLength: number = 20): string => {
    const fileName = filePath.split('/').pop() || filePath;
    if (fileName.length <= maxLength) {
      return fileName;
    }
    return fileName.substring(0, maxLength - 3) + '...';
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex border-b border-vscode-border bg-vscode-bg-tertiary overflow-x-auto scrollbar-thin ${className || ''}`}
      style={{
        minHeight: 'var(--height-editor-tabs, 36px)',
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.path === activeTabPath;
        const isDragging = index === draggedIndex;

        return (
          <div
            key={tab.path}
            draggable
            onClick={() => handleTabClick(tab.path)}
            onMouseDown={e => handleTabMiddleClick(e, tab.path)}
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              group relative flex items-center px-3 py-2 border-r border-vscode-border cursor-pointer select-none
              min-w-0 max-w-48 transition-colors duration-150
              ${
                isActive
                  ? 'bg-vscode-bg-primary text-vscode-fg-primary'
                  : 'bg-vscode-bg-secondary text-vscode-fg-secondary hover:bg-vscode-hover'
              }
              ${isDragging ? 'opacity-50' : ''}
            `}
            title={tab.path}
          >
            {/* File Icon */}
            <span className="mr-2 flex-shrink-0 text-sm" aria-hidden="true">
              {getFileIcon(tab.name)}
            </span>

            {/* File Name */}
            <span className="flex-1 truncate text-sm">{getDisplayName(tab.name)}</span>

            {/* Dirty Indicator */}
            {tab.isDirty && (
              <span
                className="ml-1 flex-shrink-0 w-2 h-2 rounded-full bg-vscode-accent"
                title="Unsaved changes"
                aria-label="File has unsaved changes"
              />
            )}

            {/* Close Button */}
            <button
              onClick={e => handleTabClose(e, tab.path)}
              className={`
                ml-2 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center
                text-vscode-fg-muted hover:text-vscode-fg-primary
                hover:bg-vscode-button-hover opacity-0 group-hover:opacity-100
                transition-opacity duration-150
                ${isActive ? 'opacity-100' : ''}
              `}
              title="Close tab"
              aria-label={`Close ${tab.name}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                className="pointer-events-none"
              >
                <path d="M6.707 6l3.147-3.146a.5.5 0 00-.708-.708L6 5.293 2.854 2.146a.5.5 0 00-.708.708L5.293 6 2.146 9.146a.5.5 0 00.708.708L6 6.707l3.146 3.147a.5.5 0 00.708-.708L6.707 6z" />
              </svg>
            </button>

            {/* Active Tab Indicator */}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-vscode-accent"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}

      {/* Tab overflow gradient */}
      <div
        className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-vscode-bg-tertiary pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};

export default EditorTabs;
