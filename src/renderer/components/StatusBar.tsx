import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { isMacOS, getCommandPaletteShortcut, getModifierKeyDisplay } from '../utils/platform';

export const StatusBar: React.FC = () => {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    // Initialize status bar with app ready message
    dispatch({
      type: 'UPDATE_STATUS_BAR',
      payload: { languageMode: 'Terminal' },
    });

    // Show ready message briefly
    const timer = setTimeout(() => {
      // Could show a temporary message here
    }, 2000);

    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleStatusItemClick = (item: string) => {
    console.log(`Status item clicked: ${item}`);
    // Future: Open relevant panels or dialogs
    switch (item) {
      case 'branch':
        // Open git integration
        break;
      case 'problems':
        // Open problems panel
        break;
      case 'language':
        // Open language selector
        break;
      case 'command-palette':
        // Simulate the platform-appropriate keyboard shortcut to open command palette
        const event = new KeyboardEvent('keydown', {
          key: 'P',
          metaKey: isMacOS(),
          ctrlKey: !isMacOS(),
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-status-bar bg-vscode-accent-blue text-white flex items-center justify-between px-4 text-xxs flex-shrink-0 select-none border-t border-vscode-accent-blue-dark">
      <div className="flex items-center gap-4">
        <div className="status-item" onClick={() => handleStatusItemClick('branch')}>
          <span className="text-xs">🌳</span>
          <span className="whitespace-nowrap">{state.statusBarItems.branch}</span>
        </div>

        <div className="status-item" onClick={() => handleStatusItemClick('sync')}>
          <span className="text-xs">↻</span>
          <span className="whitespace-nowrap">{state.statusBarItems.sync}</span>
        </div>

        <div className="status-item" onClick={() => handleStatusItemClick('problems')}>
          <span className="text-xs">⚠</span>
          <span className="whitespace-nowrap">{state.statusBarItems.problems}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="status-item cursor-pointer hover:bg-blue-600"
          onClick={() => handleStatusItemClick('command-palette')}
          title={`Press ${getCommandPaletteShortcut()} to open Command Palette`}
        >
          <span className="text-xs">{getModifierKeyDisplay()}</span>
          <span className="whitespace-nowrap">Command Palette</span>
        </div>

        <div className="status-item" onClick={() => handleStatusItemClick('language')}>
          <span className="whitespace-nowrap">{state.statusBarItems.languageMode}</span>
        </div>

        <div className="status-item">
          <span className="whitespace-nowrap">{state.statusBarItems.encoding}</span>
        </div>

        <div className="status-item">
          <span className="whitespace-nowrap">{state.statusBarItems.lineEnding}</span>
        </div>

        <div className="status-item">
          <span className="whitespace-nowrap">{state.statusBarItems.cursorPosition}</span>
        </div>

        {state.statusBarItems.selection && (
          <div className="status-item">
            <span className="whitespace-nowrap">{state.statusBarItems.selection}</span>
          </div>
        )}
      </div>
    </div>
  );
};
