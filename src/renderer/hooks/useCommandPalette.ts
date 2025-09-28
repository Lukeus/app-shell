import { useState, useEffect, useCallback } from 'react';
import { isCommandPaletteShortcut } from '../utils/platform';

export const useCommandPalette = () => {
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Listen for IPC events from main process
  useEffect(() => {
    const handleCommandPaletteToggle = () => {
      toggle();
    };

    // Add IPC event listener
    if (window.electronAPI?.onCommandPaletteToggle) {
      window.electronAPI.onCommandPaletteToggle(handleCommandPaletteToggle);
    }

    return () => {
      if (window.electronAPI?.removeCommandPaletteListener) {
        window.electronAPI.removeCommandPaletteListener(handleCommandPaletteToggle);
      }
    };
  }, [toggle]);

  // Global keyboard shortcut listener (fallback for direct keyboard input)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for command palette shortcut using platform utility
      if (isCommandPaletteShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }

      // Escape to close if visible
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        event.stopPropagation();
        hide();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [toggle, hide, isVisible]);

  return {
    isVisible,
    show,
    hide,
    toggle,
  };
};
