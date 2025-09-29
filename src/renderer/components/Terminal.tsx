import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useAppContext } from '../context/AppContext';

export const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { state } = useAppContext();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance with VS Code theme
    const terminal = new XTerm({
      fontFamily: 'SF Mono, Monaco, Inconsolata, Fira Code, Source Code Pro, Menlo, monospace',
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 1.4,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: 'block',
      cursorWidth: 2,
      allowTransparency: false,
      convertEol: true,
      disableStdin: false,
      theme: {
        // VS Code dark theme colors
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#007acc',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',

        // ANSI colors
        black: '#000000',
        red: '#f44747',
        green: '#608b4e',
        yellow: '#ffcc02',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#9cdcfe',
        white: '#d4d4d4',

        // Bright colors
        brightBlack: '#666666',
        brightRed: '#f44747',
        brightGreen: '#608b4e',
        brightYellow: '#ffcc02',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#9cdcfe',
        brightWhite: '#ffffff',
      },
      scrollback: 10000,
      tabStopWidth: 4,
      rightClickSelectsWord: true,
      fastScrollModifier: 'alt',
      fastScrollSensitivity: 3,
      scrollSensitivity: 1,
    });

    // Setup addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal
    terminal.open(terminalRef.current);

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Initial fit attempt (may not work if container isn't sized yet)
    fitAddon.fit();

    // Set up ResizeObserver to watch for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && terminalRef.current) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          // Only resize if the container has meaningful dimensions
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            // Debounce the resize to avoid excessive calls
            setTimeout(() => {
              if (fitAddonRef.current) {
                fitAddonRef.current.fit();
              }
            }, 50);
          }
        }
      });
      resizeObserver.observe(terminalRef.current);
    }

    // Setup terminal process connection
    const setupTerminal = async () => {
      try {
        const terminalInfo = await window.electronAPI?.createTerminal();
        if (terminalInfo) {
          // Handle terminal output
          window.electronAPI?.onTerminalData(terminalInfo.id, (data: string) => {
            terminal.write(data);
          });

          // Handle user input
          terminal.onData(data => {
            window.electronAPI?.writeToTerminal(terminalInfo.id, data);
          });

          // Focus the terminal
          terminal.focus();
        } else {
          terminal.write('❌ Failed to create terminal process\r\n');
        }
      } catch (error) {
        console.error('Failed to setup terminal:', error);
        terminal.write(`❌ Terminal initialization error: ${error}\r\n`);
      }
    };

    setupTerminal();

    // Additional resize trigger when terminal becomes visible
    // This helps with the initial load sizing issue
    const checkVisibilityAndResize = () => {
      if (terminalRef.current && fitAddonRef.current) {
        const container = terminalRef.current;
        const rect = container.getBoundingClientRect();

        // If container is visible and has size, ensure terminal is fitted
        if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
          setTimeout(() => {
            fitAddonRef.current?.fit();
          }, 100);
        }
      }
    };

    // Check visibility periodically for the first few seconds after mount
    const visibilityCheckInterval = setInterval(checkVisibilityAndResize, 500);
    setTimeout(() => clearInterval(visibilityCheckInterval), 3000);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (visibilityCheckInterval) {
        clearInterval(visibilityCheckInterval);
      }
      terminal.dispose();
    };
  }, []);

  // Handle panel state changes and resize
  useEffect(() => {
    const resizeTerminal = () => {
      if (fitAddonRef.current && !state.panelCollapsed) {
        // Multiple resize attempts with different timings to ensure proper layout
        const resizeAttempts = [0, 100, 350, 500]; // Immediate, fast, animation complete, safety

        resizeAttempts.forEach(delay => {
          setTimeout(() => {
            if (fitAddonRef.current && terminalRef.current) {
              // Check if container has proper dimensions before fitting
              const container = terminalRef.current;
              if (container.offsetWidth > 0 && container.offsetHeight > 0) {
                fitAddonRef.current.fit();
              }
            }
          }, delay);
        });
      }
    };

    resizeTerminal();
  }, [state.panelCollapsed, state.panelHeight, state.activePanel]); // Also watch activePanel changes

  return (
    <div className="h-full w-full">
      <div
        ref={terminalRef}
        className="h-full w-full border border-vscode-border rounded bg-terminal-bg overflow-hidden"
      />
    </div>
  );
};
