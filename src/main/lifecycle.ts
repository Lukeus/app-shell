/**
 * Standard lifecycle interface for all application managers
 * Ensures consistent initialization and cleanup patterns
 */
export interface Lifecycle {
  /**
   * Initialize the manager - called during application startup
   * Should be idempotent and handle errors gracefully
   */
  init(): Promise<void>;

  /**
   * Dispose of the manager - called during application shutdown
   * Should clean up resources, close connections, save state
   * Should be safe to call multiple times
   */
  dispose(): Promise<void> | void;
}

/**
 * Optional lifecycle events for more granular control
 */
export interface ExtendedLifecycle extends Lifecycle {
  /**
   * Called before application becomes ready
   */
  preInit?(): Promise<void>;

  /**
   * Called after application is fully initialized
   */
  postInit?(): Promise<void>;

  /**
   * Called before dispose to allow graceful shutdown
   */
  preDispose?(): Promise<void>;
}

/**
 * Lifecycle orchestrator for managing multiple managers
 */
export class LifecycleOrchestrator {
  private managers: Map<string, Lifecycle> = new Map();
  private initOrder: string[] = [];
  private disposed = false;

  /**
   * Register a manager with optional priority for initialization order
   */
  register(name: string, manager: Lifecycle, priority = 0): void {
    if (this.disposed) {
      throw new Error('Cannot register managers after disposal');
    }

    this.managers.set(name, manager);

    // Insert in priority order (higher priority first)
    const insertIndex = this.initOrder.findIndex(existing => {
      const existingPriority = this.getPriority(existing);
      return priority > existingPriority;
    });

    if (insertIndex === -1) {
      this.initOrder.push(name);
    } else {
      this.initOrder.splice(insertIndex, 0, name);
    }
  }

  /**
   * Initialize all registered managers in priority order
   */
  async initAll(): Promise<void> {
    if (this.disposed) {
      throw new Error('Cannot initialize after disposal');
    }

    const errors: Array<{ name: string; error: Error }> = [];

    for (const name of this.initOrder) {
      const manager = this.managers.get(name);
      if (!manager) continue;

      try {
        await manager.init();
        console.log(`✓ Initialized ${name}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ name, error: err });
        console.error(`✗ Failed to initialize ${name}:`, err.message);
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.map(e => `${e.name}: ${e.error.message}`).join('; ');
      throw new Error(`Manager initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Dispose all managers in reverse order
   */
  async disposeAll(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    const errors: Array<{ name: string; error: Error }> = [];
    const reverseOrder = [...this.initOrder].reverse();

    for (const name of reverseOrder) {
      const manager = this.managers.get(name);
      if (!manager) continue;

      try {
        await manager.dispose();
        console.log(`✓ Disposed ${name}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ name, error: err });
        console.error(`✗ Failed to dispose ${name}:`, err.message);
      }
    }

    // Log disposal errors but don't throw - we want to continue cleanup
    if (errors.length > 0) {
      console.warn('Some managers failed to dispose cleanly:', errors);
    }
  }

  private getPriority(name: string): number {
    // Could be enhanced to store priorities, for now use registration order
    return this.initOrder.indexOf(name);
  }

  /**
   * Get status of all managers
   */
  getStatus(): Array<{ name: string; status: 'registered' | 'error' }> {
    return Array.from(this.managers.keys()).map(name => ({
      name,
      status: 'registered', // Could be enhanced to track init/dispose status
    }));
  }
}
