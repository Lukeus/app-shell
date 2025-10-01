import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

interface Theme {
  id: string;
  name: string;
  type: string;
}

export const SettingsView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [fontSize, setFontSize] = useState(14);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);

  // Load available themes on component mount
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themes = await window.electronAPI?.getThemes();
        if (themes && Array.isArray(themes)) {
          setAvailableThemes(themes);
        }
      } catch (error) {
        console.error('Failed to load themes:', error);
        // Fallback to built-in themes
        setAvailableThemes([
          { id: 'builtin.dark', name: 'Dark', type: 'dark' },
          { id: 'builtin.light', name: 'Light', type: 'light' },
        ]);
      }
    };

    loadThemes();
  }, []);

  const handleThemeChange = async (theme: string) => {
    try {
      // Apply theme - this will trigger the theme change event and update the UI automatically
      await window.electronAPI?.applyTheme(theme);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    // This would integrate with terminal settings
    console.log('Font size changed to:', size);
  };

  return (
    <div className="p-2">
      <div className="mb-6">
        <h4 className="text-xxs font-semibold text-vscode-fg-muted uppercase tracking-wide mb-3 px-2">
          Appearance
        </h4>
        <div className="flex items-center justify-between mb-3 px-2">
          <label htmlFor="theme-select" className="text-xs text-vscode-fg-secondary flex-1">
            Theme:
          </label>
          <select
            id="theme-select"
            className="setting-input"
            value={state.currentTheme}
            onChange={e => handleThemeChange(e.target.value)}
          >
            {availableThemes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xxs font-semibold text-vscode-fg-muted uppercase tracking-wide mb-3 px-2">
          Terminal
        </h4>
        <div className="flex items-center justify-between mb-3 px-2">
          <label htmlFor="font-size" className="text-xs text-vscode-fg-secondary flex-1">
            Font Size:
          </label>
          <input
            type="number"
            id="font-size"
            className="setting-input"
            min="10"
            max="24"
            value={fontSize}
            onChange={e => handleFontSizeChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};
