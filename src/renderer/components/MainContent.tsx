import React from 'react';
import { BottomPanel } from './BottomPanel';

export const MainContent: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Editor Area */}
      <div
        className="flex-1 flex items-center justify-center text-lg min-h-0 overflow-hidden"
        style={{
          backgroundColor: 'var(--color-vscode-bg-primary)',
          color: 'var(--color-vscode-fg-muted)',
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl" style={{ color: 'var(--color-vscode-fg-secondary)' }}>
            Welcome to App Shell
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-vscode-fg-muted)' }}>
            Your extensible application platform
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-vscode-fg-disabled)' }}>
            Press{' '}
            <kbd
              className="px-2 py-1 rounded font-mono text-xs"
              style={{ backgroundColor: 'var(--color-vscode-bg-quaternary)' }}
            >
              Cmd+Shift+P
            </kbd>{' '}
            (macOS) or{' '}
            <kbd
              className="px-2 py-1 rounded font-mono text-xs"
              style={{ backgroundColor: 'var(--color-vscode-bg-quaternary)' }}
            >
              Ctrl+Shift+P
            </kbd>{' '}
            (Windows/Linux) to open Command Palette
          </p>
        </div>
      </div>

      {/* Bottom Panel */}
      <BottomPanel />
    </div>
  );
};
