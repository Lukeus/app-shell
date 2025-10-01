import { Logger } from '../logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxCalls: number; // Maximum calls per window
  keyGenerator?: (event: any, ...args: any[]) => string; // Custom key generator
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Rate limiter for IPC calls to prevent abuse and DoS attacks
 */
export class RateLimiter {
  private logger: Logger;
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.logger = new Logger('RateLimiter');

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be allowed
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First request for this key
      this.limits.set(key, { count: 1, windowStart: now });
      return true;
    }

    // Check if we're in a new window
    if (now - entry.windowStart >= config.windowMs) {
      // New window, reset counter
      entry.count = 1;
      entry.windowStart = now;
      return true;
    }

    // Same window, check if we've exceeded the limit
    if (entry.count >= config.maxCalls) {
      this.logger.warn(`Rate limit exceeded for key: ${key} (${entry.count}/${config.maxCalls})`);
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Get remaining calls for a key
   */
  getRemainingCalls(key: string, config: RateLimitConfig): number {
    const entry = this.limits.get(key);
    if (!entry) return config.maxCalls;

    const now = Date.now();
    if (now - entry.windowStart >= config.windowMs) {
      return config.maxCalls;
    }

    return Math.max(0, config.maxCalls - entry.count);
  }

  /**
   * Get time until window resets
   */
  getResetTime(key: string, config: RateLimitConfig): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    const elapsed = now - entry.windowStart;
    return Math.max(0, config.windowMs - elapsed);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.limits.entries()) {
      // Consider entries expired if they haven't been accessed in the last hour
      if (now - entry.windowStart > 3600000) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.limits.delete(key);
    }

    if (toDelete.length > 0) {
      this.logger.debug(`Cleaned up ${toDelete.length} expired rate limit entries`);
    }
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

/**
 * Default rate limit configurations for different types of operations
 */
export const DEFAULT_RATE_LIMITS = {
  // High-frequency operations
  terminal: { windowMs: 1000, maxCalls: 100 }, // 100 calls per second for terminal operations
  filesystem: { windowMs: 1000, maxCalls: 50 }, // 50 file operations per second

  // Medium-frequency operations
  settings: { windowMs: 1000, maxCalls: 20 }, // 20 settings operations per second
  commands: { windowMs: 1000, maxCalls: 10 }, // 10 command executions per second

  // Low-frequency operations
  extensions: { windowMs: 60000, maxCalls: 10 }, // 10 extension operations per minute
  marketplace: { windowMs: 60000, maxCalls: 30 }, // 30 marketplace operations per minute

  // Very low-frequency operations
  appControl: { windowMs: 60000, maxCalls: 3 }, // 3 app control operations per minute
};

/**
 * Generate rate limit key from IPC event context
 */
export function generateRateLimitKey(event: any, prefix: string): string {
  // In production, could use session ID, user ID, etc.
  // For now, use a combination of sender frame info
  const senderId = event.sender?.id || 'unknown';
  const frameId = event.frameId || 0;
  return `${prefix}:${senderId}:${frameId}`;
}
