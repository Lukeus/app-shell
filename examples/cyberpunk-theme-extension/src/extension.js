/**
 * Cyberpunk Theme Extension
 *
 * This extension demonstrates advanced theming capabilities including:
 * - Multiple theme variations
 * - Dynamic theme switching
 * - Custom commands and settings
 * - UI/UX enhancements
 */

// Extension state
let isGlitchEnabled = false;
let currentThemeIndex = 0;
const themes = ['cyberpunk-neon', 'cyberpunk-matrix', 'cyberpunk-blade-runner'];

// Available through the extension API injected by the app
let appShell;

/**
 * Extension activation function
 * Called when the extension is activated
 */
function activate(context) {
  console.log('🚀 Cyberpunk Theme Extension activated!');

  // Store reference to extension API
  if (typeof module !== 'undefined' && module.exports && module.exports.appShell) {
    appShell = module.exports.appShell;
  }

  // Initialize extension
  initializeExtension(context);

  // Register commands
  registerCommands(context);

  // Setup settings listeners
  setupSettings(context);

  // Apply initial theme if configured
  applyInitialTheme();

  console.log('✨ Cyberpunk themes loaded successfully!');
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
function deactivate() {
  console.log('🔌 Cyberpunk Theme Extension deactivated');

  // Clean up any resources
  if (isGlitchEnabled) {
    toggleGlitchEffect();
  }

  // Remove any injected styles
  removeCustomStyles();
}

/**
 * Initialize the extension
 */
function initializeExtension(context) {
  // Load settings
  loadSettings();

  // Apply any custom CSS if needed
  injectCustomStyles();

  // Show welcome message on first activation
  if (isFirstActivation()) {
    showWelcomeMessage();
  }
}

/**
 * Register extension commands
 */
function registerCommands(context) {
  // Register toggle glitch effect command
  if (appShell?.commands?.registerCommand) {
    const glitchDisposable = appShell.commands.registerCommand(
      'toggleGlitchEffect',
      toggleGlitchEffect,
      'Toggle Glitch Effect',
      'Cyberpunk Theme'
    );
    context.subscriptions.push(glitchDisposable);
  }

  // Register cycle themes command
  if (appShell?.commands?.registerCommand) {
    const cycleDisposable = appShell.commands.registerCommand(
      'cycleThemes',
      cycleThemes,
      'Cycle Cyberpunk Themes',
      'Cyberpunk Theme'
    );
    context.subscriptions.push(cycleDisposable);
  }

  // Register about command
  if (appShell?.commands?.registerCommand) {
    const aboutDisposable = appShell.commands.registerCommand(
      'showAbout',
      showAbout,
      'About Cyberpunk Theme',
      'Cyberpunk Theme'
    );
    context.subscriptions.push(aboutDisposable);
  }
}

/**
 * Setup settings monitoring
 */
function setupSettings(context) {
  // Monitor settings changes if available
  if (appShell?.workspace?.getConfiguration) {
    const config = appShell.workspace.getConfiguration('cyberpunk');

    // Load initial settings
    isGlitchEnabled = config.get('glitchEffect', false);

    // Note: In a full implementation, you'd set up watchers for setting changes
  }
}

/**
 * Load extension settings
 */
function loadSettings() {
  try {
    if (appShell?.workspace?.getConfiguration) {
      const config = appShell.workspace.getConfiguration('cyberpunk');
      isGlitchEnabled = config.get('glitchEffect', false);
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
}

/**
 * Apply initial theme based on configuration
 */
function applyInitialTheme() {
  // This would typically check user preferences and apply the appropriate theme
  console.log('🎨 Cyberpunk themes ready for activation');
}

/**
 * Toggle glitch effect
 */
function toggleGlitchEffect() {
  isGlitchEnabled = !isGlitchEnabled;

  if (isGlitchEnabled) {
    enableGlitchEffect();
    showMessage('Glitch effect enabled! 👾');
  } else {
    disableGlitchEffect();
    showMessage('Glitch effect disabled');
  }

  // Save setting
  if (appShell?.workspace?.getConfiguration) {
    const config = appShell.workspace.getConfiguration('cyberpunk');
    config.update('glitchEffect', isGlitchEnabled);
  }
}

/**
 * Cycle through available themes
 */
function cycleThemes() {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const themeName = themes[currentThemeIndex];

  // Apply theme (this would use the theme API)
  if (appShell?.commands?.executeCommand) {
    appShell.commands.executeCommand('workbench.action.selectTheme', themeName);
  }

  showMessage(`Switched to ${getThemeDisplayName(themeName)} 🌈`);
}

/**
 * Show about dialog
 */
function showAbout() {
  const message = `
🚀 Cyberpunk Theme Collection v1.0.0

A futuristic theme pack featuring:
• Cyberpunk Neon - Bright neon colors with pink/cyan accents
• Cyberpunk Matrix - Classic green matrix-style theme  
• Cyberpunk Blade Runner - Warm amber/red retro-futuristic theme

Features:
✨ Dynamic theme switching
👾 Optional glitch effects
🎮 Cyberpunk aesthetics
⌨️ Custom keybindings

Created by Theme Studio
    `.trim();

  if (appShell?.window?.showInformationMessage) {
    appShell.window.showInformationMessage(message);
  } else {
    console.log(message);
  }
}

/**
 * Enable glitch effect
 */
function enableGlitchEffect() {
  const glitchCSS = `
        @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
        }
        
        .cyberpunk-glitch {
            animation: glitch 0.3s infinite;
        }
        
        .cyberpunk-glitch::before {
            content: attr(data-text);
            position: absolute;
            left: -2px;
            text-shadow: -2px 0 #ff0080;
            animation: glitch 0.15s infinite reverse;
        }
        
        .cyberpunk-glitch::after {
            content: attr(data-text);
            position: absolute;
            left: 2px;
            text-shadow: 2px 0 #00ffff;
            animation: glitch 0.1s infinite;
        }
    `;

  injectCSS('cyberpunk-glitch', glitchCSS);
}

/**
 * Disable glitch effect
 */
function disableGlitchEffect() {
  removeCSS('cyberpunk-glitch');
}

/**
 * Inject custom styles
 */
function injectCustomStyles() {
  const customCSS = `
        /* Cyberpunk custom enhancements */
        .cyberpunk-theme-active {
            --cyberpunk-glow: 0 0 10px currentColor;
        }
        
        .cyberpunk-theme-active button:hover {
            box-shadow: var(--cyberpunk-glow);
        }
        
        .cyberpunk-theme-active input:focus {
            box-shadow: var(--cyberpunk-glow);
        }
    `;

  injectCSS('cyberpunk-base', customCSS);
}

/**
 * Remove custom styles
 */
function removeCustomStyles() {
  removeCSS('cyberpunk-base');
  removeCSS('cyberpunk-glitch');
}

/**
 * Inject CSS into the page
 */
function injectCSS(id, css) {
  // In a real extension, this would inject CSS into the app
  // For this example, we'll just log it
  console.log(`Injecting CSS [${id}]:`, css);
}

/**
 * Remove CSS from the page
 */
function removeCSS(id) {
  console.log(`Removing CSS [${id}]`);
}

/**
 * Get theme display name
 */
function getThemeDisplayName(themeId) {
  const names = {
    'cyberpunk-neon': 'Cyberpunk Neon',
    'cyberpunk-matrix': 'Cyberpunk Matrix',
    'cyberpunk-blade-runner': 'Cyberpunk Blade Runner',
  };
  return names[themeId] || themeId;
}

/**
 * Show message to user
 */
function showMessage(message) {
  if (appShell?.window?.showInformationMessage) {
    appShell.window.showInformationMessage(message);
  } else {
    console.log('📢', message);
  }
}

/**
 * Check if this is the first activation
 */
function isFirstActivation() {
  // In a real extension, this would check persistent storage
  return !localStorage.getItem('cyberpunk-theme-activated');
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
  showMessage('Welcome to Cyberpunk Theme Collection! 🚀 Use Ctrl+Shift+Alt+C to cycle themes.');
  localStorage.setItem('cyberpunk-theme-activated', 'true');
}

// Export the activation and deactivation functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    activate,
    deactivate,
    // Expose functions for command handlers
    toggleGlitchEffect,
    cycleThemes,
    showAbout,
  };
}
