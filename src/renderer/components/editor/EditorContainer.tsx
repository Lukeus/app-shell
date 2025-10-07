import React, { useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import MonacoEditor, { EditorFile } from './MonacoEditor';
import EditorTabs from './EditorTabs';

export interface EditorContainerProps {
  className?: string;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({ className }) => {
  const { state, dispatch } = useAppContext();

  // Get the currently active file
  const activeFile = state.openFiles.find(file => file.path === state.activeFilePath);

  // Handle file opening (to be called from explorer)
  const handleOpenFile = useCallback(
    async (filePath: string) => {
      try {
        // Check if file is already open
        const existingFile = state.openFiles.find(file => file.path === filePath);

        if (existingFile) {
          // File is already open, just make it active
          dispatch({ type: 'SET_ACTIVE_FILE', payload: filePath });
          return;
        }

        // Read file content
        const content = (await window.electronAPI?.readFileText?.(filePath)) || '';
        const fileName = filePath.split('/').pop() || filePath;

        // Determine file language from extension
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        let language = extension;

        // Map common extensions to Monaco languages
        const languageMap: Record<string, string> = {
          js: 'javascript',
          jsx: 'javascript',
          ts: 'typescript',
          tsx: 'typescript',
          json: 'json',
          html: 'html',
          css: 'css',
          md: 'markdown',
          py: 'python',
          yml: 'yaml',
          yaml: 'yaml',
        };

        if (languageMap[extension]) {
          language = languageMap[extension];
        }

        // Create editor file object
        const newFile: EditorFile = {
          path: filePath,
          name: fileName,
          language,
          content,
          isDirty: false,
          isReadonly: false,
        };

        // Add to state
        dispatch({ type: 'OPEN_FILE', payload: newFile });
      } catch (error) {
        console.error('Failed to open file:', error);
        // TODO: Show error notification
      }
    },
    [state.openFiles, dispatch]
  );

  // Handle file content changes
  const handleContentChange = useCallback(
    (content: string) => {
      if (state.activeFilePath) {
        const currentFile = state.openFiles.find(file => file.path === state.activeFilePath);
        const isDirty = currentFile ? content !== currentFile.content : false;

        dispatch({
          type: 'UPDATE_FILE_CONTENT',
          payload: {
            path: state.activeFilePath,
            content,
            isDirty,
          },
        });
      }
    },
    [state.activeFilePath, state.openFiles, dispatch]
  );

  // Handle file saving
  const handleSave = useCallback(
    async (content: string) => {
      if (!state.activeFilePath) return;

      try {
        await window.electronAPI?.writeFileText?.(state.activeFilePath, content);
        dispatch({ type: 'SAVE_FILE', payload: state.activeFilePath });

        // Update status bar
        dispatch({
          type: 'UPDATE_STATUS_BAR',
          payload: {
            languageMode: activeFile?.language || 'Text',
          },
        });
      } catch (error) {
        console.error('Failed to save file:', error);
        // TODO: Show error notification
        throw error;
      }
    },
    [state.activeFilePath, activeFile?.language, dispatch]
  );

  // Handle tab selection
  const handleTabSelect = useCallback(
    (path: string) => {
      dispatch({ type: 'SET_ACTIVE_FILE', payload: path });
    },
    [dispatch]
  );

  // Handle tab closing
  const handleTabClose = useCallback(
    (path: string) => {
      const fileToClose = state.openFiles.find(file => file.path === path);

      if (fileToClose?.isDirty) {
        // TODO: Show confirmation dialog for unsaved changes
        const confirmed = window.confirm(
          `You have unsaved changes in ${fileToClose.name}. Do you want to close without saving?`
        );

        if (!confirmed) {
          return;
        }
      }

      dispatch({ type: 'CLOSE_FILE', payload: path });
    },
    [state.openFiles, dispatch]
  );

  // Handle tab reordering
  const handleTabMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'MOVE_TAB', payload: { fromIndex, toIndex } });
    },
    [dispatch]
  );

  // Handle cursor position changes
  const handleCursorChange = useCallback(
    (position: { lineNumber: number; column: number }) => {
      dispatch({
        type: 'UPDATE_STATUS_BAR',
        payload: {
          cursorPosition: `Ln ${position.lineNumber}, Col ${position.column}`,
        },
      });
    },
    [dispatch]
  );

  // Handle selection changes
  const handleSelectionChange = useCallback(
    (selection: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    }) => {
      const isSelection = !(
        selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn
      );

      if (isSelection) {
        const lines = selection.endLineNumber - selection.startLineNumber + 1;
        const chars = selection.endColumn - selection.startColumn;
        dispatch({
          type: 'UPDATE_STATUS_BAR',
          payload: {
            selection: lines === 1 ? `${chars} chars selected` : `${lines} lines selected`,
          },
        });
      } else {
        dispatch({
          type: 'UPDATE_STATUS_BAR',
          payload: {
            selection: '',
          },
        });
      }
    },
    [dispatch]
  );

  // Handle focus events
  const handleEditorFocus = useCallback(() => {
    if (activeFile) {
      dispatch({
        type: 'UPDATE_STATUS_BAR',
        payload: {
          languageMode: activeFile.language,
        },
      });
    }
  }, [activeFile, dispatch]);

  // Expose the openFile function globally for the explorer to use
  useEffect(() => {
    // Store the function on window for the explorer to call
    (window as any).openEditorFile = handleOpenFile;

    return () => {
      delete (window as any).openEditorFile;
    };
  }, [handleOpenFile]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + W - Close current tab
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault();
        if (state.activeFilePath) {
          handleTabClose(state.activeFilePath);
        }
      }

      // Ctrl/Cmd + Tab - Switch between tabs
      if ((event.ctrlKey || event.metaKey) && event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = state.openFiles.findIndex(file => file.path === state.activeFilePath);
        const nextIndex = event.shiftKey
          ? (currentIndex - 1 + state.openFiles.length) % state.openFiles.length
          : (currentIndex + 1) % state.openFiles.length;

        if (state.openFiles[nextIndex]) {
          handleTabSelect(state.openFiles[nextIndex].path);
        }
      }

      // Ctrl/Cmd + S - Save current file
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        // Let the Monaco Editor handle this
        return;
      }

      // Ctrl/Cmd + Shift + S - Save all files
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        // TODO: Implement save all
        console.log('Save all not implemented yet');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.openFiles, state.activeFilePath, handleTabClose, handleTabSelect]);

  // Show welcome screen when no files are open
  if (state.openFiles.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className || ''}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-xl" style={{ color: 'var(--color-vscode-fg-secondary)' }}>
              Welcome to App Shell Editor
            </h2>
            <p className="mb-3" style={{ color: 'var(--color-vscode-fg-muted)' }}>
              Open a file from the Explorer to get started
            </p>
            <div className="text-sm" style={{ color: 'var(--color-vscode-fg-disabled)' }}>
              <p>Supported file types:</p>
              <p className="mt-2">TypeScript, JavaScript, JSON, HTML, CSS, Markdown, and more</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Editor Tabs */}
      <EditorTabs
        tabs={state.openFiles}
        activeTabPath={state.activeFilePath}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onTabMove={handleTabMove}
      />

      {/* Editor Content */}
      <div className="flex-1 min-h-0">
        {activeFile && (
          <MonacoEditor
            file={activeFile}
            onContentChange={handleContentChange}
            onCursorChange={handleCursorChange}
            onSelectionChange={handleSelectionChange}
            onSave={handleSave}
            onFocus={handleEditorFocus}
            height="100%"
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
};

export default EditorContainer;
