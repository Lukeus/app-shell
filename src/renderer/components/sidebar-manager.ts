interface SidebarView {
  id: string;
  title: string;
  element: HTMLElement;
}

export class SidebarManager {
  private sidebar: HTMLElement;
  private activityBar: HTMLElement;
  private sidebarTitle: HTMLElement;
  private views: Map<string, SidebarView> = new Map();
  private currentView: string = 'extensions';
  private isCollapsed: boolean = false;
  private onViewChange?: (viewId: string) => void;

  constructor() {
    this.sidebar = document.getElementById('sidebar') as HTMLElement;
    this.activityBar = document.querySelector('.activity-bar') as HTMLElement;
    this.sidebarTitle = document.getElementById('sidebar-title') as HTMLElement;

    this.initializeViews();
    this.attachEventListeners();
    this.loadState();
  }

  private initializeViews(): void {
    const viewConfigs = [
      { id: 'explorer', title: 'Explorer' },
      { id: 'extensions', title: 'Extensions' },
      { id: 'marketplace', title: 'Marketplace' },
      { id: 'settings', title: 'Settings' },
    ];

    viewConfigs.forEach(config => {
      const element = document.getElementById(`${config.id}-view`) as HTMLElement;
      if (element) {
        this.views.set(config.id, {
          id: config.id,
          title: config.title,
          element,
        });
      }
    });
  }

  private attachEventListeners(): void {
    // Activity bar item clicks - VS Code style behavior
    this.activityBar.querySelectorAll('.activity-item[data-view]').forEach(item => {
      item.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const viewId = target.dataset.view;

        if (viewId) {
          // VS Code behavior: if clicking the same view and sidebar is open, toggle it
          if (viewId === this.currentView && !this.isCollapsed) {
            this.toggle();
          } else {
            // Otherwise, show the view (and expand if collapsed)
            this.showView(viewId);
          }
        }
      });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        this.toggle();
      });
    }

    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        this.collapse();
      });
    }

    // Refresh button for extensions
    const refreshBtn = document.getElementById('refresh-extensions');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.onViewChange) {
          this.onViewChange('extensions-refresh');
        }
      });
    }

    // Settings controls
    this.setupSettingsControls();

    // TODO: Add keyboard shortcuts
    // Cmd+B / Ctrl+B: Toggle sidebar
    // Cmd+Shift+E / Ctrl+Shift+E: Show Extensions
    // Cmd+Shift+X / Ctrl+Shift+X: Show Marketplace
    // Cmd+, / Ctrl+,: Show Settings
  }

  private setupSettingsControls(): void {
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    const fontSizeInput = document.getElementById('font-size') as HTMLInputElement;

    if (themeSelect) {
      themeSelect.addEventListener('change', async () => {
        try {
          await window.electronAPI?.applyTheme(themeSelect.value);
        } catch (error) {
          console.error('Failed to apply theme:', error);
        }
      });

      // Load current theme
      this.loadCurrentTheme(themeSelect);
    }

    if (fontSizeInput) {
      fontSizeInput.addEventListener('change', () => {
        // This would integrate with terminal settings
        console.log('Font size changed to:', fontSizeInput.value);
      });
    }
  }

  private async loadCurrentTheme(select: HTMLSelectElement): Promise<void> {
    try {
      const currentTheme = (await window.electronAPI?.getSetting('theme')) || 'builtin.dark';
      select.value = currentTheme;
    } catch (error) {
      console.error('Failed to load current theme:', error);
    }
  }

  public showView(viewId: string): void {
    const view = this.views.get(viewId);
    if (!view) {
      console.warn(`View not found: ${viewId}`);
      return;
    }

    // Update current view
    this.currentView = viewId;

    // Update activity bar active state
    this.updateActivityBarState();

    // Update sidebar title
    this.sidebarTitle.textContent = view.title;

    // Show the correct view and hide others
    this.views.forEach(v => {
      if (v.id === viewId) {
        v.element.style.display = 'block';
      } else {
        v.element.style.display = 'none';
      }
    });

    // VS Code behavior: Always expand sidebar when switching to a different view
    // This ensures that when you click on a different activity bar item, the sidebar opens
    if (this.isCollapsed) {
      this.expand();
    }

    // Notify about view change
    if (this.onViewChange) {
      this.onViewChange(viewId);
    }

    // Save state
    this.saveState();
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

    this.sidebar.classList.remove('collapsed');
    this.isCollapsed = false;

    // Update toggle icon
    const toggleIcon = document.querySelector('#sidebar-toggle .activity-icon');
    if (toggleIcon) {
      toggleIcon.textContent = '◀';
    }

    // Ensure activity bar shows correct active state
    this.updateActivityBarState();

    this.saveState();
  }

  public collapse(): void {
    if (this.isCollapsed) return;

    this.sidebar.classList.add('collapsed');
    this.isCollapsed = true;

    // Update toggle icon
    const toggleIcon = document.querySelector('#sidebar-toggle .activity-icon');
    if (toggleIcon) {
      toggleIcon.textContent = '▶';
    }

    // Keep the active activity bar item highlighted even when collapsed
    // This matches VS Code behavior where the active view indicator remains visible
    this.updateActivityBarState();

    this.saveState();
  }

  public getCurrentView(): string {
    return this.currentView;
  }

  public isCollapsedState(): boolean {
    return this.isCollapsed;
  }

  public onViewChangeCallback(callback: (viewId: string) => void): void {
    this.onViewChange = callback;
  }

  public getViewElement(viewId: string): HTMLElement | null {
    const view = this.views.get(viewId);
    return view ? view.element : null;
  }

  private saveState(): void {
    const state = {
      currentView: this.currentView,
      isCollapsed: this.isCollapsed,
    };

    try {
      localStorage.setItem('sidebar-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  }

  private loadState(): void {
    try {
      const savedState = localStorage.getItem('sidebar-state');
      if (savedState) {
        const state = JSON.parse(savedState);

        // Apply collapsed state
        if (state.isCollapsed) {
          this.sidebar.classList.add('collapsed');
          this.isCollapsed = true;
          const toggleIcon = document.querySelector('#sidebar-toggle .activity-icon');
          if (toggleIcon) {
            toggleIcon.textContent = '▶';
          }
        }

        // Show the saved view
        this.showView(state.currentView || 'extensions');
      } else {
        // Default to extensions view
        this.showView('extensions');
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
      this.showView('extensions');
    }
  }

  public resetToDefault(): void {
    this.showView('extensions');
    this.expand();
  }

  private updateActivityBarState(): void {
    // Update activity bar active state to reflect current view
    this.activityBar.querySelectorAll('.activity-item[data-view]').forEach(item => {
      const itemViewId = (item as HTMLElement).dataset.view;
      item.classList.toggle('active', itemViewId === this.currentView);
    });
  }
}
