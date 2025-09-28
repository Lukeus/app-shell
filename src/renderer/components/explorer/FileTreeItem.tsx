import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileType } from '../../../types';
import { getFileIcon, formatFileSize, formatDate, isHiddenFile } from '../../utils/file-icons';

export interface FileItem {
  name: string;
  path: string;
  type: FileType;
  size: number;
  modified: number;
  isDirectory: boolean;
  isHidden: boolean;
  children?: FileItem[];
  isExpanded?: boolean;
}

interface FileTreeItemProps {
  item: FileItem;
  depth: number;
  isSelected: boolean;
  isRenaming: boolean;
  showHiddenFiles: boolean;
  onSelect: (item: FileItem) => void;
  onToggleExpand: (item: FileItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FileItem) => void;
  onDoubleClick: (item: FileItem) => void;
  onRename: (item: FileItem, newName: string) => void;
  onDragStart: (event: React.DragEvent, item: FileItem) => void;
  onDragOver: (event: React.DragEvent, item: FileItem) => void;
  onDrop: (event: React.DragEvent, item: FileItem) => void;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  depth,
  isSelected,
  isRenaming,
  showHiddenFiles,
  onSelect,
  onToggleExpand,
  onContextMenu,
  onDoubleClick,
  onRename,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isEditing, setIsEditing] = useState(isRenaming);
  const [editValue, setEditValue] = useState(item.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const iconInfo = getFileIcon(item.name, item.type);
  const isHidden = isHiddenFile(item.name);
  const shouldShow = showHiddenFiles || !isHidden;

  useEffect(() => {
    if (isRenaming) {
      setIsEditing(true);
      setEditValue(item.name);
    }
  }, [isRenaming, item.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isEditing) return;

      onSelect(item);
    },
    [item, isEditing, onSelect]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isEditing) return;

      if (item.isDirectory) {
        onToggleExpand(item);
      } else {
        onDoubleClick(item);
      }
    },
    [item, isEditing, onToggleExpand, onDoubleClick]
  );

  const handleExpandClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (item.isDirectory) {
        onToggleExpand(item);
      }
    },
    [item, onToggleExpand]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isEditing) return;

      onContextMenu(event, item);
    },
    [item, isEditing, onContextMenu]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isEditing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleRenameConfirm();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          handleRenameCancel();
        }
      }
    },
    [isEditing, editValue]
  );

  const handleRenameConfirm = useCallback(() => {
    if (editValue.trim() && editValue !== item.name) {
      onRename(item, editValue.trim());
    }
    setIsEditing(false);
  }, [item, editValue, onRename]);

  const handleRenameCancel = useCallback(() => {
    setEditValue(item.name);
    setIsEditing(false);
  }, [item.name]);

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (isEditing) {
        event.preventDefault();
        return;
      }

      onDragStart(event, item);
    },
    [item, isEditing, onDragStart]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!item.isDirectory) return;

      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(true);

      onDragOver(event, item);
    },
    [item, onDragOver]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragOver(false);
      onDrop(event, item);
    },
    [item, onDrop]
  );

  if (!shouldShow) {
    return null;
  }

  const paddingLeft = `${depth * 16 + 8}px`;
  const hasChildren = item.children && item.children.length > 0;
  const canExpand = item.isDirectory;

  return (
    <>
      <div
        className={`
          flex items-center text-sm cursor-pointer select-none relative
          ${isSelected ? 'bg-vscode-selection' : 'hover:bg-vscode-hover'}
          ${isDragOver ? 'bg-vscode-drag-over border-vscode-accent' : ''}
          ${isHidden ? 'opacity-60' : ''}
        `}
        style={{
          paddingLeft,
          minHeight: '22px',
          borderLeft: isDragOver ? '2px solid' : '2px solid transparent',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        title={`${item.name}\n${item.path}\nSize: ${formatFileSize(item.size)}\nModified: ${formatDate(item.modified)}`}
      >
        {/* Expand/Collapse Button */}
        {canExpand && (
          <div
            className={`
              flex items-center justify-center w-4 h-4 mr-1 cursor-pointer
              hover:bg-vscode-hover rounded-sm
            `}
            onClick={handleExpandClick}
          >
            {hasChildren ? (
              <span
                className={`text-xs transition-transform duration-150 ${
                  item.isExpanded ? 'rotate-90' : 'rotate-0'
                }`}
              >
                ▶
              </span>
            ) : (
              <span className="text-xs text-transparent">▶</span>
            )}
          </div>
        )}

        {/* File Icon */}
        <span
          className="mr-2 text-base leading-none flex-shrink-0"
          style={{ color: iconInfo.color }}
        >
          {iconInfo.icon}
        </span>

        {/* File Name */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={handleKeyDown}
            className={`
              bg-vscode-input border border-vscode-input-border rounded px-1
              text-vscode-fg-primary text-sm flex-1 min-w-0
              focus:outline-none focus:border-vscode-accent
            `}
            style={{ marginLeft: '-4px', marginRight: '-4px' }}
          />
        ) : (
          <span
            className={`
              flex-1 truncate text-vscode-fg-primary
              ${iconInfo.className || ''}
            `}
          >
            {item.name}
          </span>
        )}

        {/* File Size (for files only) */}
        {!item.isDirectory && !isEditing && (
          <span className="text-xs text-vscode-fg-muted ml-2 flex-shrink-0">
            {formatFileSize(item.size)}
          </span>
        )}
      </div>

      {/* Children */}
      {item.isDirectory && item.isExpanded && item.children && (
        <>
          {item.children.map(child => (
            <FileTreeItem
              key={child.path}
              item={child}
              depth={depth + 1}
              isSelected={false} // Child selection would be managed by parent
              isRenaming={false}
              showHiddenFiles={showHiddenFiles}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
              onDoubleClick={onDoubleClick}
              onRename={onRename}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </>
      )}
    </>
  );
};

export default FileTreeItem;
