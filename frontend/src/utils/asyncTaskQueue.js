/**
 * Async Task Queue Manager
 * Handles async task queuing, retry logic, priority handling,
 * progress tracking, and task dependency management
 */

/**
 * Task queue configuration
 */
const QUEUE_CONFIG = {
  // Concurrency limits
  MAX_CONCURRENT_TASKS: 5,
  MAX_CONCURRENT_PER_TYPE: 2,
  
  // Retry settings
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_RETRY_DELAY: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  MAX_RETRY_DELAY: 30000,
  
  // Timeout settings
  DEFAULT_TIMEOUT: 30000,
  HEARTBEAT_INTERVAL: 5000,
  
  // Priority levels
  PRIORITY: {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
    BACKGROUND: 5
  },
  
  // Task types
  TASK_TYPES: {
    API_CALL: 'api_call',
    WEBSOCKET_SEND: 'websocket_send',
    DATA_SYNC: 'data_sync',
    CACHE_UPDATE: 'cache_update',
    FILE_UPLOAD: 'file_upload',
    BACKGROUND_TASK: 'background_task'
  }
};

/**
 * Individual task wrapper
 */
class Task {
  constructor(id, type, asyncFunction, options = {}) {
    this.id = id;
    this.type = type;
    this.asyncFunction = asyncFunction;
    this.priority = options.priority || QUEUE_CONFIG.PRIORITY.NORMAL;
    this.maxRetries = options.maxRetries || QUEUE_CONFIG.DEFAULT_MAX_RETRIES;
    this.retryDelay = options.retryDelay || QUEUE_CONFIG.DEFAULT_RETRY_DELAY;
    this.timeout = options.timeout || QUEUE_CONFIG.DEFAULT_TIMEOUT;
    this.dependencies = options.dependencies || [];
    this.metadata = options.metadata || {};
    
    // Runtime state
    this.status = 'pending';
    this.currentRetry = 0;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.error = null;
    this.result = null;
    this.progress = 0;
    this.abortController = new AbortController();
    
    // Callbacks
    this.onProgress = options.onProgress;
    this.onSuccess = options.onSuccess;
    this.onError = options.onError;
    this.onComplete = options.onComplete;
  }

  /**
   * Executes the task
   * @returns {Promise} Task execution promise
   */
  async execute() {
    this.status = 'running';
    this.startedAt = Date.now();
    
    console.log(`[DEBUG_LOG] Starting task execution: ${this.id} (${this.type})`);
    
    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.timeout);
      });
      
      // Execute with timeout
      const result = await Promise.race([
        this.asyncFunction(this.abortController.signal, this._updateProgress.bind(this)),
        timeoutPromise
      ]);
      
      this.result = result;
      this.status = 'completed';
      this.completedAt = Date.now();
      this.progress = 100;
      
      if (this.onSuccess) {
        this.onSuccess(result);
      }
      
      console.log(`[DEBUG_LOG] Task completed successfully: ${this.id}`);
      return result;
      
    } catch (error) {
      this.error = error;
      this.status = 'failed';
      
      if (this.onError) {
        this.onError(error);
      }
      
      console.error(`[DEBUG_LOG] Task failed: ${this.id}`, error);
      throw error;
      
    } finally {
      if (this.onComplete) {
        this.onComplete(this);
      }
    }
  }

  /**
   * Updates task progress
   * @param {number} progress - Progress percentage (0-100)
   */
  _updateProgress(progress) {
    this.progress = Math.max(0, Math.min(100, progress));
    if (this.onProgress) {
      this.onProgress(this.progress);
    }
  }

  /**
   * Aborts the task
   */
  abort() {
    this.abortController.abort();
    this.status = 'aborted';
    console.log(`[DEBUG_LOG] Task aborted: ${this.id}`);
  }

  /**
   * Gets task execution duration
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    if (!this.startedAt) return 0;
    const endTime = this.completedAt || Date.now();
    return endTime - this.startedAt;
  }

  /**
   * Gets task summary
   * @returns {Object} Task summary
   */
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      priority: this.priority,
      progress: this.progress,
      currentRetry: this.currentRetry,
      maxRetries: this.maxRetries,
      duration: this.getDuration(),
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      error: this.error?.message || null,
      metadata: this.metadata
    };
  }
}

/**
 * Main Async Task Queue Manager
 */
class AsyncTaskQueue {
  constructor() {
    this.tasks = new Map();
    this.pendingTasks = [];
    this.runningTasks = new Map();
    this.completedTasks = [];
    this.failedTasks = [];
    this.taskCounter = 0;
    this.isProcessing = false;
    this.processInterval = null;
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      abortedTasks: 0,
      retriedTasks: 0
    };
  }

  /**
   * Adds a task to the queue
   * @param {string} type - Task type
   * @param {Function} asyncFunction - Async function to execute
   * @param {Object} options - Task options
   * @returns {string} Task ID
   */
  addTask(type, asyncFunction, options = {}) {
    const taskId = `${type}_${++this.taskCounter}_${Date.now()}`;
    const task = new Task(taskId, type, asyncFunction, options);
    
    this.tasks.set(taskId, task);
    this.pendingTasks.push(task);
    this.stats.totalTasks++;
    
    // Sort by priority (lower number = higher priority)
    this.pendingTasks.sort((a, b) => a.priority - b.priority);
    
    console.log(`[DEBUG_LOG] Added task to queue: ${taskId} (${type}), priority: ${task.priority}`);
    
    // Start processing if not already running
    this.startProcessing();
    
    return taskId;
  }

  /**
   * Adds a high-priority task to the front of the queue
   * @param {string} type - Task type
   * @param {Function} asyncFunction - Async function to execute
   * @param {Object} options - Task options
   * @returns {string} Task ID
   */
  addUrgentTask(type, asyncFunction, options = {}) {
    return this.addTask(type, asyncFunction, {
      ...options,
      priority: QUEUE_CONFIG.PRIORITY.CRITICAL
    });
  }

  /**
   * Gets a task by ID
   * @param {string} taskId - Task ID
   * @returns {Task|null} Task or null if not found
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Cancels a task
   * @param {string} taskId - Task ID
   * @returns {boolean} True if task was cancelled
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    
    if (task.status === 'pending') {
      // Remove from pending queue
      this.pendingTasks = this.pendingTasks.filter(t => t.id !== taskId);
      task.status = 'cancelled';
      console.log(`[DEBUG_LOG] Cancelled pending task: ${taskId}`);
      return true;
    }
    
    if (task.status === 'running') {
      // Abort running task
      task.abort();
      this.runningTasks.delete(taskId);
      this.stats.abortedTasks++;
      console.log(`[DEBUG_LOG] Aborted running task: ${taskId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Starts the task processing loop
   */
  startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('[DEBUG_LOG] Started task queue processing');
    
    // Start the processing interval
    this.processInterval = setInterval(() => {
      this._processQueue();
    }, 100); // Check queue every 100ms
  }

  /**
   * Stops the task processing loop
   */
  stopProcessing() {
    if (!this.isProcessing) return;
    
    this.isProcessing = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    
    console.log('[DEBUG_LOG] Stopped task queue processing');
  }

  /**
   * Processes the task queue
   */
  async _processQueue() {
    if (this.pendingTasks.length === 0) return;
    if (this.runningTasks.size >= QUEUE_CONFIG.MAX_CONCURRENT_TASKS) return;
    
    // Find next task to execute
    const nextTask = this._findNextExecutableTask();
    if (!nextTask) return;
    
    // Remove from pending and add to running
    this.pendingTasks = this.pendingTasks.filter(t => t.id !== nextTask.id);
    this.runningTasks.set(nextTask.id, nextTask);
    
    // Execute the task
    this._executeTask(nextTask);
  }

  /**
   * Finds the next executable task considering dependencies and concurrency limits
   * @returns {Task|null} Next task to execute or null
   */
  _findNextExecutableTask() {
    for (const task of this.pendingTasks) {
      // Check dependencies
      if (!this._areDependenciesMet(task)) continue;
      
      // Check concurrency limits per type
      const sameTypeRunning = Array.from(this.runningTasks.values())
        .filter(t => t.type === task.type).length;
      
      if (sameTypeRunning >= QUEUE_CONFIG.MAX_CONCURRENT_PER_TYPE) continue;
      
      return task;
    }
    
    return null;
  }

  /**
   * Checks if task dependencies are met
   * @param {Task} task - Task to check
   * @returns {boolean} True if dependencies are met
   */
  _areDependenciesMet(task) {
    if (task.dependencies.length === 0) return true;
    
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Executes a task with retry logic
   * @param {Task} task - Task to execute
   */
  async _executeTask(task) {
    try {
      const result = await task.execute();
      
      // Move to completed
      this.runningTasks.delete(task.id);
      this.completedTasks.push(task);
      this.stats.completedTasks++;
      
      console.log(`[DEBUG_LOG] Task execution completed: ${task.id}`);
      
    } catch (error) {
      this.runningTasks.delete(task.id);
      
      // Check if we should retry
      if (task.currentRetry < task.maxRetries && task.status !== 'aborted') {
        task.currentRetry++;
        this.stats.retriedTasks++;
        
        const delay = Math.min(
          task.retryDelay * Math.pow(QUEUE_CONFIG.RETRY_BACKOFF_MULTIPLIER, task.currentRetry - 1),
          QUEUE_CONFIG.MAX_RETRY_DELAY
        );
        
        console.log(`[DEBUG_LOG] Retrying task ${task.id} (attempt ${task.currentRetry}/${task.maxRetries}) after ${delay}ms`);
        
        // Reset task state for retry
        task.status = 'pending';
        task.error = null;
        task.abortController = new AbortController();
        
        // Add back to pending queue after delay
        setTimeout(() => {
          this.pendingTasks.push(task);
          this.pendingTasks.sort((a, b) => a.priority - b.priority);
        }, delay);
        
      } else {
        // Task failed permanently
        this.failedTasks.push(task);
        this.stats.failedTasks++;
        console.error(`[DEBUG_LOG] Task failed permanently: ${task.id}`, error);
      }
    }
  }

  /**
   * Gets tasks by status
   * @param {string} status - Task status
   * @returns {Array} Array of tasks
   */
  getTasksByStatus(status) {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * Gets tasks by type
   * @param {string} type - Task type
   * @returns {Array} Array of tasks
   */
  getTasksByType(type) {
    return Array.from(this.tasks.values()).filter(task => task.type === type);
  }

  /**
   * Gets queue statistics
   * @returns {Object} Queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      pendingTasks: this.pendingTasks.length,
      runningTasks: this.runningTasks.size,
      completedTasksCount: this.completedTasks.length,
      failedTasksCount: this.failedTasks.length,
      totalTasksInMemory: this.tasks.size,
      isProcessing: this.isProcessing,
      averageTaskDuration: this._calculateAverageTaskDuration(),
      successRate: this.stats.totalTasks > 0 ? 
        (this.stats.completedTasks / this.stats.totalTasks) * 100 : 0
    };
  }

  /**
   * Calculates average task duration
   * @returns {number} Average duration in milliseconds
   */
  _calculateAverageTaskDuration() {
    const completedTasks = this.completedTasks.filter(task => task.completedAt && task.startedAt);
    if (completedTasks.length === 0) return 0;
    
    const totalDuration = completedTasks.reduce((sum, task) => sum + task.getDuration(), 0);
    return totalDuration / completedTasks.length;
  }

  /**
   * Clears completed and failed tasks to free memory
   * @param {number} keepRecent - Number of recent tasks to keep
   */
  cleanup(keepRecent = 50) {
    // Keep only recent completed tasks
    if (this.completedTasks.length > keepRecent) {
      const toRemove = this.completedTasks.splice(0, this.completedTasks.length - keepRecent);
      toRemove.forEach(task => this.tasks.delete(task.id));
    }
    
    // Keep only recent failed tasks
    if (this.failedTasks.length > keepRecent) {
      const toRemove = this.failedTasks.splice(0, this.failedTasks.length - keepRecent);
      toRemove.forEach(task => this.tasks.delete(task.id));
    }
    
    console.log(`[DEBUG_LOG] Task queue cleanup completed, keeping ${keepRecent} recent tasks`);
  }

  /**
   * Cancels all pending tasks
   */
  cancelAllPending() {
    const cancelledCount = this.pendingTasks.length;
    this.pendingTasks.forEach(task => {
      task.status = 'cancelled';
    });
    this.pendingTasks = [];
    
    console.log(`[DEBUG_LOG] Cancelled ${cancelledCount} pending tasks`);
    return cancelledCount;
  }

  /**
   * Waits for all running tasks to complete
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise resolving when all tasks complete or timeout
   */
  async waitForCompletion(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        if (this.runningTasks.size === 0 && this.pendingTasks.length === 0) {
          resolve();
          return;
        }
        
        setTimeout(checkCompletion, 100);
      };
      
      // Set timeout
      setTimeout(() => reject(new Error('Timeout waiting for task completion')), timeout);
      
      checkCompletion();
    });
  }

  /**
   * Gets detailed queue status
   * @returns {Object} Detailed status information
   */
  getDetailedStatus() {
    return {
      stats: this.getStats(),
      pendingTasks: this.pendingTasks.map(task => task.getSummary()),
      runningTasks: Array.from(this.runningTasks.values()).map(task => task.getSummary()),
      recentCompleted: this.completedTasks.slice(-10).map(task => task.getSummary()),
      recentFailed: this.failedTasks.slice(-10).map(task => task.getSummary())
    };
  }
}

// Create singleton instance
const asyncTaskQueue = new AsyncTaskQueue();

export default asyncTaskQueue;
export { QUEUE_CONFIG, Task };