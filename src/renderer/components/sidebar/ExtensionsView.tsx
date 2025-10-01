import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export const ExtensionsView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleInstallFromFile = async () => {
    if (!window.electronAPI?.showOpenDialog || !window.electronAPI?.installExtension) {
      setMessage({ type: 'error', text: 'Extension installation API not available' });
      return;
    }

    try {
      setInstalling(true);
      setMessage(null);

      // Show file dialog to select extension file
      const result = await window.electronAPI.showOpenDialog({
        title: 'Select Extension File',
        buttonLabel: 'Install Extension',
        filters: [
          { name: 'Extension Files', extensions: ['zip', 'vsix', 'tgz'] },
          { name: 'Archive Files', extensions: ['zip', 'tgz', 'tar.gz'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const extensionPath = result.filePaths[0];
        const fileName = extensionPath.split(/[/\\]/).pop() || 'extension';

        console.log(`Installing extension from: ${extensionPath}`);

        // Install the extension
        const installedExtension = await window.electronAPI.installExtension(extensionPath);

        // Refresh the extensions list
        await loadExtensions();

        setMessage({
          type: 'success',
          text: `Successfully installed "${installedExtension.name || fileName}"`,
        });

        console.log('Extension installed successfully');
      }
    } catch (error: any) {
      console.error('Failed to install extension:', error);
      setMessage({
        type: 'error',
        text: `Failed to install extension: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setInstalling(false);
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    loadExtensions();
  }, []);

  return (
    <div className="p-2">
      {/* Install Extension Section */}
      <div className="mb-4 p-2 rounded border border-vscode-border bg-vscode-bg-tertiary">
        <h4 className="text-xxs font-semibold text-vscode-fg-muted uppercase tracking-wide mb-2">
          Install Extension
        </h4>
        <button
          className={`w-full px-3 py-2 text-xs rounded transition-colors ${
            installing
              ? 'bg-vscode-bg-quaternary text-vscode-fg-disabled cursor-not-allowed'
              : 'bg-vscode-accent-blue text-white hover:bg-blue-600'
          }`}
          onClick={handleInstallFromFile}
          disabled={installing}
        >
          {installing ? (
            <span className="flex items-center justify-center gap-2">
              <span>⏳</span>
              Installing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>📁</span>
              Browse for Extension File
            </span>
          )}
        </button>
        <p className="text-xxs text-vscode-fg-muted mt-1 text-center">
          Install .zip, .vsix, or .tgz extension files
        </p>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-2 p-2 rounded text-xxs text-center ${
              message.type === 'success'
                ? 'bg-green-900 text-green-200 border border-green-700'
                : 'bg-red-900 text-red-200 border border-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

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
                className="px-2 py-2 text-xs text-vscode-fg-secondary hover:bg-vscode-bg-quaternary rounded transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{ext.name}</div>
                    <div className="text-vscode-fg-muted text-xxs">v{ext.version}</div>
                    {ext.description && (
                      <div className="text-vscode-fg-muted text-xxs mt-1 opacity-75 line-clamp-2">
                        {ext.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      className={`px-2 py-1 text-xxs rounded transition-colors ${
                        ext.enabled
                          ? 'bg-yellow-700 text-yellow-200 hover:bg-yellow-600'
                          : 'bg-green-700 text-green-200 hover:bg-green-600'
                      }`}
                      onClick={async () => {
                        try {
                          if (ext.enabled) {
                            await window.electronAPI?.disableExtension(ext.id);
                          } else {
                            await window.electronAPI?.enableExtension(ext.id);
                          }
                          await loadExtensions();
                        } catch (error) {
                          console.error('Failed to toggle extension:', error);
                          setMessage({
                            type: 'error',
                            text: `Failed to ${ext.enabled ? 'disable' : 'enable'} extension`,
                          });
                        }
                      }}
                      title={ext.enabled ? 'Disable Extension' : 'Enable Extension'}
                    >
                      {ext.enabled ? '⏸️' : '▶️'}
                    </button>
                    <button
                      className="px-2 py-1 text-xxs rounded transition-colors bg-red-700 text-red-200 hover:bg-red-600"
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to uninstall "${ext.name}"?`)) {
                          return;
                        }
                        try {
                          await window.electronAPI?.uninstallExtension(ext.id);
                          await loadExtensions();
                          setMessage({
                            type: 'success',
                            text: `Successfully uninstalled "${ext.name}"`,
                          });
                        } catch (error) {
                          console.error('Failed to uninstall extension:', error);
                          setMessage({
                            type: 'error',
                            text: `Failed to uninstall extension`,
                          });
                        }
                      }}
                      title="Uninstall Extension"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-vscode-fg-muted">
              No extensions installed
              <div className="text-xxs opacity-60 mt-1">
                Use the button above to install extensions from files
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
