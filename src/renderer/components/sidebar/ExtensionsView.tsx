import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

export const ExtensionsView: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const loadExtensions = async () => {
    try {
      const extensions = await window.electronAPI?.getExtensions();
      if (extensions) {
        dispatch({
          type: 'SET_EXTENSIONS',
          payload: extensions.map(ext => ({
            id: ext.id || ext.name,
            name: ext.name,
            version: ext.version,
            enabled: true,
            description: ext.description,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to load extensions:', error);
    }
  };

  const handleRefresh = () => {
    loadExtensions();
  };

  useEffect(() => {
    loadExtensions();
  }, []);

  return (
    <div className="p-2">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 px-2 py-1">
          <h4 className="text-xxs font-semibold text-vscode-fg-muted uppercase tracking-wide">
            Installed
          </h4>
          <div className="flex gap-1">
            <button className="sidebar-action text-xs" onClick={handleRefresh} title="Refresh">
              🔄
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {state.extensions.length > 0 ? (
            state.extensions.map(ext => (
              <div
                key={ext.id}
                className="px-2 py-1 text-xs text-vscode-fg-secondary hover:bg-vscode-bg-quaternary rounded transition-colors cursor-pointer"
              >
                <div className="font-medium">{ext.name}</div>
                <div className="text-vscode-fg-muted text-xxs">v{ext.version}</div>
                {ext.description && (
                  <div className="text-vscode-fg-muted text-xxs mt-1 opacity-75">
                    {ext.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-vscode-fg-muted">
              No extensions installed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
