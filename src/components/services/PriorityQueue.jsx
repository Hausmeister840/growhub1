/**
 * Priority Queue
 * Manages tasks with priorities
 */

class PriorityQueue {
  constructor() {
    this.queues = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    this.processing = false;
  }

  /**
   * Add task
   */
  add(task, priority = 'medium') {
    if (!this.queues[priority]) {
      priority = 'medium';
    }

    this.queues[priority].push({
      task,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    });

    this.process();
  }

  /**
   * Process queue
   */
  async process() {
    if (this.processing) return;
    this.processing = true;

    const priorities = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      while (this.queues[priority].length > 0) {
        const item = this.queues[priority].shift();
        
        try {
          await item.task();
        } catch (error) {
          console.error('Task error:', error);
        }

        // Allow other tasks to run
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    this.processing = false;

    // Check if new tasks were added during processing
    const hasMore = priorities.some(p => this.queues[p].length > 0);
    if (hasMore) {
      this.process();
    }
  }

  /**
   * Clear queue
   */
  clear(priority = null) {
    if (priority) {
      this.queues[priority] = [];
    } else {
      Object.keys(this.queues).forEach(key => {
        this.queues[key] = [];
      });
    }
  }

  /**
   * Get size
   */
  getSize(priority = null) {
    if (priority) {
      return this.queues[priority]?.length || 0;
    }
    
    return Object.values(this.queues).reduce((sum, q) => sum + q.length, 0);
  }
}

export default new PriorityQueue();