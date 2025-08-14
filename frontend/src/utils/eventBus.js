/**
 * Event Bus System
 * Provides centralized event pub/sub system for component communication,
 * event filtering, transformation, and debugging
 */

/**
 * Event Bus configuration
 */
const EVENT_BUS_CONFIG = {
  // Event settings
  MAX_LISTENERS_PER_EVENT: 100,
  MAX_EVENT_HISTORY: 1000,
  MAX_WILDCARD_LISTENERS: 50,
  
  // Performance settings
  ENABLE_EVENT_HISTORY: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  DEBOUNCE_THRESHOLD: 10, // ms
  
  // Debug settings
  LOG_ALL_EVENTS: false,
  LOG_PERFORMANCE_WARNINGS: true,
  PERFORMANCE_WARNING_THRESHOLD: 100 // ms
};

/**
 * Event object structure
 */
class GameEvent {
  constructor(type, data = null, source = null) {
    this.type = type;
    this.data = data;
    this.source = source;
    this.timestamp = Date.now();
    this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.propagationStopped = false;
    this.defaultPrevented = false;
  }

  /**
   * Stops event propagation to remaining listeners
   */
  stopPropagation() {
    this.propagationStopped = true;
  }

  /**
   * Prevents default event behavior
   */
  preventDefault() {
    this.defaultPrevented = true;
  }

  /**
   * Gets event summary for debugging
   */
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      source: this.source,
      timestamp: this.timestamp,
      dataSize: this._estimateDataSize(this.data),
      propagationStopped: this.propagationStopped,
      defaultPrevented: this.defaultPrevented
    };
  }

  /**
   * Estimates the size of event data
   */
  _estimateDataSize(data) {
    if (data === null || data === undefined) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

/**
 * Event listener wrapper
 */
class EventListener {
  constructor(eventType, handler, options = {}) {
    this.id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventType = eventType;
    this.handler = handler;
    this.options = {
      once: false,
      priority: 0,
      context: null,
      filter: null,
      transform: null,
      ...options
    };
    this.callCount = 0;
    this.totalExecutionTime = 0;
    this.lastCalled = null;
    this.errors = [];
  }

  /**
   * Executes the listener with error handling and performance monitoring
   */
  async execute(event) {
    const startTime = performance.now();
    this.callCount++;
    this.lastCalled = Date.now();

    try {
      // Apply filter if provided
      if (this.options.filter && !this.options.filter(event)) {
        return { executed: false, reason: 'filtered' };
      }

      // Apply transformation if provided
      let eventData = event;
      if (this.options.transform) {
        eventData = this.options.transform(event);
      }

      // Execute handler
      let result;
      if (this.options.context) {
        result = await this.handler.call(this.options.context, eventData);
      } else {
        result = await this.handler(eventData);
      }

      const executionTime = performance.now() - startTime;
      this.totalExecutionTime += executionTime;

      // Log performance warning if needed
      if (EVENT_BUS_CONFIG.LOG_PERFORMANCE_WARNINGS && 
          executionTime > EVENT_BUS_CONFIG.PERFORMANCE_WARNING_THRESHOLD) {
        console.warn(`[DEBUG_LOG] Slow event listener: ${this.id} took ${executionTime}ms for event ${event.type}`);
      }

      return { executed: true, result, executionTime };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.totalExecutionTime += executionTime;
      this.errors.push({
        error,
        timestamp: Date.now(),
        event: event.getSummary()
      });

      console.error(`[DEBUG_LOG] Event listener error: ${this.id}`, error);
      return { executed: false, error, executionTime };
    }
  }

  /**
   * Gets listener statistics
   */
  getStats() {
    return {
      id: this.id,
      eventType: this.eventType,
      callCount: this.callCount,
      averageExecutionTime: this.callCount > 0 ? this.totalExecutionTime / this.callCount : 0,
      totalExecutionTime: this.totalExecutionTime,
      lastCalled: this.lastCalled,
      errorCount: this.errors.length,
      options: this.options
    };
  }
}

/**
 * Main Event Bus implementation
 */
class EventBus {
  constructor() {
    this.listeners = new Map(); // eventType -> Set<EventListener>
    this.wildcardListeners = new Set(); // Listeners for all events
    this.eventHistory = [];
    this.stats = {
      totalEvents: 0,
      totalListeners: 0,
      totalExecutions: 0,
      totalErrors: 0
    };
    this.debounceMap = new Map(); // eventType -> timeout
  }

  /**
   * Adds an event listener
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @param {Object} options - Listener options
   * @returns {string} Listener ID for removal
   */
  on(eventType, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('[EventBus] Handler must be a function');
    }

    const listener = new EventListener(eventType, handler, options);
    
    // Handle wildcard listeners
    if (eventType === '*') {
      this.wildcardListeners.add(listener);
      console.log(`[DEBUG_LOG] Added wildcard event listener: ${listener.id}`);
    } else {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }
      
      const eventListeners = this.listeners.get(eventType);
      
      // Check listener limit
      if (eventListeners.size >= EVENT_BUS_CONFIG.MAX_LISTENERS_PER_EVENT) {
        console.warn(`[DEBUG_LOG] Maximum listeners reached for event ${eventType}`);
        return null;
      }
      
      eventListeners.add(listener);
      console.log(`[DEBUG_LOG] Added event listener: ${listener.id} for ${eventType}`);
    }

    this.stats.totalListeners++;
    return listener.id;
  }

  /**
   * Adds a one-time event listener
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @param {Object} options - Listener options
   * @returns {string} Listener ID
   */
  once(eventType, handler, options = {}) {
    return this.on(eventType, handler, { ...options, once: true });
  }

  /**
   * Removes an event listener
   * @param {string} listenerId - Listener ID to remove
   * @returns {boolean} True if listener was removed
   */
  off(listenerId) {
    // Check wildcard listeners
    for (const listener of this.wildcardListeners) {
      if (listener.id === listenerId) {
        this.wildcardListeners.delete(listener);
        this.stats.totalListeners--;
        console.log(`[DEBUG_LOG] Removed wildcard listener: ${listenerId}`);
        return true;
      }
    }

    // Check regular listeners
    for (const [eventType, listeners] of this.listeners) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          this.stats.totalListeners--;
          
          // Clean up empty event type
          if (listeners.size === 0) {
            this.listeners.delete(eventType);
          }
          
          console.log(`[DEBUG_LOG] Removed listener: ${listenerId} from ${eventType}`);
          return true;
        }
      }
    }

    console.warn(`[DEBUG_LOG] Listener not found: ${listenerId}`);
    return false;
  }

  /**
   * Removes all listeners for an event type
   * @param {string} eventType - Event type to clear
   * @returns {number} Number of listeners removed
   */
  removeAllListeners(eventType) {
    if (eventType === '*') {
      const count = this.wildcardListeners.size;
      this.wildcardListeners.clear();
      this.stats.totalListeners -= count;
      console.log(`[DEBUG_LOG] Removed ${count} wildcard listeners`);
      return count;
    }

    const listeners = this.listeners.get(eventType);
    if (!listeners) return 0;

    const count = listeners.size;
    this.listeners.delete(eventType);
    this.stats.totalListeners -= count;
    console.log(`[DEBUG_LOG] Removed ${count} listeners for ${eventType}`);
    return count;
  }

  /**
   * Emits an event to all listeners
   * @param {string} eventType - Event type to emit
   * @param {*} data - Event data
   * @param {string} source - Event source identifier
   * @returns {Promise<Object>} Emission results
   */
  async emit(eventType, data = null, source = null) {
    const event = new GameEvent(eventType, data, source);
    this.stats.totalEvents++;

    // Log event if enabled
    if (EVENT_BUS_CONFIG.LOG_ALL_EVENTS) {
      console.log(`[DEBUG_LOG] Event emitted: ${eventType}`, event.getSummary());
    }

    // Add to history
    if (EVENT_BUS_CONFIG.ENABLE_EVENT_HISTORY) {
      this.eventHistory.push(event.getSummary());
      
      // Limit history size
      if (this.eventHistory.length > EVENT_BUS_CONFIG.MAX_EVENT_HISTORY) {
        this.eventHistory.shift();
      }
    }

    const results = [];
    const startTime = performance.now();

    try {
      // Get all applicable listeners
      const applicableListeners = this._getApplicableListeners(eventType);
      
      // Sort by priority (higher priority first)
      applicableListeners.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

      // Execute listeners
      for (const listener of applicableListeners) {
        if (event.propagationStopped) {
          break;
        }

        const result = await listener.execute(event);
        results.push({ listenerId: listener.id, ...result });
        this.stats.totalExecutions++;

        if (!result.executed && result.error) {
          this.stats.totalErrors++;
        }

        // Remove one-time listeners
        if (listener.options.once) {
          this.off(listener.id);
        }
      }

      const totalTime = performance.now() - startTime;
      
      return {
        event: event.getSummary(),
        results,
        totalTime,
        listenerCount: applicableListeners.length,
        executedCount: results.filter(r => r.executed).length,
        errorCount: results.filter(r => r.error).length
      };

    } catch (error) {
      console.error(`[DEBUG_LOG] Event emission error for ${eventType}:`, error);
      this.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Emits an event with debouncing
   * @param {string} eventType - Event type to emit
   * @param {*} data - Event data
   * @param {string} source - Event source
   * @param {number} delay - Debounce delay in milliseconds
   */
  emitDebounced(eventType, data = null, source = null, delay = EVENT_BUS_CONFIG.DEBOUNCE_THRESHOLD) {
    // Clear existing timeout
    const existingTimeout = this.debounceMap.get(eventType);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.emit(eventType, data, source);
      this.debounceMap.delete(eventType);
    }, delay);

    this.debounceMap.set(eventType, timeout);
  }

  /**
   * Gets all applicable listeners for an event type
   * @param {string} eventType - Event type
   * @returns {Array} Array of applicable listeners
   */
  _getApplicableListeners(eventType) {
    const listeners = [];
    
    // Add specific event listeners
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      listeners.push(...eventListeners);
    }
    
    // Add wildcard listeners
    listeners.push(...this.wildcardListeners);
    
    return listeners;
  }

  /**
   * Waits for a specific event to be emitted
   * @param {string} eventType - Event type to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @param {Function} filter - Optional filter function
   * @returns {Promise} Promise resolving with event data
   */
  waitFor(eventType, timeout = 5000, filter = null) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(listenerId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const listenerId = this.once(eventType, (event) => {
        clearTimeout(timeoutId);
        
        if (filter && !filter(event)) {
          // Continue waiting if filter doesn't match
          const newListenerId = this.waitFor(eventType, timeout - (Date.now() - startTime), filter);
          newListenerId.then(resolve).catch(reject);
          return;
        }
        
        resolve(event);
      });

      const startTime = Date.now();
    });
  }

  /**
   * Gets event bus statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const listenerStats = [];
    
    // Collect regular listener stats
    for (const [eventType, listeners] of this.listeners) {
      for (const listener of listeners) {
        listenerStats.push({ eventType, ...listener.getStats() });
      }
    }
    
    // Collect wildcard listener stats
    for (const listener of this.wildcardListeners) {
      listenerStats.push({ eventType: '*', ...listener.getStats() });
    }

    return {
      ...this.stats,
      activeListeners: this.stats.totalListeners,
      eventTypes: this.listeners.size,
      wildcardListeners: this.wildcardListeners.size,
      eventHistorySize: this.eventHistory.length,
      pendingDebounces: this.debounceMap.size,
      listenerStats,
      averageExecutionTime: listenerStats.length > 0 ? 
        listenerStats.reduce((sum, stat) => sum + stat.averageExecutionTime, 0) / listenerStats.length : 0
    };
  }

  /**
   * Gets recent event history
   * @param {number} limit - Number of recent events to return
   * @returns {Array} Array of recent events
   */
  getRecentEvents(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Gets events of a specific type from history
   * @param {string} eventType - Event type to filter
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} Array of matching events
   */
  getEventHistory(eventType, limit = 50) {
    return this.eventHistory
      .filter(event => event.type === eventType)
      .slice(-limit);
  }

  /**
   * Clears event history
   */
  clearHistory() {
    const count = this.eventHistory.length;
    this.eventHistory = [];
    console.log(`[DEBUG_LOG] Cleared ${count} events from history`);
  }

  /**
   * Clears all listeners and resets the event bus
   */
  reset() {
    // Clear all debounce timeouts
    for (const timeout of this.debounceMap.values()) {
      clearTimeout(timeout);
    }
    
    this.listeners.clear();
    this.wildcardListeners.clear();
    this.debounceMap.clear();
    this.eventHistory = [];
    this.stats = {
      totalEvents: 0,
      totalListeners: 0,
      totalExecutions: 0,
      totalErrors: 0
    };
    
    console.log('[DEBUG_LOG] Event bus reset');
  }

  /**
   * Creates a namespaced event bus
   * @param {string} namespace - Namespace prefix
   * @returns {Object} Namespaced event bus methods
   */
  namespace(namespace) {
    return {
      on: (eventType, handler, options) => 
        this.on(`${namespace}:${eventType}`, handler, options),
      once: (eventType, handler, options) => 
        this.once(`${namespace}:${eventType}`, handler, options),
      off: (listenerId) => this.off(listenerId),
      emit: (eventType, data, source) => 
        this.emit(`${namespace}:${eventType}`, data, source || namespace),
      emitDebounced: (eventType, data, source, delay) => 
        this.emitDebounced(`${namespace}:${eventType}`, data, source || namespace, delay)
    };
  }
}

// Create singleton instance
const eventBus = new EventBus();

export default eventBus;
export { GameEvent, EventListener, EVENT_BUS_CONFIG };