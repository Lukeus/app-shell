import React from 'react';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AppProvider } from './context/AppContext';
import { useCommandPalette } from './hooks/useCommandPalette';

const App: React.FC = () => {
  const commandPalette = useCommandPalette();

  return (
    <AppProvider>
      <div className="h-screen flex flex-col bg-vscode-bg-primary text-vscode-fg-primary">
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
    </AppProvider>
  );
};

export default App;
