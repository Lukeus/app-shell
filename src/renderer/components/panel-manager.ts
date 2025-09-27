export class PanelManager {
  private panel: HTMLElement;
  private toggleButton: HTMLElement;
  private panelContent: HTMLElement;
  private resizeHandle: HTMLElement;
  private isCollapsed: boolean = true; // Default to collapsed like VS Code
  private defaultHeight: number = 300;
  private onToggle?: (isCollapsed: boolean) => void;

  constructor() {
    this.panel = document.getElementById('bottom-panel') as HTMLElement;
    this.toggleButton = document.getElementById('panel-toggle') as HTMLElement;
    this.panelContent = document.querySelector('.panel-content') as HTMLElement;
    this.resizeHandle = document.getElementById('panel-resize-handle') as HTMLElement;

    // Ensure initial state is properly set
    this.isCollapsed = true;
    this.panel.classList.add('collapsed');

    this.attachEventListeners();
    this.loadState();

    // Delay terminal size update to ensure DOM is ready
    setTimeout(() => {
      this.updateTerminalSize();
    }, 100);
  }

  private attachEventListeners(): void {
    // Toggle button click
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', e => {
        e.preventDefault();
        this.toggle();
      });
    }

    // Panel tab clicks (also show panel if collapsed)
    const panelTabs = document.querySelectorAll('.panel-tab');
    panelTabs.forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();

        // If panel is collapsed, expand it when clicking a tab
        if (this.isCollapsed) {
          this.expand();
        }

        // Handle tab switching
        this.switchTab(tab as HTMLElement);
      });
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      if (!this.isCollapsed) {
        this.updateTerminalSize();
      }
    });

    // Keyboard shortcuts (future enhancement)
    // Ctrl+` or Cmd+` to toggle panel
    document.addEventListener('keydown', e => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  private switchTab(clickedTab: HTMLElement): void {
    // Update active tab
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    clickedTab.classList.add('active');

    // TODO: Switch content based on tab
    const tabId = clickedTab.id;
    if (tabId === 'terminal-tab') {
      // Show terminal (already visible by default)
      this.updateTerminalSize();
    } else if (tabId === 'output-tab') {
      // TODO: Show output content
      console.log('Output tab selected');
    }
  }

  public toggle(): void {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  public expand(): void {
    if (!this.isCollapsed) return;

    this.isCollapsed = false;
    this.panel.classList.remove('collapsed');

    // Restore height
    this.panel.style.height = `${this.defaultHeight}px`;

    // Update terminal size after animation
    setTimeout(() => {
      this.updateTerminalSize();
    }, 300); // Match CSS transition duration

    this.saveState();

    if (this.onToggle) {
      this.onToggle(this.isCollapsed);
    }
  }

  public collapse(): void {
    if (this.isCollapsed) return;

    this.isCollapsed = true;
    this.panel.classList.add('collapsed');

    // Force height to collapsed state
    this.panel.style.height = '32px';

    this.saveState();

    if (this.onToggle) {
      this.onToggle(this.isCollapsed);
    }
  }

  public isCollapsedState(): boolean {
    return this.isCollapsed;
  }

  public setHeight(height: number): void {
    if (!this.isCollapsed && height >= 100 && height <= 600) {
      this.defaultHeight = height;
      this.panel.style.height = `${height}px`;
      this.updateTerminalSize();
      this.saveState();
    }
  }

  public getHeight(): number {
    return this.isCollapsed ? 32 : this.defaultHeight;
  }

  public onToggleCallback(callback: (isCollapsed: boolean) => void): void {
    this.onToggle = callback;
  }

  private updateTerminalSize(): void {
    // Notify that terminal should be resized
    // This will be handled by the main app renderer
    const event = new CustomEvent('panel-resize', {
      detail: {
        isCollapsed: this.isCollapsed,
        height: this.getHeight(),
      },
    });
    document.dispatchEvent(event);
  }

  private saveState(): void {
    const state = {
      isCollapsed: this.isCollapsed,
      height: this.defaultHeight,
    };

    try {
      localStorage.setItem('panel-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save panel state:', error);
    }
  }

  private loadState(): void {
    try {
      const savedState = localStorage.getItem('panel-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.defaultHeight = state.height || 300;

        // Apply saved state
        if (state.isCollapsed !== undefined) {
          if (state.isCollapsed) {
            this.collapse();
          } else {
            this.expand();
          }
        } else {
          // Default to collapsed like VS Code
          this.collapse();
        }
      } else {
        // Default to collapsed on first load
        this.collapse();
      }
    } catch (error) {
      console.error('Failed to load panel state:', error);
      // Default to collapsed on error
      this.collapse();
    }
  }

  public resetToDefault(): void {
    this.defaultHeight = 300;
    this.collapse(); // VS Code defaults to collapsed
  }

  // Method to show panel programmatically (for commands)
  public show(): void {
    this.expand();
  }

  // Method to hide panel programmatically (for commands)
  public hide(): void {
    this.collapse();
  }
}
