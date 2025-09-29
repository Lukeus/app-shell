import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AppProvider, useAppContext } from './context/AppContext';
import { useCommandPalette } from './hooks/useCommandPalette';

// Theme application logic
const ThemeManager: React.FC = () => {
  const { dispatch } = useAppContext();

  useEffect(() => {
    // Apply theme colors to CSS custom properties
    const applyThemeColors = (themeData: any) => {
      if (themeData.theme && themeData.theme.colors) {
        const colors = themeData.theme.colors;
        const root = document.documentElement;

        // Map theme colors to CSS variables
        const colorMapping: { [key: string]: string } = {
          'app.background': '--color-vscode-bg-primary',
          'app.foreground': '--color-vscode-fg-primary',
          'app.border': '--color-vscode-border',
          'panel.background': '--color-vscode-bg-secondary',
          'panel.foreground': '--color-vscode-fg-secondary',
          'terminal.background': '--color-terminal-bg',
          'terminal.foreground': '--color-terminal-fg',
          'button.background': '--color-vscode-accent-blue',
          'button.foreground': '--color-vscode-fg-primary',
          'button.hoverBackground': '--color-vscode-accent-blue-hover',
          'input.background': '--color-vscode-input-bg',
          'input.foreground': '--color-vscode-fg-secondary',
          'input.border': '--color-vscode-input-border',
        };

        // Apply colors to CSS variables
        Object.entries(colors).forEach(([colorKey, colorValue]) => {
          const cssVar = colorMapping[colorKey];
          if (cssVar && typeof colorValue === 'string') {
            root.style.setProperty(cssVar, colorValue);
          }
        });

        // Update app context
        dispatch({ type: 'SET_THEME', payload: themeData.themeId });
      }
    };

    // Load initial theme
    const loadInitialTheme = async () => {
      try {
        const currentThemeId =
          ((await window.electronAPI?.getSetting('theme')) as string) || 'builtin.dark';
        const themes = await window.electronAPI?.getThemes();
        const currentTheme = themes?.find((t: any) => t.id === currentThemeId);

        if (currentTheme) {
          applyThemeColors({ themeId: currentThemeId, theme: currentTheme });
        }
      } catch (error) {
        console.error('Failed to load initial theme:', error);
      }
    };

    // Listen for theme changes
    window.electronAPI?.onThemeChange?.(applyThemeColors);

    // Load initial theme
    loadInitialTheme();
  }, [dispatch]);

  return null;
};

const AppContent: React.FC = () => {
  const commandPalette = useCommandPalette();

  return (
    <div className="h-screen flex flex-col bg-vscode-bg-primary text-vscode-fg-primary">
      {/* Theme Manager */}
      <ThemeManager />

      {/* Title Bar */}
      <TitleBar />

      {/* Main Container */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <MainContent />
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Command Palette */}
      <CommandPalette isVisible={commandPalette.isVisible} onClose={commandPalette.hide} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
