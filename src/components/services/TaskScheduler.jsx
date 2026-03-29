/**
 * Task Scheduler
 * Schedules and manages background tasks
 */

class TaskScheduler {
  constructor() {
    this.tasks = new Map();
    this.intervals = new Map();
  }

  /**
   * Schedule recurring task
   */
  schedule(taskId, callback, interval) {
    this.cancel(taskId);
    
    const intervalId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error(`Task ${taskId} error:`, error);
      }
    }, interval);

    this.intervals.set(taskId, intervalId);
    this.tasks.set(taskId, { callback, interval });
  }

  /**
   * Schedule one-time task
   */
  scheduleOnce(taskId, callback, delay) {
    this.cancel(taskId);
    
    const timeoutId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error(`Task ${taskId} error:`, error);
      }
      this.tasks.delete(taskId);
    }, delay);

    this.tasks.set(taskId, { callback, delay, timeoutId });
  }

  /**
   * Cancel task
   */
  cancel(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (this.intervals.has(taskId)) {
      clearInterval(this.intervals.get(taskId));
      this.intervals.delete(taskId);
    }

    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }

    this.tasks.delete(taskId);
  }

  /**
   * Cancel all tasks
   */
  cancelAll() {
    this.intervals.forEach(id => clearInterval(id));
    this.tasks.forEach(task => {
      if (task.timeoutId) clearTimeout(task.timeoutId);
    });
    
    this.tasks.clear();
    this.intervals.clear();
  }

  /**
   * Get active tasks
   */
  getActiveTasks() {
    return Array.from(this.tasks.keys());
  }
}

export default new TaskScheduler();