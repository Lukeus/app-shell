import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ExplorerView } from './sidebar/ExplorerView';
import { ExtensionsView } from './sidebar/ExtensionsView';
import { MarketplaceView } from './sidebar/MarketplaceView';
import { SettingsView } from './sidebar/SettingsView';
import { PromptRegistryView } from './sidebar/PromptRegistryView';

const viewTitles: Record<string, string> = {
  explorer: 'Explorer',
  extensions: 'Extensions',
  marketplace: 'Marketplace',
  settings: 'Settings',
  prompts: 'Prompt Registry',
};

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleClose = () => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: true });
  };

  const renderView = () => {
    switch (state.activeView) {
      case 'explorer':
        return <ExplorerView />;
      case 'extensions':
        return <ExtensionsView />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'settings':
        return <SettingsView />;
      case 'prompts':
        return <PromptRegistryView />;
      default:
        return <ExtensionsView />;
    }
  };

  return (
    <div
      className={`
        flex flex-col transition-all duration-300 ease-out relative
        ${state.sidebarCollapsed ? 'w-0 overflow-hidden' : ''}
      `}
      style={{
        width: state.sidebarCollapsed ? '0' : 'var(--width-sidebar)',
        marginLeft: state.sidebarCollapsed ? 'calc(-1 * var(--width-sidebar))' : '0',
        backgroundColor: 'var(--color-vscode-bg-secondary)',
        borderRight: '1px solid var(--color-vscode-border)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 flex-shrink-0 select-none"
        style={{
          height: 'var(--height-sidebar-header)',
          backgroundColor: 'var(--color-vscode-bg-tertiary)',
          borderBottom: '1px solid var(--color-vscode-border)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase"
          style={{ color: 'var(--color-vscode-fg-secondary)' }}
        >
          {viewTitles[state.activeView] || 'Unknown'}
        </h2>
        <div className="flex gap-1">
          <button className="sidebar-action" onClick={handleClose} title="Hide Sidebar">
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin relative">{renderView()}</div>
    </div>
  );
};
