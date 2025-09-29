/**
 * Utility helpers for file display
 */

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