import React, { useEffect, useRef, useCallback } from 'react';
import { FileItem } from './FileTreeItem';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onItemClick: (itemId: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onItemClick, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  const handleItemClick = useCallback(
    (itemId: string, disabled?: boolean) => {
      if (disabled) return;

      onItemClick(itemId);
      onClose();
    },
    [onItemClick, onClose]
  );

  const adjustPosition = (x: number, y: number) => {
    if (!menuRef.current) return { x, y };

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu goes off-screen
    if (x + rect.width > viewportWidth) {
      adjustedX = Math.max(0, x - rect.width);
    }

    // Adjust vertical position if menu goes off-screen
    if (y + rect.height > viewportHeight) {
      adjustedY = Math.max(0, y - rect.height);
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = adjustPosition(x, y);

  return (
    <div
      ref={menuRef}
      className={`
        fixed z-50 min-w-48 py-1 rounded-md shadow-lg border
        bg-vscode-bg-secondary border-vscode-border
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`separator-${index}`} className="h-px mx-1 my-1 bg-vscode-border" />;
        }

        return (
          <div
            key={item.id}
            className={`
              flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer
              ${
                item.disabled
                  ? 'text-vscode-fg-muted cursor-not-allowed'
                  : 'text-vscode-fg-primary hover:bg-vscode-hover'
              }
            `}
            onClick={() => handleItemClick(item.id, item.disabled)}
          >
            <div className="flex items-center">
              {item.icon && <span className="mr-2 text-base">{item.icon}</span>}
              <span>{item.label}</span>
            </div>

            {item.shortcut && (
              <span className="text-xs text-vscode-fg-muted ml-4">{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface FileContextMenuProps {
  x: number;
  y: number;
  selectedItem: FileItem | null;
  gitRepoDetected?: boolean;
  gitDecorations?: Record<string, { badge?: string; color?: string; tooltip?: string }>;
  onItemClick: (action: string, item: FileItem | null) => void;
  onClose: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  selectedItem,
  gitRepoDetected = false,
  gitDecorations = {},
  onItemClick,
  onClose,
}) => {
  const getContextMenuItems = useCallback(
    (item: FileItem | null): MenuItem[] => {
      const baseItems: MenuItem[] = [
        {
          id: 'new-file',
          label: 'New File',
          icon: '📄',
          shortcut: 'Ctrl+N',
        },
        {
          id: 'new-folder',
          label: 'New Folder',
          icon: '📁',
          shortcut: 'Ctrl+Shift+N',
        },
        { id: 'sep1', label: '', separator: true },
      ];

      if (item) {
        const itemSpecificItems: MenuItem[] = [
          {
            id: 'open',
            label: item.isDirectory ? 'Open Folder' : 'Open File',
            icon: item.isDirectory ? '📁' : '📄',
            shortcut: 'Enter',
          },
          ...(item.isDirectory
            ? []
            : [
                {
                  id: 'open-with',
                  label: 'Open With...',
                  icon: '🔧',
                },
              ]),
          { id: 'sep2', label: '', separator: true },
          {
            id: 'cut',
            label: 'Cut',
            icon: '✂️',
            shortcut: 'Ctrl+X',
          },
          {
            id: 'copy',
            label: 'Copy',
            icon: '📋',
            shortcut: 'Ctrl+C',
          },
          {
            id: 'paste',
            label: 'Paste',
            icon: '📋',
            shortcut: 'Ctrl+V',
          },
          { id: 'sep3', label: '', separator: true },
          {
            id: 'rename',
            label: 'Rename',
            icon: '✏️',
            shortcut: 'F2',
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: '🗑️',
            shortcut: 'Delete',
          },
        ];

        // Add Git-specific menu items if Git repo detected and file has Git status
        if (gitRepoDetected && item.path && gitDecorations[item.path] && !item.isDirectory) {
          const gitStatus = gitDecorations[item.path];
          const gitItems: MenuItem[] = [];

          // Add separator before Git actions
          gitItems.push({ id: 'sep-git', label: '', separator: true });

          // Stage/unstage based on current status
          if (gitStatus?.badge === 'M' || gitStatus?.badge === 'U' || gitStatus?.badge === '?') {
            gitItems.push({
              id: 'git-stage',
              label: 'Stage Changes',
              icon: '➕',
              shortcut: 'Alt+S',
            });
          }

          if (gitStatus?.badge === 'M' || gitStatus?.badge === 'A') {
            gitItems.push({
              id: 'git-unstage',
              label: 'Unstage Changes',
              icon: '➖',
              shortcut: 'Alt+U',
            });
          }

          // Show diff for modified files
          if (gitStatus?.badge === 'M' || gitStatus?.badge === 'A') {
            gitItems.push({
              id: 'git-open-diff',
              label: 'View Diff',
              icon: '🔍',
              shortcut: 'Alt+D',
            });
          }

          // Discard changes for modified or untracked files
          if (gitStatus?.badge === 'M' || gitStatus?.badge === '?') {
            gitItems.push({
              id: 'git-discard',
              label: 'Discard Changes',
              icon: '↩️',
              shortcut: 'Alt+R',
            });
          }

          itemSpecificItems.push(...gitItems);
        }

        const finalItems: MenuItem[] = [
          ...itemSpecificItems,
          { id: 'sep4', label: '', separator: true },
          {
            id: 'copy-path',
            label: 'Copy Path',
            icon: '📋',
          },
          {
            id: 'copy-relative-path',
            label: 'Copy Relative Path',
            icon: '📋',
          },
          { id: 'sep5', label: '', separator: true },
          {
            id: 'reveal-in-explorer',
            label: 'Reveal in File Explorer',
            icon: '📂',
          },
          { id: 'sep6', label: '', separator: true },
          {
            id: 'properties',
            label: 'Properties',
            icon: '⚙️',
          },
        ];

        return [...baseItems, ...finalItems];
      } else {
        // Context menu for empty space
        const emptySpaceItems = [
          ...baseItems,
          {
            id: 'paste',
            label: 'Paste',
            icon: '📋',
            shortcut: 'Ctrl+V',
          },
          { id: 'sep7', label: '', separator: true },
          {
            id: 'refresh',
            label: 'Refresh',
            icon: '🔄',
            shortcut: 'F5',
          },
        ];

        // Add Git workspace actions if in a Git repo
        if (gitRepoDetected) {
          emptySpaceItems.push(
            { id: 'sep-git-workspace', label: '', separator: true },
            {
              id: 'git-stage-all',
              label: 'Stage All Changes',
              icon: '➕',
              shortcut: 'Ctrl+Alt+S',
            },
            {
              id: 'git-commit',
              label: 'Commit...',
              icon: '✓',
              shortcut: 'Ctrl+Enter',
            },
            {
              id: 'git-push',
              label: 'Push',
              icon: '⬆️',
              shortcut: 'Ctrl+Alt+P',
            },
            {
              id: 'git-pull',
              label: 'Pull',
              icon: '⬇️',
              shortcut: 'Ctrl+Alt+L',
            }
          );
        }

        emptySpaceItems.push(
          { id: 'sep8', label: '', separator: true },
          {
            id: 'open-in-terminal',
            label: 'Open in Terminal',
            icon: '💻',
          }
        );

        return emptySpaceItems;
      }
    },
    [gitRepoDetected, gitDecorations]
  );

  const handleItemClick = useCallback(
    (itemId: string) => {
      onItemClick(itemId, selectedItem);
    },
    [selectedItem, onItemClick]
  );

  const items = getContextMenuItems(selectedItem);

  return <ContextMenu x={x} y={y} items={items} onItemClick={handleItemClick} onClose={onClose} />;
};

export default FileContextMenu;
