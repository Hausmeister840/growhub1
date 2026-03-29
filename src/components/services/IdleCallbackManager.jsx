/**
 * Idle Callback Manager
 * Schedules non-critical work during idle time
 */

class IdleCallbackManager {
  constructor() {
    this.tasks = [];
    this.isProcessing = false;
  }

  /**
   * Schedule task
   */
  schedule(task, options = {}) {
    const { priority = 'low', timeout = 5000 } = options;

    this.tasks.push({
      task,
      priority,
      timeout,
      timestamp: Date.now()
    });

    this.tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.processQueue();
  }

  /**
   * Process queue
   */
  processQueue() {
    if (this.isProcessing || this.tasks.length === 0) return;

    this.isProcessing = true;

    const processNext = () => {
      if (this.tasks.length === 0) {
        this.isProcessing = false;
        return;
      }

      const { task, timeout } = this.tasks.shift();

      if ('requestIdleCallback' in window) {
        requestIdleCallback(
          (deadline) => {
            try {
              task(deadline);
            } catch (error) {
              console.error('Idle task error:', error);
            }
            processNext();
          },
          { timeout }
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          try {
            task({ timeRemaining: () => 50, didTimeout: false });
          } catch (error) {
            console.error('Idle task error:', error);
          }
          processNext();
        }, 0);
      }
    };

    processNext();
  }

  /**
   * Clear all tasks
   */
  clear() {
    this.tasks = [];
    this.isProcessing = false;
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.tasks.length;
  }
}

export default new IdleCallbackManager();