/**
 * Command Registration Type Definitions
 *
 * Types for registering and handling commands in the app,
 * including command registration, execution, and keybindings.
 */

/**
 * Represents a command that can be registered and executed
 * through the command palette or keyboard shortcuts.
 */
export interface CommandRegistration {
  /**
   * Unique identifier for the command
   * Format should be: [namespace].[action]
   * e.g., "editor.formatDocument", "terminal.newTab", "extensions.install"
   */
  command: string;

  /**
   * User-friendly display title for the command
   */
  title: string;

  /**
   * Optional category for grouping commands
   * e.g., "File", "Edit", "View", "Terminal", "Extensions"
   */
  category?: string;

  /**
   * Optional keyboard shortcut for the command
   * Format: combination of keys separated by '+'
   * e.g., "Ctrl+Shift+P", "Cmd+K", "Alt+F4"
   *
   * For cross-platform support, use "Mod" instead of "Ctrl"/"Cmd"
   * e.g., "Mod+S" (Ctrl+S on Windows/Linux, Cmd+S on macOS)
   */
  keybinding?: string;

  /**
   * Optional icon identifier for visual representation
   */
  icon?: string;

  /**
   * Whether the command should be hidden from command palette
   * Default: false
   */
  hidden?: boolean;

  /**
   * Optional unique ID of the extension that registered this command
   * Built-in commands will not have this property
   */
  extensionId?: string;
}

/**
 * Command execution context passed to command handlers
 */
export interface CommandContext {
  /**
   * The command being executed
   */
  command: string;

  /**
   * Optional arguments for the command
   */
  args?: any;

  /**
   * Source that triggered the command
   * e.g., "palette", "keybinding", "menu", "api"
   */
  source?: string;
}

/**
 * Command handler function type
 */
export type CommandHandler = (context: CommandContext) => Promise<any> | any;

/**
 * Keybinding representation
 */
export interface Keybinding {
  /**
   * The command to execute
   */
  command: string;

  /**
   * Key combination to trigger the command
   * Format: combination of keys separated by '+'
   * e.g., "Ctrl+Shift+P", "Cmd+K", "Alt+F4"
   */
  key: string;

  /**
   * Optional when condition for the keybinding
   * e.g., "editorFocus", "terminalFocus"
   */
  when?: string;

  /**
   * Optional weight for keybinding conflicts
   * Higher weights take precedence
   */
  weight?: number;
}
