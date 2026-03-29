/**
 * Optimistic Update Service
 * Handles instant UI updates before server confirmation
 */

class OptimisticUpdateService {
  constructor() {
    this.pendingUpdates = new Map();
    this.rollbackHandlers = new Map();
  }

  /**
   * Apply optimistic update with automatic rollback on failure
   */
  async apply(key, optimisticFn, serverFn, rollbackFn) {
    // Apply optimistic update immediately
    const rollbackData = optimisticFn();
    this.pendingUpdates.set(key, { rollbackData, rollbackFn });

    try {
      // Execute server update
      const result = await serverFn();
      this.pendingUpdates.delete(key);
      return { success: true, data: result };
    } catch (error) {
      // Rollback on failure
      if (rollbackFn && rollbackData) {
        rollbackFn(rollbackData);
      }
      this.pendingUpdates.delete(key);
      return { success: false, error };
    }
  }

  /**
   * Check if update is pending
   */
  isPending(key) {
    return this.pendingUpdates.has(key);
  }

  /**
   * Clear all pending updates
   */
  clear() {
    this.pendingUpdates.clear();
  }
}

export default new OptimisticUpdateService();