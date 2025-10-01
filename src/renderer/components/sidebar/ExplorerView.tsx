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
  // Git integration state
  const [gitBranch, setGitBranch] = useState<string | null>(null);
  const [gitAheadBehind, setGitAheadBehind] = useState<{ ahead: number; behind: number } | null>(
    null
  );
  const [gitDecorations, setGitDecorations] = useState<
    Record<
      string,
      {
        badge?: string;
        color?: string;
        tooltip?: string;
      }
    >
  >({});
  const [gitRepoDetected, setGitRepoDetected] = useState<boolean>(false);
  const [gitBranches, setGitBranches] = useState<string[]>([]);
  const [isBranchSwitching, setIsBranchSwitching] = useState<boolean>(false);
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

  const extractBranchNames = (branches: unknown): string[] => {
    if (!Array.isArray(branches)) {
      return [];
    }

    const locals: string[] = [];
    const localSet = new Set<string>();
    const remotes: string[] = [];
    const remoteSet = new Set<string>();

    for (const entry of branches as Array<{ name?: string; remote?: string }>) {
      if (!entry || typeof entry.name !== 'string' || entry.name.length === 0) {
        continue;
      }

      if (!entry.remote) {
        if (!localSet.has(entry.name)) {
          localSet.add(entry.name);
          locals.push(entry.name);
        }
      } else {
        const remoteName = `${entry.remote}/${entry.name}`;
        if (!remoteSet.has(remoteName)) {
          remoteSet.add(remoteName);
          remotes.push(remoteName);
        }
      }
    }

    return locals.length > 0 ? locals : remotes;
  };

  const refreshGitStatus = useCallback(async () => {
    try {
      if (!rootPath) return;
      // Heuristic: check for .git directory
      const gitDirPath = await window.electronAPI?.joinPath?.(rootPath, '.git');
      const exists = gitDirPath ? await window.electronAPI?.exists?.(gitDirPath) : false;
      setGitRepoDetected(!!exists);
      if (!exists) {
        setGitBranch(null);
        setGitAheadBehind(null);
        setGitDecorations({});
        setGitBranches([]);
        return;
      }

      // Attempt to query git-extension API if present on window (injected by extension runtime)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyWindow: any = window as any;
      const gitApi = anyWindow?.gitExtensionAPI || anyWindow?.appShell?.git;
      // Fallback: we can try calling a command if registered
      if (gitApi?.getGitService) {
        const service = gitApi.getGitService();
        if (service) {
          const repo = await service.getRepository?.();
          if (repo) {
            setGitBranch(repo.branch);
            setGitAheadBehind({ ahead: repo.status?.ahead || 0, behind: repo.status?.behind || 0 });
          }

          const branches = await service.getBranches?.();
          if (branches) {
            const normalized = extractBranchNames(branches);
            const finalBranches =
              repo?.branch && !normalized.includes(repo.branch)
                ? [repo.branch, ...normalized]
                : normalized;
            setGitBranches(finalBranches);
          } else {
            setGitBranches([]);
          }

          // Build decorations map if status available
          const status = await service.getStatus?.();
          if (status) {
            const map: Record<string, { badge?: string; color?: string; tooltip?: string }> = {};
            const collect = (files: unknown[], staged: boolean) => {
              for (const f of files as any[]) {
                if (!f || !f.path) continue;
                let color = staged ? '#00c853' : '#ffab00';
                switch (f.status) {
                  case 'A':
                    color = '#00c853';
                    break;
                  case 'D':
                    color = '#e53935';
                    break;
                  case 'R':
                    color = '#1e88e5';
                    break;
                  case 'U':
                    color = '#d50000';
                    break;
                  case '??':
                    color = '#9e9e9e';
                    break;
                }
                map[f.path] = {
                  badge: f.status === '??' ? '?' : f.status,
                  color,
                  tooltip: `${staged ? 'Staged' : 'Unstaged'} ${statusLabel(f.status)}`,
                };
              }
            };
            collect(status.staged || [], true);
            collect(status.unstaged || [], false);
            collect(status.untracked || [], false);
            collect(status.conflicted || [], false);
            setGitDecorations(map);
          }
        } else {
          setGitBranches([]);
        }
      }
    } catch (error) {
      // Non-fatal
    }
  }, [rootPath]);

  // Event-driven Git status refresh - listen for extension events
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupGitEventListeners = () => {
      // Listen for Git extension events through the electronAPI
      const handleExtensionEvent = (eventData: { event: string; args: unknown[] }) => {
        const { event, args } = eventData;

        switch (event) {
          case 'git.decorationsChanged': {
            const data = args[0] as {
              changedFiles: string[];
              decorations: Record<string, { badge?: string; color?: string; tooltip?: string }>;
            };
            if (data && data.decorations) {
              setGitDecorations(data.decorations);
            }
            break;
          }

          case 'git.statusChanged': {
            const data = args[0] as {
              repository?: { branch: string };
              status?: {
                ahead: number;
                behind: number;
                staged: unknown[];
                unstaged: unknown[];
                untracked: unknown[];
                conflicted: unknown[];
              };
            };
            if (data.repository) {
              setGitBranch(data.repository.branch);
            }
            if (data.status) {
              setGitAheadBehind({
                ahead: data.status.ahead || 0,
                behind: data.status.behind || 0,
              });

              // Build decorations map from status
              const map: Record<string, { badge?: string; color?: string; tooltip?: string }> = {};
              const collect = (files: unknown[], staged: boolean) => {
                for (const f of files as any[]) {
                  if (!f || !f.path) continue;
                  let color = staged ? '#00c853' : '#ffab00';
                  switch (f.status) {
                    case 'A':
                      color = '#00c853';
                      break;
                    case 'D':
                      color = '#e53935';
                      break;
                    case 'R':
                      color = '#1e88e5';
                      break;
                    case 'U':
                      color = '#d50000';
                      break;
                    case '??':
                      color = '#9e9e9e';
                      break;
                  }
                  map[f.path] = {
                    badge: f.status === '??' ? '?' : f.status,
                    color,
                    tooltip: `${staged ? 'Staged' : 'Unstaged'} ${statusLabel(f.status)}`,
                  };
                }
              };
              collect(data.status.staged || [], true);
              collect(data.status.unstaged || [], false);
              collect(data.status.untracked || [], false);
              collect(data.status.conflicted || [], false);
              setGitDecorations(map);
            }

            (async () => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyWindow: any = window as any;
                const gitApi = anyWindow?.gitExtensionAPI || anyWindow?.appShell?.git;
                const service = gitApi?.getGitService?.();
                const branches = await service?.getBranches?.();
                if (branches) {
                  const normalized = extractBranchNames(branches);
                  const activeBranch = data.repository?.branch;
                  const finalBranches =
                    activeBranch && !normalized.includes(activeBranch)
                      ? [activeBranch, ...normalized]
                      : normalized;
                  setGitBranches(finalBranches);
                }
              } catch (branchError) {
                console.warn('Failed to refresh Git branches from status event', branchError);
              }
            })();
            break;
          }

          case 'git.repositoryActivated': {
            setGitRepoDetected(true);
            refreshGitStatus();
            break;
          }

          case 'git.noRepository': {
            setGitRepoDetected(false);
            setGitBranch(null);
            setGitAheadBehind(null);
            setGitDecorations({});
            setGitBranches([]);
            break;
          }
        }
      };

      // Register listener through electronAPI
      if (window.electronAPI?.onExtensionEvent) {
        window.electronAPI.onExtensionEvent(handleExtensionEvent);

        cleanup = () => {
          if (window.electronAPI?.removeExtensionEventListener) {
            window.electronAPI.removeExtensionEventListener(handleExtensionEvent);
          }
        };
      }
    };

    // Initial setup and fallback refresh
    setupGitEventListeners();
    refreshGitStatus(); // Initial load

    return cleanup;
  }, [rootPath, refreshGitStatus]);

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
      const tree = (await window.electronAPI?.getFileTree?.(path, depth)) as FileItem | null;
      if (tree) {
        setFileTree(tree as FileItem);
      }
      // After loading tree attempt git status detection
      await refreshGitStatus();
    } catch (err) {
      setError('Failed to load directory contents');
      console.error('File tree loading error:', err);
    }
  };

  const statusLabel = (code: string): string => {
    switch (code) {
      case 'M':
        return 'Modified';
      case 'A':
        return 'Added';
      case 'D':
        return 'Deleted';
      case 'R':
        return 'Renamed';
      case 'C':
        return 'Copied';
      case 'U':
        return 'Conflicted';
      case '??':
        return 'Untracked';
      default:
        return 'Changed';
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
        if (fileTree) {
          setFileTree({ ...(fileTree as FileItem) }); // Force re-render
        }
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

  const handleBranchSelect = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const targetBranch = event.target.value;
      if (!targetBranch || targetBranch === gitBranch) {
        return;
      }

      setIsBranchSwitching(true);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyWindow: any = window as any;
        const gitApi = anyWindow?.gitExtensionAPI || anyWindow?.appShell?.git;
        const service = gitApi?.getGitService?.();

        if (service?.switchBranch) {
          await service.switchBranch(targetBranch);
        } else if (gitApi?.commands?.switchBranch) {
          await gitApi.commands.switchBranch(targetBranch);
        } else if (window.electronAPI?.executeCommand) {
          await window.electronAPI.executeCommand('git.switchBranch', targetBranch);
        } else {
          console.warn('Branch switching command not available');
          return;
        }

        await refreshGitStatus();
      } catch (error) {
        console.error('Failed to switch Git branch', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to switch branch: ${message}`);
      } finally {
        setIsBranchSwitching(false);
      }
    },
    [gitBranch, refreshGitStatus]
  );

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
          if (fileTree) {
            setFileTree({ ...(fileTree as FileItem) });
          }
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

          // Git Actions
          case 'git-stage':
            if (item) {
              await handleGitAction('stage', item.path);
            }
            break;

          case 'git-unstage':
            if (item) {
              await handleGitAction('unstage', item.path);
            }
            break;

          case 'git-discard':
            if (item && confirm(`Discard changes in "${item.name}"? This cannot be undone.`)) {
              await handleGitAction('discard', item.path);
            }
            break;

          case 'git-open-diff':
            if (item) {
              await handleGitAction('openDiff', item.path);
            }
            break;

          case 'git-stage-all':
            await handleGitAction('stageAll');
            break;

          case 'git-commit':
            await handleGitAction('commit');
            break;

          case 'git-push':
            await handleGitAction('push');
            break;

          case 'git-pull':
            await handleGitAction('pull');
            break;
        }
      } catch (err) {
        console.error('Context menu action error:', err);
      }
    },
    [rootPath, handleDoubleClick, loadFileTree]
  );

  // Git action handler
  const handleGitAction = async (action: string, filePath?: string) => {
    try {
      // Try to execute Git command through extension API or electron command system
      const commandId = `git.${action}`;
      const args = filePath ? [filePath] : [];

      // First try extension API if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyWindow: any = window as any;
      const gitApi = anyWindow?.gitExtensionAPI || anyWindow?.appShell?.git;

      if (gitApi?.commands?.[action]) {
        await gitApi.commands[action](...args);
      } else if (window.electronAPI?.executeCommand) {
        // Fallback to command system
        await window.electronAPI.executeCommand(commandId, ...args);
      } else {
        console.warn(`Git action not available: ${action}`);
        return;
      }

      // Trigger manual refresh if events don't fire
      setTimeout(() => refreshGitStatus(), 100);
    } catch (error) {
      console.error(`Git action failed: ${action}`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Git ${action} failed: ${errorMsg}`);
    }
  };

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
          {gitRepoDetected && (
            <div className="flex items-center gap-1">
              {(() => {
                const aheadBehindText = gitAheadBehind
                  ? `\nAhead: ${gitAheadBehind.ahead} Behind: ${gitAheadBehind.behind}`
                  : '';
                const title = `Git Repository${gitBranch ? `\nBranch: ${gitBranch}` : ''}${aheadBehindText}`;
                return (
                  <div
                    className="flex items-center text-[10px] px-1 py-0.5 rounded bg-vscode-badge-bg text-vscode-badge-fg gap-1 border border-vscode-border"
                    title={title}
                    style={{ lineHeight: '10px' }}
                  >
                    <span style={{ fontSize: '11px' }}></span>
                    {gitBranch && gitBranches.length === 0 && (
                      <span className="font-medium">{gitBranch}</span>
                    )}
                    {gitAheadBehind && (gitAheadBehind.ahead > 0 || gitAheadBehind.behind > 0) && (
                      <span className="opacity-80">
                        {gitAheadBehind.ahead > 0 && `↑${gitAheadBehind.ahead}`}
                        {gitAheadBehind.behind > 0 && `↓${gitAheadBehind.behind}`}
                      </span>
                    )}
                  </div>
                );
              })()}
              {gitBranches.length > 0 && (
                <select
                  className="text-[10px] px-1 py-0.5 rounded border border-vscode-border bg-vscode-input-background text-vscode-fg-primary focus:outline-none focus:border-vscode-accent disabled:opacity-60"
                  value={gitBranch ?? ''}
                  onChange={handleBranchSelect}
                  disabled={isBranchSwitching}
                  title="Switch Git branch"
                >
                  {!gitBranch && <option value="">Select branch</option>}
                  {gitBranches.map(branchName => (
                    <option key={branchName} value={branchName}>
                      {branchName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
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
            item={fileTree as FileItem}
            depth={0}
            isSelected={selectedItem?.path === fileTree?.path}
            isRenaming={renamingItem?.path === fileTree?.path}
            showHiddenFiles={showHiddenFiles}
            decorations={gitDecorations}
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
          gitRepoDetected={gitRepoDetected}
          gitDecorations={gitDecorations}
          onItemClick={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
