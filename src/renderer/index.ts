import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { CommandPalette } from './components/command-palette';

class AppRenderer {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private commandPalette: CommandPalette | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private async setup(): Promise<void> {
    try {
      // Setup title bar controls
      this.setupTitleBarControls();

      // Setup command palette
      this.setupCommandPalette();

      // Setup terminal
      await this.setupTerminal();

      // Load extensions
      await this.loadExtensions();

      // Setup theme
      await this.applyTheme();

      // Command palette handles its own keyboard shortcuts
    } catch (error) {
      console.error('❌ Failed to initialize renderer:', error);
    }
  }

  private setupTitleBarControls(): void {
    const minimizeBtn = document.getElementById('minimize-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const closeBtn = document.getElementById('close-btn');

    minimizeBtn?.addEventListener('click', () => {
      window.electronAPI?.windowControl('minimize');
    });

    maximizeBtn?.addEventListener('click', () => {
      window.electronAPI?.windowControl('maximize');
    });

    closeBtn?.addEventListener('click', () => {
      window.electronAPI?.windowControl('close');
    });
  }

  private async setupTerminal(): Promise<void> {
    try {
      const terminalElement = document.getElementById('terminal');
      if (!terminalElement) {
        throw new Error('Terminal element not found');
      }

      // Create terminal instance with clean modern theme
      this.terminal = new Terminal({
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
          // Clean dark theme for better readability
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
      this.fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      this.terminal.loadAddon(this.fitAddon);
      this.terminal.loadAddon(webLinksAddon);

      // Open terminal
      this.terminal.open(terminalElement);

      // Fit terminal to container
      this.fitAddon.fit();

      // Handle terminal resize
      window.addEventListener('resize', () => {
        if (this.fitAddon) {
          this.fitAddon.fit();
        }
      });

      // Create terminal process
      const terminalInfo = await window.electronAPI?.createTerminal();
      if (terminalInfo) {
        // Handle terminal output - WebTerminalManager uses different event format
        window.electronAPI?.onTerminalData(terminalInfo.id, (data: string) => {
          this.terminal?.write(data);
        });

        // Handle user input
        this.terminal.onData(data => {
          window.electronAPI?.writeToTerminal(terminalInfo.id, data);
        });

        // Focus the terminal
        this.terminal.focus();
      } else {
        console.error('❌ Failed to create terminal process');
      }
    } catch (error) {
      console.error('Failed to setup terminal:', error);
      const terminalElement = document.getElementById('terminal');
      if (terminalElement) {
        terminalElement.innerHTML = '<div class="loading">Failed to initialize terminal</div>';
      }
    }
  }

  private async loadExtensions(): Promise<void> {
    try {
      const extensionsList = document.getElementById('extensions-list');
      if (!extensionsList) return;

      const extensions = await window.electronAPI?.getExtensions();

      if (extensions && extensions.length > 0) {
        extensionsList.innerHTML = extensions
          .map(
            ext =>
              `<div style="padding: 4px 0; font-size: 12px; color: #cccccc;">
             ${ext.name} (${ext.version})
           </div>`
          )
          .join('');
      } else {
        extensionsList.innerHTML =
          '<div style="color: #808080; font-size: 12px;">No extensions installed</div>';
      }
    } catch (error) {
      console.error('Failed to load extensions:', error);
    }
  }

  private async applyTheme(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _currentTheme = await window.electronAPI?.getSetting('theme');
      // Theme will be applied via CSS custom properties in full implementation
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }

  private setupCommandPalette(): void {
    try {
      // Initialize command palette
      this.commandPalette = new CommandPalette({
        placeholder: 'Type a command...',
        maxResults: 50,
        fuzzyThreshold: 0.3,
      });
    } catch (error) {
      console.error('Failed to setup command palette:', error);
    }
  }
}

// Global app instance
const app = new AppRenderer();

// Export for debugging
(window as any).app = app;
