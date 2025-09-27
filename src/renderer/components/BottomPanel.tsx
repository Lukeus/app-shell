import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Terminal } from './Terminal';

export const BottomPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    dispatch({ type: 'TOGGLE_PANEL' });
  };

  const handleTabClick = (tabId: string) => {
    // If panel is collapsed, expand it when clicking a tab
    if (state.panelCollapsed) {
      dispatch({ type: 'SET_PANEL_COLLAPSED', payload: false });
    }
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: tabId });
  };

  // Keyboard shortcut for panel toggle (Cmd/Ctrl + `)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === '`') {
        e.preventDefault();
        handleToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const panelStyle = state.panelCollapsed
    ? { height: '32px', minHeight: '32px', maxHeight: '32px' }
    : { height: `${state.panelHeight}px` };

  return (
    <>
      <div
        ref={panelRef}
        className={`
          bg-vscode-bg-primary border-t border-vscode-bg-tertiary 
          relative transition-all duration-300 ease-out
          min-h-panel-header max-h-96 flex flex-col flex-shrink-0 z-5
          ${state.panelCollapsed ? 'collapsed' : ''}
        `}
        style={panelStyle}
      >
        {/* Panel Header */}
        <div className="h-panel-header bg-vscode-bg-secondary border-b border-vscode-bg-tertiary flex items-center justify-between flex-shrink-0">
          <div className="flex items-center px-3 h-full">
            <button
              className={`panel-tab ${state.activePanel === 'terminal' ? 'active' : ''}`}
              onClick={() => handleTabClick('terminal')}
            >
              Terminal
            </button>
            <button
              className={`panel-tab ${state.activePanel === 'output' ? 'active' : ''}`}
              onClick={() => handleTabClick('output')}
            >
              Output
            </button>
          </div>

          <div className="flex items-center pr-2">
            <button
              className="w-6 h-6 flex items-center justify-center cursor-pointer text-vscode-fg-muted bg-transparent border-none rounded transition-all duration-200 hover:text-white hover:bg-vscode-bg-quaternary"
              onClick={handleToggle}
              title="Toggle Panel"
            >
              <span
                className={`text-xs transition-transform duration-200 ${state.panelCollapsed ? 'rotate-180' : ''}`}
              >
                ▲
              </span>
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div
          className={`flex-1 p-2 bg-vscode-bg-primary overflow-hidden ${state.panelCollapsed ? 'hidden' : ''}`}
        >
          {state.activePanel === 'terminal' && <Terminal />}
          {state.activePanel === 'output' && (
            <div className="h-full flex items-center justify-center text-vscode-fg-muted">
              Output panel - Coming Soon
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      {!state.panelCollapsed && (
        <div className="h-1 bg-transparent cursor-ns-resize relative z-10 hover:bg-vscode-accent-blue transition-colors" />
      )}
    </>
  );
};
