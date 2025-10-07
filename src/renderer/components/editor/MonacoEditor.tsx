import React, { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { loader, OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useAppContext } from '../../context/AppContext';

// Configure Monaco loader for Electron
// Let webpack handle Monaco Editor loading automatically

// Editor types following project conventions
export interface EditorFile {
  path: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  isReadonly?: boolean;
  encoding?: string;
}

export interface EditorPosition {
  lineNumber: number;
  column: number;
}

export interface EditorSelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface MonacoEditorProps {
  file: EditorFile;
  onContentChange?: (content: string) => void;
  onCursorChange?: (position: EditorPosition) => void;
  onSelectionChange?: (selection: EditorSelection) => void;
  onSave?: (content: string) => Promise<void>;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  height?: string | number;
}

// Language mapping for file extensions
const getLanguageFromPath = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    // JavaScript family
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',

    // Web technologies
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',

    // Data formats
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',

    // Documentation
    md: 'markdown',
    markdown: 'markdown',

    // Programming languages
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    sql: 'sql',

    // Shell scripts
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',

    // Configuration
    toml: 'toml',
    ini: 'ini',
    conf: 'ini',

    // Text files
    txt: 'plaintext',
    log: 'plaintext',
  };

  return languageMap[extension] || 'plaintext';
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  file,
  onContentChange,
  onCursorChange,
  onSelectionChange,
  onSave,
  onFocus,
  onBlur,
  className,
  height = '100%',
}) => {
  const { state } = useAppContext();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle editor mounting
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      try {
        console.log('Monaco Editor mounted successfully', { editor, monaco });
        editorRef.current = editor;
        setIsLoading(false);
        setError(null);

        // Configure editor options
        editor.updateOptions({
          fontSize: 14,
          fontFamily: "'Fira Code', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace",
          lineHeight: 1.5,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'always',
          unfoldOnClickAfterEndOfLine: false,
          contextmenu: true,
          mouseWheelZoom: true,
          multiCursorModifier: 'ctrlCmd',
          accessibilitySupport: 'auto',
        });

        // Set up event listeners
        const disposables: monaco.IDisposable[] = [];

        // Cursor position change
        disposables.push(
          editor.onDidChangeCursorPosition(e => {
            if (onCursorChange) {
              onCursorChange({
                lineNumber: e.position.lineNumber,
                column: e.position.column,
              });
            }
          })
        );

        // Selection change
        disposables.push(
          editor.onDidChangeCursorSelection(e => {
            if (onSelectionChange) {
              onSelectionChange({
                startLineNumber: e.selection.startLineNumber,
                startColumn: e.selection.startColumn,
                endLineNumber: e.selection.endLineNumber,
                endColumn: e.selection.endColumn,
              });
            }
          })
        );

        // Focus events
        disposables.push(
          editor.onDidFocusEditorText(() => {
            if (onFocus) {
              onFocus();
            }
          })
        );

        disposables.push(
          editor.onDidBlurEditorText(() => {
            if (onBlur) {
              onBlur();
            }
          })
        );

        // Save command (Ctrl/Cmd+S)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
          if (onSave) {
            const content = editor.getValue();
            try {
              await onSave(content);
            } catch (error) {
              console.error('Failed to save file:', error);
              setError('Failed to save file');
            }
          }
        });

        // Cleanup on unmount
        return () => {
          disposables.forEach(d => d.dispose());
        };
      } catch (err) {
        console.error('Editor mount error:', err);
        setError('Failed to initialize editor');
        setIsLoading(false);
      }
    },
    [onContentChange, onCursorChange, onSelectionChange, onSave, onFocus, onBlur]
  );

  // Handle content changes
  const handleEditorChange: OnChange = useCallback(
    value => {
      if (onContentChange && value !== undefined) {
        onContentChange(value);
      }
    },
    [onContentChange]
  );

  // Update editor theme based on app theme
  useEffect(() => {
    if (editorRef.current) {
      const theme = state.currentTheme === 'builtin.light' ? 'vs' : 'vs-dark';
      monaco.editor.setTheme(theme);
    }
  }, [state.currentTheme]);

  // Update editor language when file changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const newLanguage = getLanguageFromPath(file.path);
        monaco.editor.setModelLanguage(model, newLanguage);
      }
    }
  }, [file.path]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`} style={{ height }}>
        <div className="text-vscode-fg-muted">Loading editor...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
            className="text-vscode-accent text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <Editor
        value={file.content}
        language={getLanguageFromPath(file.path)}
        theme={state.currentTheme === 'builtin.light' ? 'vs' : 'vs-dark'}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-vscode-fg-muted">Loading editor...</div>
          </div>
        }
        options={{
          readOnly: file.isReadonly,
          selectOnLineNumbers: true,
          roundedSelection: false,
          scrollBeyondLastLine: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default MonacoEditor;
