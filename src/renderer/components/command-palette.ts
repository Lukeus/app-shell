/**
 * Command Palette Component
 *
 * VS Code-style command palette with fuzzy search, keyboard navigation,
 * and extensible command registration.
 */

import { Command } from '../../types';

interface CommandPaletteOptions {
  placeholder?: string;
  maxResults?: number;
  fuzzyThreshold?: number;
}

interface CommandPaletteItem extends Command {
  score?: number;
  highlighted?: string;
}

export class CommandPalette {
  private element!: HTMLElement;
  private overlay!: HTMLElement;
  private input!: HTMLInputElement;
  private resultsList!: HTMLElement;
  private commands: Command[] = [];
  private filteredCommands: CommandPaletteItem[] = [];
  private selectedIndex = 0;
  private isVisible = false;
  private options: CommandPaletteOptions;

  constructor(options: CommandPaletteOptions = {}) {
    this.options = {
      placeholder: 'Type a command...',
      maxResults: 50,
      fuzzyThreshold: 0.3,
      ...options,
    };

    this.createElement();
    this.setupEventListeners();
    this.loadCommands();
  }

  private createElement(): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'command-palette-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.4);
      display: none;
      z-index: 10000;
      backdrop-filter: blur(2px);
    `;

    // Create command palette container
    this.element = document.createElement('div');
    this.element.className = 'command-palette';
    this.element.style.cssText = `
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      max-width: 90vw;
      background-color: var(--panel-background, #252526);
      border: 1px solid var(--app-border, #2d2d30);
      border-radius: 6px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create input
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = this.options.placeholder!;
    this.input.className = 'command-palette-input';
    this.input.style.cssText = `
      width: 100%;
      padding: 16px 20px;
      border: none;
      outline: none;
      background-color: transparent;
      color: var(--app-foreground, #d4d4d4);
      font-size: 16px;
      border-bottom: 1px solid var(--app-border, #2d2d30);
    `;

    // Create results list
    this.resultsList = document.createElement('div');
    this.resultsList.className = 'command-results';
    this.resultsList.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--app-border, #2d2d30) transparent;
    `;

    // Assemble the component
    this.element.appendChild(this.input);
    this.element.appendChild(this.resultsList);
    this.overlay.appendChild(this.element);
    document.body.appendChild(this.overlay);
  }

  private setupEventListeners(): void {
    // Global keyboard shortcut (Cmd/Ctrl + Shift + P)
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Input events
    this.input.addEventListener('input', () => {
      this.filterCommands();
    });

    this.input.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          this.executeSelected();
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
      }
    });

    // Click outside to close
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Results list click events
    this.resultsList.addEventListener('click', e => {
      const item = (e.target as Element).closest('.command-item');
      if (item) {
        const index = parseInt(item.getAttribute('data-index') || '0', 10);
        this.selectedIndex = index;
        this.executeSelected();
      }
    });
  }

  private async loadCommands(): Promise<void> {
    try {
      // Load commands from the main process via IPC
      this.commands = (await window.electronAPI?.getAllCommands()) || [];
      this.filterCommands();
    } catch (error) {
      console.error('Failed to load commands:', error);
    }
  }

  private filterCommands(): void {
    const query = this.input.value.trim().toLowerCase();

    if (!query) {
      // Show all commands when no query
      this.filteredCommands = this.commands.map(cmd => ({ ...cmd }));
    } else {
      // Fuzzy search implementation
      const scoredCommands = this.commands
        .map(command => {
          const score = this.fuzzyScore(query, command);
          if (score > this.options.fuzzyThreshold!) {
            return {
              ...command,
              score,
              highlighted: this.highlightMatch(command, query),
            } as CommandPaletteItem;
          }
          return null;
        })
        .filter((item): item is CommandPaletteItem => item !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, this.options.maxResults!);

      this.filteredCommands = scoredCommands;
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  private fuzzyScore(query: string, command: Command): number {
    const searchText =
      `${command.title} ${command.category || ''} ${command.command}`.toLowerCase();
    const queryChars = query.split('');
    let score = 0;
    let lastIndex = -1;
    let consecutiveBonus = 0;

    for (const char of queryChars) {
      const index = searchText.indexOf(char, lastIndex + 1);
      if (index === -1) return 0;

      // Base score for character match
      score += 1;

      // Bonus for consecutive characters
      if (index === lastIndex + 1) {
        consecutiveBonus++;
        score += consecutiveBonus;
      } else {
        consecutiveBonus = 0;
      }

      // Bonus for word boundary matches
      if (index === 0 || searchText[index - 1] === ' ') {
        score += 2;
      }

      lastIndex = index;
    }

    // Normalize score by search text length
    return score / searchText.length;
  }

  private highlightMatch(command: Command, query: string): string {
    const title = command.title;
    const lowerTitle = title.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let result = '';
    let lastIndex = 0;
    let queryIndex = 0;

    for (let i = 0; i < lowerTitle.length && queryIndex < lowerQuery.length; i++) {
      if (lowerTitle[i] === lowerQuery[queryIndex]) {
        if (i > lastIndex) {
          result += title.substring(lastIndex, i);
        }
        result += `<mark class="command-highlight">${title[i]}</mark>`;
        lastIndex = i + 1;
        queryIndex++;
      }
    }

    if (lastIndex < title.length) {
      result += title.substring(lastIndex);
    }

    return result;
  }

  private renderResults(): void {
    this.resultsList.innerHTML = '';

    if (this.filteredCommands.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'command-palette-no-results';
      noResults.textContent = 'No commands found';
      noResults.style.cssText = `
        padding: 20px;
        text-align: center;
        color: var(--app-foreground, #888);
        font-style: italic;
      `;
      this.resultsList.appendChild(noResults);
      return;
    }

    this.filteredCommands.forEach((command, index) => {
      const item = document.createElement('div');
      item.className = `command-item ${index === this.selectedIndex ? 'selected' : ''}`;
      item.setAttribute('data-index', index.toString());

      item.style.cssText = `
        padding: 12px 20px;
        cursor: pointer;
        border-left: 3px solid transparent;
        transition: background-color 0.1s ease;
        ${
          index === this.selectedIndex
            ? `
          background-color: var(--button-background, #0e639c);
          border-left-color: var(--button-background, #0e639c);
          color: var(--button-foreground, #ffffff);
        `
            : ''
        }
      `;

      const titleEl = document.createElement('div');
      titleEl.className = 'command-title';
      titleEl.innerHTML = command.highlighted || command.title;
      titleEl.style.cssText = `
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 4px;
      `;

      const detailsEl = document.createElement('div');
      detailsEl.className = 'command-details';
      detailsEl.style.cssText = `
        font-size: 12px;
        opacity: 0.8;
        display: flex;
        justify-content: space-between;
      `;

      const categoryEl = document.createElement('span');
      categoryEl.textContent = command.category || 'General';

      const commandIdEl = document.createElement('span');
      commandIdEl.textContent = command.command;
      commandIdEl.style.fontFamily = 'monospace';

      detailsEl.appendChild(categoryEl);
      detailsEl.appendChild(commandIdEl);

      item.appendChild(titleEl);
      item.appendChild(detailsEl);

      // Hover effects
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.resultsList.appendChild(item);
    });

    // Add CSS for highlighting
    this.addHighlightStyles();
  }

  private addHighlightStyles(): void {
    const styleId = 'command-palette-highlight-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .command-highlight {
        background-color: var(--button-background, #0e639c);
        color: var(--button-foreground, #ffffff);
        padding: 1px 2px;
        border-radius: 2px;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  private updateSelection(): void {
    const items = this.resultsList.querySelectorAll('.command-item');
    items.forEach((item, index) => {
      const element = item as HTMLElement;
      if (index === this.selectedIndex) {
        element.classList.add('selected');
        element.style.backgroundColor = 'var(--button-background, #0e639c)';
        element.style.borderLeftColor = 'var(--button-background, #0e639c)';
        element.style.color = 'var(--button-foreground, #ffffff)';
        element.scrollIntoView({ block: 'nearest' });
      } else {
        element.classList.remove('selected');
        element.style.backgroundColor = '';
        element.style.borderLeftColor = 'transparent';
        element.style.color = '';
      }
    });
  }

  private selectNext(): void {
    if (this.selectedIndex < this.filteredCommands.length - 1) {
      this.selectedIndex++;
      this.updateSelection();
    }
  }

  private selectPrevious(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelection();
    }
  }

  private async executeSelected(): Promise<void> {
    const selectedCommand = this.filteredCommands[this.selectedIndex];
    if (!selectedCommand) return;

    this.hide();

    try {
      await window.electronAPI?.executeCommand(selectedCommand.command);
    } catch (error) {
      console.error('Failed to execute command:', error);
      // Show error notification
      this.showError(`Failed to execute command: ${selectedCommand.title}`);
    }
  }

  private showError(message: string): void {
    // Simple error toast - can be enhanced later
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  public show(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.overlay.style.display = 'block';
    this.input.value = '';
    this.loadCommands(); // Refresh commands
    this.input.focus();

    // Animate in
    requestAnimationFrame(() => {
      this.element.style.opacity = '0';
      this.element.style.transform = 'translateX(-50%) translateY(-20px)';
      this.element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

      requestAnimationFrame(() => {
        this.element.style.opacity = '1';
        this.element.style.transform = 'translateX(-50%) translateY(0)';
      });
    });
  }

  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    this.element.style.opacity = '0';
    this.element.style.transform = 'translateX(-50%) translateY(-20px)';

    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.input.blur();
    }, 200);
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public refresh(): void {
    this.loadCommands();
  }

  public dispose(): void {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
