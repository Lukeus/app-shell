/**
 * Platform utility for consistent platform detection
 * Works in both Electron renderer and web contexts
 */

export type PlatformType = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * Detects the current platform
 */
export function getPlatform(): PlatformType {
  // Try to get platform info from Electron first
  if (typeof window !== 'undefined' && window.electronAPI?.getPlatformInfo) {
    // This would be async, but we can fall back to sync detection
  }

  // Fallback to navigator platform detection
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform.toLowerCase();

    if (platform.includes('mac') || platform.includes('darwin')) {
      return 'mac';
    }

    if (platform.includes('win')) {
      return 'windows';
    }

    if (platform.includes('linux') || platform.includes('x11')) {
      return 'linux';
    }
  }

  // Final fallback using userAgent
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('mac') || userAgent.includes('darwin')) {
      return 'mac';
    }

    if (userAgent.includes('windows') || userAgent.includes('win')) {
      return 'windows';
    }

    if (userAgent.includes('linux') || userAgent.includes('x11')) {
      return 'linux';
    }
  }

  return 'unknown';
}

/**
 * Check if current platform is macOS
 */
export function isMacOS(): boolean {
  return getPlatform() === 'mac';
}

/**
 * Check if current platform is Windows
 */
export function isWindows(): boolean {
  return getPlatform() === 'windows';
}

/**
 * Check if current platform is Linux
 */
export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

/**
 * Get the appropriate modifier key for the current platform
 * @returns 'meta' for macOS (Cmd key), 'ctrl' for others
 */
export function getModifierKey(): 'meta' | 'ctrl' {
  return isMacOS() ? 'meta' : 'ctrl';
}

/**
 * Get the display name for the modifier key
 * @returns '⌘' for macOS, 'Ctrl' for others
 */
export function getModifierKeyDisplay(): string {
  return isMacOS() ? '⌘' : 'Ctrl';
}

/**
 * Get the full keyboard shortcut display for command palette
 */
export function getCommandPaletteShortcut(): string {
  return `${getModifierKeyDisplay()}+Shift+P`;
}

/**
 * Check if a keyboard event matches the command palette shortcut for the current platform
 */
export function isCommandPaletteShortcut(event: KeyboardEvent): boolean {
  const platform = getPlatform();

  // Check the key
  if (event.key !== 'P' || !event.shiftKey) {
    return false;
  }

  // Check platform-specific modifier
  if (platform === 'mac') {
    return event.metaKey && !event.ctrlKey;
  } else {
    return event.ctrlKey && !event.metaKey;
  }
}
