/**
 * Utility helpers for file display
 */

import { FileType } from '../../types';

/**
 * Extracts file extension from filename.
 *
 * Behavior:
 * - Returns the extension (lowercased) from the last dot for names like "file.txt" -> "txt"
 * - For files that start with a single leading dot and have no other dots (e.g. ".gitignore"),
 *   we treat them as having no extension and return an empty string.
 * - For filenames with no dot or only "." or "..", returns empty string.
 */
export function getFileExtension(filename: string): string {
  const base = filename.split('/').pop() || filename;

  if (base === '.' || base === '..') return '';

  // If there's no dot, or the name is just a dotfile with no other dot, no extension
  if (!base.includes('.')) return '';

  const parts = base.split('.');

  // Handle leading-dot only (e.g. ".gitignore") -> parts = ["", "gitignore"]
  // If there's exactly two parts and the first is empty, that's a leading dot with no extension
  if (base.startsWith('.') && parts.length === 2) return '';

  const ext = parts.pop() || '';
  return ext.toLowerCase();
}

/**
 * Checks if a file is hidden (starts with .) and is not "." or ".."
 */
export function isHiddenFile(filename: string): boolean {
  const base = filename.split('/').pop() || filename;
  return base.startsWith('.') && base !== '.' && base !== '..';
}

/**
 * Gets a human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  // Protect against extremely large numbers by clamping index to sizes length - 1
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);

  const value = bytes / Math.pow(k, i);

  // Use Intl.NumberFormat when available for better formatting, fallback to toFixed
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: value < 10 ? 1 : 0,
    }).format(Number(value.toFixed(value < 10 ? 1 : 0)));
  } catch {
    formatted = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  }

  return `${formatted} ${sizes[i]}`;
}

/**
 * Formats a timestamp to a human-readable date string
 */
export function formatDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Use Intl.DateTimeFormat for localized formatting
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Icon information for file display
 */
export interface FileIconInfo {
  icon: string;
  color: string;
  className?: string;
}

/**
 * Gets an appropriate icon and color for a file based on its name and type
 */
export function getFileIcon(filename: string, type?: FileType): FileIconInfo {
  const ext = getFileExtension(filename);
  const baseName = filename.toLowerCase();

  // Special files by name
  if (baseName === 'package.json') {
    return { icon: '📦', color: '#cb3837' };
  }
  if (baseName === 'readme.md' || baseName === 'readme.txt' || baseName === 'readme') {
    return { icon: '📖', color: '#4078c0' };
  }
  if (baseName === '.gitignore') {
    return { icon: '🚫', color: '#f14e32' };
  }
  if (baseName === 'dockerfile') {
    return { icon: '🐳', color: '#0db7ed' };
  }
  if (baseName === 'license' || baseName === 'license.txt' || baseName === 'license.md') {
    return { icon: '📜', color: '#6cc04a' };
  }

  // Directory
  if (type === FileType.Directory || baseName.endsWith('/')) {
    return { icon: '📁', color: '#dcb67a' };
  }

  // File extensions
  switch (ext) {
    // JavaScript/TypeScript
    case 'js':
      return { icon: '📄', color: '#f7df1e' };
    case 'ts':
      return { icon: '📄', color: '#3178c6' };
    case 'tsx':
    case 'jsx':
      return { icon: '⚛️', color: '#61dafb' };
    case 'json':
      return { icon: '📋', color: '#cbcb41' };

    // Web files
    case 'html':
    case 'htm':
      return { icon: '🌐', color: '#e34c26' };
    case 'css':
      return { icon: '🎨', color: '#1572b6' };
    case 'scss':
    case 'sass':
      return { icon: '🎨', color: '#cc6699' };

    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return { icon: '🖼️', color: '#4caf50' };

    // Documents
    case 'pdf':
      return { icon: '📄', color: '#dc143c' };
    case 'doc':
    case 'docx':
      return { icon: '📝', color: '#2b579a' };
    case 'xls':
    case 'xlsx':
      return { icon: '📊', color: '#217346' };
    case 'ppt':
    case 'pptx':
      return { icon: '📊', color: '#d24726' };

    // Archives
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: '🗜️', color: '#8e8e93' };

    // Code files
    case 'py':
      return { icon: '🐍', color: '#3776ab' };
    case 'java':
      return { icon: '☕', color: '#ed8b00' };
    case 'cpp':
    case 'c':
    case 'h':
      return { icon: '⚙️', color: '#00599c' };
    case 'cs':
      return { icon: '🔷', color: '#239120' };
    case 'php':
      return { icon: '🐘', color: '#777bb4' };
    case 'rb':
      return { icon: '💎', color: '#cc342d' };
    case 'go':
      return { icon: '🐹', color: '#00add8' };
    case 'rs':
      return { icon: '🦀', color: '#dea584' };

    // Markup/Config
    case 'md':
    case 'markdown':
      return { icon: '📝', color: '#083fa1' };
    case 'xml':
      return { icon: '📄', color: '#ff6600' };
    case 'yaml':
    case 'yml':
      return { icon: '⚙️', color: '#cb171e' };
    case 'toml':
      return { icon: '⚙️', color: '#9c4221' };
    case 'ini':
    case 'cfg':
    case 'conf':
      return { icon: '⚙️', color: '#6e6e6e' };

    // Text files
    case 'txt':
    case 'text':
      return { icon: '📄', color: '#89e051' };
    case 'log':
      return { icon: '📄', color: '#ff9500' };

    // Default for unknown files
    default:
      return { icon: '📄', color: '#6e6e6e' };
  }
}
