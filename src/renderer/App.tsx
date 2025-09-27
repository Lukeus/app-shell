import React from 'react';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { StatusBar } from './components/StatusBar';
import { AppProvider } from './context/AppContext';

const App: React.FC = () => {
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
      </div>
    </AppProvider>
  );
};

export default App;
