import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import '@xterm/xterm/css/xterm.css';

// Initialize React app
function initializeApp(): void {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupReactApp);
  } else {
    setupReactApp();
  }
}

function setupReactApp(): void {
  const container = document.getElementById('app');
  if (!container) {
    console.error('❌ App container not found');
    return;
  }

  const root = createRoot(container);
  root.render(<App />);
}

// Initialize the app
initializeApp();
