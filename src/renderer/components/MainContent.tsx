import React from 'react';
import { BottomPanel } from './BottomPanel';
import EditorContainer from './editor/EditorContainer';

export const MainContent: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Editor Area */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          backgroundColor: 'var(--color-vscode-bg-primary)',
        }}
      >
        <EditorContainer className="w-full h-full" />
      </div>

      {/* Bottom Panel */}
      <BottomPanel />
    </div>
  );
};
