export class StatusBarManager {
  private statusBar: HTMLElement;
  private branchStatus: HTMLElement;
  private syncStatus: HTMLElement;
  private problemsStatus: HTMLElement;
  private languageMode: HTMLElement;
  private encoding: HTMLElement;
  private lineEnding: HTMLElement;
  private cursorPosition: HTMLElement;
  private selectionInfo: HTMLElement;

  constructor() {
    this.statusBar = document.getElementById('status-bar') as HTMLElement;
    this.branchStatus = document.getElementById('branch-status') as HTMLElement;
    this.syncStatus = document.getElementById('sync-status') as HTMLElement;
    this.problemsStatus = document.getElementById('problems-status') as HTMLElement;
    this.languageMode = document.getElementById('language-mode') as HTMLElement;
    this.encoding = document.getElementById('encoding') as HTMLElement;
    this.lineEnding = document.getElementById('line-ending') as HTMLElement;
    this.cursorPosition = document.getElementById('cursor-position') as HTMLElement;
    this.selectionInfo = document.getElementById('selection-info') as HTMLElement;

    this.attachEventListeners();
    this.updateInitialStatus();
  }

  private attachEventListeners(): void {
    // Handle status bar item clicks
    if (this.branchStatus) {
      this.branchStatus.addEventListener('click', () => {
        console.log('Branch status clicked');
        // TODO: Show branch picker or Git integration
      });
    }

    if (this.problemsStatus) {
      this.problemsStatus.addEventListener('click', () => {
        console.log('Problems status clicked');
        // TODO: Show problems panel
      });
    }

    if (this.languageMode) {
      this.languageMode.addEventListener('click', () => {
        console.log('Language mode clicked');
        // TODO: Show language selector
      });
    }

    if (this.cursorPosition) {
      this.cursorPosition.addEventListener('click', () => {
        console.log('Cursor position clicked');
        // TODO: Show go to line dialog
      });
    }
  }

  private updateInitialStatus(): void {
    this.updateBranch('main');
    this.updateSync(0, 0);
    this.updateProblems(0);
    this.updateLanguageMode('Plain Text');
    this.updateEncoding('UTF-8');
    this.updateLineEnding('LF');
    this.updateCursorPosition(1, 1);
  }

  public updateBranch(branch: string): void {
    if (this.branchStatus) {
      const textElement = this.branchStatus.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = branch;
      }
    }
  }

  public updateSync(pullCount: number, pushCount: number): void {
    if (this.syncStatus) {
      const textElement = this.syncStatus.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = `${pullCount}↓ ${pushCount}↑`;
      }
    }
  }

  public updateProblems(count: number): void {
    if (this.problemsStatus) {
      const textElement = this.problemsStatus.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = count.toString();
      }
    }
  }

  public updateLanguageMode(language: string): void {
    if (this.languageMode) {
      const textElement = this.languageMode.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = language;
      }
    }
  }

  public updateEncoding(encoding: string): void {
    if (this.encoding) {
      const textElement = this.encoding.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = encoding;
      }
    }
  }

  public updateLineEnding(ending: string): void {
    if (this.lineEnding) {
      const textElement = this.lineEnding.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = ending;
      }
    }
  }

  public updateCursorPosition(line: number, column: number): void {
    if (this.cursorPosition) {
      const textElement = this.cursorPosition.querySelector('.status-text');
      if (textElement) {
        textElement.textContent = `Ln ${line}, Col ${column}`;
      }
    }
  }

  public updateSelection(selectedText: string, selectionCount?: number): void {
    if (this.selectionInfo) {
      const textElement = this.selectionInfo.querySelector('.status-text');
      if (textElement) {
        if (selectedText && selectionCount !== undefined) {
          textElement.textContent = `(${selectionCount} selected)`;
        } else {
          textElement.textContent = '';
        }
      }
    }
  }

  public showMessage(message: string, timeout: number = 3000): void {
    // Create a temporary status message
    const tempStatus = document.createElement('div');
    tempStatus.className = 'status-item temp-message';
    tempStatus.innerHTML = `<span class="status-text">${message}</span>`;

    if (this.statusBar) {
      this.statusBar.appendChild(tempStatus);

      setTimeout(() => {
        if (tempStatus.parentNode) {
          tempStatus.parentNode.removeChild(tempStatus);
        }
      }, timeout);
    }
  }

  // Method to show loading indicator
  public setLoading(isLoading: boolean): void {
    if (this.statusBar) {
      if (isLoading) {
        this.statusBar.classList.add('loading');
      } else {
        this.statusBar.classList.remove('loading');
      }
    }
  }
}
