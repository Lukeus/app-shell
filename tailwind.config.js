/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        vscode: {
          'bg-primary': 'var(--color-vscode-bg-primary)',
          'bg-secondary': 'var(--color-vscode-bg-secondary)',
          'bg-tertiary': 'var(--color-vscode-bg-tertiary)',
          'bg-quaternary': 'var(--color-vscode-bg-quaternary)',
          'fg-primary': 'var(--color-vscode-fg-primary)',
          'fg-secondary': 'var(--color-vscode-fg-secondary)',
          'fg-muted': 'var(--color-vscode-fg-muted)',
          'fg-disabled': 'var(--color-vscode-fg-disabled)',
          'accent-blue': 'var(--color-vscode-accent-blue)',
          'accent-blue-dark': 'var(--color-vscode-accent-blue-dark)',
          'accent-blue-hover': 'var(--color-vscode-accent-blue-hover)',
          border: 'var(--color-vscode-border)',
          'input-bg': 'var(--color-vscode-input-bg)',
          'input-border': 'var(--color-vscode-input-border)',
        },
        terminal: {
          bg: 'var(--color-terminal-bg)',
          fg: 'var(--color-terminal-fg)',
          cursor: 'var(--color-terminal-cursor)',
          selection: 'var(--color-terminal-selection)',
        },
      },
      fontFamily: {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
      },
      fontSize: {
        xxs: 'var(--font-size-xxs)',
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
      },
      spacing: {
        18: 'var(--spacing-18)',
        22: 'var(--spacing-22)',
      },
      height: {
        'title-bar': 'var(--height-title-bar)',
        'status-bar': 'var(--height-status-bar)',
        'sidebar-header': 'var(--height-sidebar-header)',
        'panel-header': 'var(--height-panel-header)',
        'activity-item': 'var(--height-activity-item)',
      },
      width: {
        'activity-bar': 'var(--width-activity-bar)',
        sidebar: 'var(--width-sidebar)',
      },
    },
  },
  plugins: [],
};
