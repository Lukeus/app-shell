import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileItem } from '../explorer/FileTreeItem';
import FileTreeItem from '../explorer/FileTreeItem';
import { FileContextMenu } from '../explorer/ContextMenu';
import { FileType } from '../../../types';
import { formatFileSize, formatDate } from '../../utils/file-icons';

interface FileOperationState {
  type: 'cut' | 'copy' | null;
  items: FileItem[];
}

export const ExplorerView: React.FC = () => {
  const [rootPath, setRootPath] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FileItem | null;
  } | null>(null);
  const [fileOperation, setFileOperation] = useState<FileOperationState>({ type: null, items: [] });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with home directory
  useEffect(() => {
    initializeExplorer();
  }, []);

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keys when explorer has focus or no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (event.key) {
        case 'F2':
          if (selectedItem) {
            event.preventDefault();
            setRenamingItem(selectedItem);
          }
          break;

        case 'Delete':
          if (selectedItem && confirm(`Are you sure you want to delete "${selectedItem.name}"?`)) {
            event.preventDefault();
            handleContextMenuAction('delete', selectedItem).catch(console.error);
          }
          break;

        case 'F5':
          event.preventDefault();
          loadFileTree(rootPath).catch(console.error);
          break;

        case 'Enter':
          if (selectedItem) {
            event.preventDefault();
            handleDoubleClick(selectedItem).catch(console.error);
          }
          break;

        case 'c':
          if (event.ctrlKey && selectedItem) {
            event.preventDefault();
            setFileOperation({ type: 'copy', items: [selectedItem] });
          }
          break;

        case 'x':
          if (event.ctrlKey && selectedItem) {
            event.preventDefault();
            setFileOperation({ type: 'cut', items: [selectedItem] });
          }
          break;

        case 'v':
          if (event.ctrlKey && fileOperation.type && fileOperation.items.length > 0) {
            event.preventDefault();
            const targetPath = selectedItem?.isDirectory ? selectedItem.path : rootPath;
            performPasteOperation(targetPath).catch(console.error);
          }
          break;

        case 'n':
          if (event.ctrlKey) {
            event.preventDefault();
            if (event.shiftKey) {
              // Ctrl+Shift+N - New Folder
              const targetPath = selectedItem?.isDirectory ? selectedItem.path : rootPath;
              createNewFolder(targetPath).catch(console.error);
            } else {
              // Ctrl+N - New File
              const targetPath = selectedItem?.isDirectory ? selectedItem.path : rootPath;
              createNewFile(targetPath).catch(console.error);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, fileOperation, rootPath]);

  const initializeExplorer = async () => {
    try {
      setLoading(true);
      const homeDir =
        (await window.electronAPI?.getHomeDirectory?.()) ||
        process.env.HOME ||
        process.env.USERPROFILE ||
        '/';
      setRootPath(homeDir);
      await loadFileTree(homeDir);
    } catch (err) {
      setError('Failed to initialize file explorer');
      console.error('Explorer initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFileTree = async (path: string, depth: number = 2) => {
    try {
      setError(null);
      const tree = await window.electronAPI?.getFileTree?.(path, depth);
      if (tree) {
        setFileTree(tree);
      }
    } catch (err) {
      setError('Failed to load directory contents');
      console.error('File tree loading error:', err);
    }
  };

  const handleSelectItem = useCallback((item: FileItem) => {
    setSelectedItem(item);
    setRenamingItem(null); // Cancel any ongoing rename
  }, []);

  const handleToggleExpand = useCallback(
    async (item: FileItem) => {
      if (!item.isDirectory) return;

      try {
        // If not expanded, load children
        if (!item.isExpanded) {
          const children = await window.electronAPI?.readDirectory?.(item.path);
          if (children) {
            const childItems: FileItem[] = [];

            for (const [name, type] of children) {
              const childPath = await window.electronAPI?.joinPath?.(item.path, name);
              if (childPath) {
                const stat = await window.electronAPI?.stat?.(childPath);
                if (stat) {
                  childItems.push({
                    name,
                    path: childPath,
                    type,
                    size: stat.size,
                    modified: stat.mtime,
                    isDirectory: type === FileType.Directory,
                    isHidden: name.startsWith('.'),
                    isExpanded: false,
                  });
                }
              }
            }

            item.children = childItems;
          }
        }

        // Toggle expansion
        item.isExpanded = !item.isExpanded;
        setFileTree({ ...fileTree } as FileItem); // Force re-render
      } catch (err) {
        console.error('Error expanding directory:', err);
      }
    },
    [fileTree]
  );

  const handleContextMenu = useCallback((event: React.MouseEvent, item: FileItem | null) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item,
    });
    if (item) {
      setSelectedItem(item);
    }
  }, []);

  const handleDoubleClick = useCallback(
    async (item: FileItem) => {
      if (item.isDirectory) {
        await handleToggleExpand(item);
      } else {
        // Open file - for now just log, but could integrate with editor
        console.log('Opening file:', item.path);
        // TODO: Integrate with file opening system
      }
    },
    [handleToggleExpand]
  );

  const handleRename = useCallback(
    async (item: FileItem, newName: string) => {
      try {
        const parentPath = item.path.split('/').slice(0, -1).join('/');
        const newPath = await window.electronAPI?.joinPath?.(parentPath, newName);

        if (newPath && newPath !== item.path) {
          await window.electronAPI?.rename?.(item.path, newPath);

          // Update the item in the tree
          item.name = newName;
          item.path = newPath;
          setFileTree({ ...fileTree } as FileItem);
        }
      } catch (err) {
        console.error('Rename error:', err);
        // TODO: Show error message to user
      } finally {
        setRenamingItem(null);
      }
    },
    [fileTree]
  );

  const handleContextMenuAction = useCallback(
    async (action: string, item: FileItem | null) => {
      setContextMenu(null);

      try {
        switch (action) {
          case 'new-file':
            await createNewFile(
              item?.isDirectory
                ? item.path
                : item
                  ? item.path.split('/').slice(0, -1).join('/')
                  : rootPath
            );
            break;

          case 'new-folder':
            await createNewFolder(
              item?.isDirectory
                ? item.path
                : item
                  ? item.path.split('/').slice(0, -1).join('/')
                  : rootPath
            );
            break;

          case 'open':
            if (item) {
              await handleDoubleClick(item);
            }
            break;

          case 'cut':
            if (item) {
              setFileOperation({ type: 'cut', items: [item] });
            }
            break;

          case 'copy':
            if (item) {
              setFileOperation({ type: 'copy', items: [item] });
            }
            break;

          case 'paste':
            if (fileOperation.type && fileOperation.items.length > 0) {
              const targetPath = item?.isDirectory
                ? item.path
                : item
                  ? item.path.split('/').slice(0, -1).join('/')
                  : rootPath;
              await performPasteOperation(targetPath);
            }
            break;

          case 'rename':
            if (item) {
              setRenamingItem(item);
            }
            break;

          case 'delete':
            if (item && confirm(`Are you sure you want to delete "${item.name}"?`)) {
              if (item.isDirectory) {
                await window.electronAPI?.deleteDirectory?.(item.path);
              } else {
                await window.electronAPI?.deleteFile?.(item.path);
              }
              // Refresh the parent directory
              await loadFileTree(rootPath);
            }
            break;

          case 'refresh':
            await loadFileTree(rootPath);
            break;

          case 'copy-path':
            if (item) {
              navigator.clipboard.writeText(item.path);
            }
            break;

          case 'reveal-in-explorer':
            if (item) {
              await revealInSystemExplorer(item.path);
            }
            break;

          case 'open-in-terminal':
            const terminalPath = item?.isDirectory
              ? item.path
              : item
                ? item.path.split('/').slice(0, -1).join('/')
                : rootPath;
            await openInTerminal(terminalPath);
            break;

          case 'properties':
            if (item) {
              await showFileProperties(item);
            }
            break;
        }
      } catch (err) {
        console.error('Context menu action error:', err);
      }
    },
    [rootPath, handleDoubleClick, loadFileTree]
  );

  const handleDragStart = useCallback((event: React.DragEvent, item: FileItem) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent, item: FileItem) => {
    if (item.isDirectory) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent, targetItem: FileItem) => {
      event.preventDefault();

      if (!targetItem.isDirectory) return;

      try {
        const draggedData = event.dataTransfer.getData('application/json');
        const draggedItem: FileItem = JSON.parse(draggedData);

        const newPath = await window.electronAPI?.joinPath?.(targetItem.path, draggedItem.name);
        if (newPath && newPath !== draggedItem.path) {
          await window.electronAPI?.rename?.(draggedItem.path, newPath);
          await loadFileTree(rootPath);
        }
      } catch (err) {
        console.error('Drop error:', err);
      }
    },
    [rootPath, loadFileTree]
  );

  const handleChangeDirectory = useCallback(async () => {
    try {
      const result = await window.electronAPI?.showOpenDialog?.({
        properties: ['openDirectory'],
        title: 'Select Directory',
      });

      if (result && !result.canceled && result.filePaths[0]) {
        const newPath = result.filePaths[0];
        setRootPath(newPath);
        await loadFileTree(newPath);
      }
    } catch (err) {
      console.error('Directory change error:', err);
    }
  }, [loadFileTree]);

  // Helper function to create a new file
  const createNewFile = async (parentPath: string) => {
    try {
      const fileName = prompt('Enter file name:');
      if (fileName && fileName.trim()) {
        const filePath = await window.electronAPI?.joinPath?.(parentPath, fileName.trim());
        if (filePath) {
          // Create empty file
          await window.electronAPI?.writeFileText?.(filePath, '');
          await loadFileTree(rootPath);
        }
      }
    } catch (err) {
      console.error('Error creating file:', err);
      alert('Failed to create file');
    }
  };

  // Helper function to create a new folder
  const createNewFolder = async (parentPath: string) => {
    try {
      const folderName = prompt('Enter folder name:');
      if (folderName && folderName.trim()) {
        const folderPath = await window.electronAPI?.joinPath?.(parentPath, folderName.trim());
        if (folderPath) {
          await window.electronAPI?.createDirectory?.(folderPath);
          await loadFileTree(rootPath);
        }
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('Failed to create folder');
    }
  };

  // Helper function to perform paste operations
  const performPasteOperation = async (targetPath: string) => {
    try {
      for (const sourceItem of fileOperation.items) {
        const targetItemPath = await window.electronAPI?.joinPath?.(targetPath, sourceItem.name);

        if (targetItemPath && targetItemPath !== sourceItem.path) {
          if (fileOperation.type === 'copy') {
            if (sourceItem.isDirectory) {
              // For directories, we'd need to implement recursive copy
              console.warn('Directory copying not yet implemented');
              alert('Directory copying is not yet supported');
            } else {
              await window.electronAPI?.copyFile?.(sourceItem.path, targetItemPath);
            }
          } else if (fileOperation.type === 'cut') {
            await window.electronAPI?.rename?.(sourceItem.path, targetItemPath);
          }
        }
      }

      // Clear operation after successful paste
      setFileOperation({ type: null, items: [] });
      await loadFileTree(rootPath);
    } catch (err) {
      console.error('Error performing paste operation:', err);
      alert('Failed to paste files');
    }
  };

  // Helper function to reveal file in system explorer
  const revealInSystemExplorer = async (filePath: string) => {
    try {
      // This would need to be implemented in the main process
      // For now, just log the request
      console.log('Revealing in system explorer:', filePath);

      // In a real implementation, you would call something like:
      // await window.electronAPI?.revealInFileManager?.(filePath);

      alert('Reveal in file manager functionality not yet implemented');
    } catch (err) {
      console.error('Error revealing in explorer:', err);
    }
  };

  // Helper function to open directory in terminal
  const openInTerminal = async (dirPath: string) => {
    try {
      // This would integrate with the existing terminal system
      console.log('Opening terminal in:', dirPath);

      // Create a new terminal with the specified working directory
      const terminalOptions = {
        cwd: dirPath,
      };

      const terminal = await window.electronAPI?.createTerminal?.(terminalOptions);
      if (terminal) {
        console.log('Terminal created:', terminal.id);
      }
    } catch (err) {
      console.error('Error opening terminal:', err);
      alert('Failed to open terminal');
    }
  };

  // Helper function to show file properties
  const showFileProperties = async (item: FileItem) => {
    try {
      const stat = await window.electronAPI?.stat?.(item.path);
      if (stat) {
        const sizeStr = formatFileSize(stat.size);
        const modifiedStr = formatDate(stat.mtime);
        const createdStr = formatDate(stat.ctime);

        const properties = [
          `Name: ${item.name}`,
          `Path: ${item.path}`,
          `Type: ${item.isDirectory ? 'Directory' : 'File'}`,
          `Size: ${sizeStr}`,
          `Modified: ${modifiedStr}`,
          `Created: ${createdStr}`,
        ].join('\n');

        alert(properties);
      }
    } catch (err) {
      console.error('Error getting file properties:', err);
      alert('Failed to get file properties');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-vscode-fg-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <button onClick={initializeExplorer} className="text-vscode-accent text-sm underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-vscode-border">
        <button
          onClick={handleChangeDirectory}
          className="text-xs text-vscode-fg-secondary hover:text-vscode-fg-primary flex items-center"
          title="Change Directory"
        >
          📁 <span className="ml-1 truncate max-w-32">{rootPath.split('/').pop() || rootPath}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHiddenFiles(!showHiddenFiles)}
            className={`text-xs px-1 py-0.5 rounded ${
              showHiddenFiles
                ? 'bg-vscode-accent text-white'
                : 'text-vscode-fg-secondary hover:bg-vscode-hover'
            }`}
            title="Toggle Hidden Files"
          >
            👁
          </button>

          <button
            onClick={() => loadFileTree(rootPath)}
            className="text-xs text-vscode-fg-secondary hover:text-vscode-fg-primary p-0.5"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        onContextMenu={e => handleContextMenu(e, null)}
      >
        {fileTree ? (
          <FileTreeItem
            item={fileTree}
            depth={0}
            isSelected={selectedItem?.path === fileTree.path}
            isRenaming={renamingItem?.path === fileTree.path}
            showHiddenFiles={showHiddenFiles}
            onSelect={handleSelectItem}
            onToggleExpand={handleToggleExpand}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onRename={handleRename}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ) : (
          <div className="p-4 text-center text-vscode-fg-muted text-sm">No directory loaded</div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedItem={contextMenu.item}
          onItemClick={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
