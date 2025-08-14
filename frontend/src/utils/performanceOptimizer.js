/**
 * Performance Optimizer
 * Handles performance optimization including debouncing, throttling, batching,
 * memoization, and rendering optimization
 */

/**
 * Performance optimization strategies
 */
export const OptimizationStrategies = {
  DEBOUNCE: 'debounce',
  THROTTLE: 'throttle',
  BATCH: 'batch',
  MEMOIZE: 'memoize',
  RAF: 'requestAnimationFrame',
  IDLE: 'requestIdleCallback'
};

/**
 * Performance Optimizer class
 */
export class PerformanceOptimizer {
  constructor(options = {}) {
    this.debugLogger = options.debugLogger || null;
    this.enableMetrics = options.enableMetrics || false;
    this.metricsInterval = options.metricsInterval || 5000; // 5 seconds
    
    // Optimization tracking
    this.debouncedFunctions = new Map();
    this.throttledFunctions = new Map();
    this.batchedOperations = new Map();
    this.memoizedFunctions = new Map();
    this.rafCallbacks = new Set();
    this.idleCallbacks = new Set();
    
    // Performance metrics
    this.metrics = {
      apiCalls: 0,
      optimizedApiCalls: 0,
      stateUpdates: 0,
      batchedUpdates: 0,
      cacheHits: 0,
      cacheMisses: 0,
      renderOptimizations: 0,
      memoryUsage: 0,
      lastGCTime: Date.now()
    };
    
    // Batch processing
    this.updateBatch = new Set();
    this.batchTimeout = null;
    this.batchDelay = options.batchDelay || 16; // ~60fps
    
    // Memory monitoring
    this.memoryThreshold = options.memoryThreshold || 50 * 1024 * 1024; // 50MB
    this.gcSuggestionThreshold = options.gcSuggestionThreshold || 100 * 1024 * 1024; // 100MB
    
    // Start metrics collection if enabled
    if (this.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  /**
   * Creates a debounced function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Debounce delay in milliseconds
   * @param {Object} options - Additional options
   * @returns {Function} - Debounced function
   */
  debounce = (func, delay, options = {}) => {
    try {
      const key = options.key || func.toString();
      
      if (this.debouncedFunctions.has(key)) {
        return this.debouncedFunctions.get(key);
      }

      let timeoutId = null;
      let lastArgs = null;
      
      const debouncedFn = (...args) => {
        lastArgs = args;
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          try {
            const result = func.apply(this, lastArgs);
            this.metrics.optimizedApiCalls++;
            
            if (options.onComplete) {
              options.onComplete(result);
            }
            
            return result;
          } catch (error) {
            this.logError('[PERF] Debounced function error:', error);
            if (options.onError) {
              options.onError(error);
            }
          }
        }, delay);
      };
      
      // Add cancel method
      debouncedFn.cancel = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      
      // Add flush method
      debouncedFn.flush = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          const result = func.apply(this, lastArgs);
          timeoutId = null;
          return result;
        }
      };
      
      this.debouncedFunctions.set(key, debouncedFn);
      this.log('[PERF] Created debounced function with delay:', delay + 'ms');
      
      return debouncedFn;
      
    } catch (error) {
      this.logError('[PERF] Error creating debounced function:', error);
      return func;
    }
  };

  /**
   * Creates a throttled function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Throttle limit in milliseconds
   * @param {Object} options - Additional options
   * @returns {Function} - Throttled function
   */
  throttle = (func, limit, options = {}) => {
    try {
      const key = options.key || func.toString();
      
      if (this.throttledFunctions.has(key)) {
        return this.throttledFunctions.get(key);
      }

      let inThrottle = false;
      let lastResult = null;
      
      const throttledFn = (...args) => {
        if (!inThrottle) {
          try {
            lastResult = func.apply(this, args);
            inThrottle = true;
            this.metrics.optimizedApiCalls++;
            
            setTimeout(() => {
              inThrottle = false;
            }, limit);
            
            if (options.onExecute) {
              options.onExecute(lastResult);
            }
            
            return lastResult;
          } catch (error) {
            this.logError('[PERF] Throttled function error:', error);
            if (options.onError) {
              options.onError(error);
            }
            inThrottle = false;
          }
        }
        
        return lastResult;
      };
      
      this.throttledFunctions.set(key, throttledFn);
      this.log('[PERF] Created throttled function with limit:', limit + 'ms');
      
      return throttledFn;
      
    } catch (error) {
      this.logError('[PERF] Error creating throttled function:', error);
      return func;
    }
  };

  /**
   * Batches state updates for better performance
   * @param {Function} updateFunction - Function to batch
   * @param {*} updateData - Data for the update
   * @param {Object} options - Batch options
   */
  batchUpdate = (updateFunction, updateData, options = {}) => {
    try {
      const batchKey = options.batchKey || 'default';
      
      if (!this.batchedOperations.has(batchKey)) {
        this.batchedOperations.set(batchKey, []);
      }
      
      this.batchedOperations.get(batchKey).push({
        function: updateFunction,
        data: updateData,
        timestamp: Date.now()
      });
      
      // Clear existing batch timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      // Set new batch timeout
      this.batchTimeout = setTimeout(() => {
        this.flushBatch(batchKey);
      }, options.delay || this.batchDelay);
      
      this.log('[PERF] Added update to batch:', batchKey);
      
    } catch (error) {
      this.logError('[PERF] Error batching update:', error);
      // Fallback to immediate execution
      updateFunction(updateData);
    }
  };

  /**
   * Flushes batched operations
   * @param {string} batchKey - Specific batch to flush, or all if not provided
   */
  flushBatch = (batchKey = null) => {
    try {
      const batchesToFlush = batchKey 
        ? [batchKey].filter(key => this.batchedOperations.has(key))
        : Array.from(this.batchedOperations.keys());
      
      for (const key of batchesToFlush) {
        const operations = this.batchedOperations.get(key);
        
        if (operations && operations.length > 0) {
          // Group operations by function to optimize execution
          const groupedOperations = new Map();
          
          operations.forEach(op => {
            const funcKey = op.function.toString();
            if (!groupedOperations.has(funcKey)) {
              groupedOperations.set(funcKey, []);
            }
            groupedOperations.get(funcKey).push(op);
          });
          
          // Execute grouped operations
          for (const [funcKey, ops] of groupedOperations) {
            try {
              if (ops.length === 1) {
                ops[0].function(ops[0].data);
              } else {
                // Batch multiple operations of the same type
                const batchedData = ops.map(op => op.data);
                ops[0].function(batchedData);
              }
              
              this.metrics.batchedUpdates += ops.length;
            } catch (error) {
              this.logError('[PERF] Error executing batched operations:', error);
            }
          }
          
          this.batchedOperations.delete(key);
          this.log('[PERF] Flushed batch:', key, 'Operations:', operations.length);
        }
      }
      
      this.batchTimeout = null;
      
    } catch (error) {
      this.logError('[PERF] Error flushing batch:', error);
    }
  };

  /**
   * Creates a memoized function
   * @param {Function} func - Function to memoize
   * @param {Object} options - Memoization options
   * @returns {Function} - Memoized function
   */
  memoize = (func, options = {}) => {
    try {
      const key = options.key || func.toString();
      
      if (this.memoizedFunctions.has(key)) {
        return this.memoizedFunctions.get(key);
      }

      const cache = new Map();
      const maxCacheSize = options.maxSize || 100;
      const ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
      
      const memoizedFn = (...args) => {
        const cacheKey = options.keyGenerator 
          ? options.keyGenerator(args)
          : JSON.stringify(args);
        
        // Check cache
        if (cache.has(cacheKey)) {
          const cached = cache.get(cacheKey);
          
          // Check TTL
          if (Date.now() - cached.timestamp < ttl) {
            this.metrics.cacheHits++;
            this.log('[PERF] Cache hit for key:', cacheKey);
            return cached.value;
          } else {
            cache.delete(cacheKey);
          }
        }
        
        // Execute function
        try {
          const result = func.apply(this, args);
          
          // Cache result
          if (cache.size >= maxCacheSize) {
            // Remove oldest entry
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          
          cache.set(cacheKey, {
            value: result,
            timestamp: Date.now()
          });
          
          this.metrics.cacheMisses++;
          this.log('[PERF] Cache miss for key:', cacheKey, 'Cached result');
          return result;
          
        } catch (error) {
          this.logError('[PERF] Memoized function error:', error);
          throw error;
        }
      };
      
      // Add cache management methods
      memoizedFn.clearCache = () => {
        cache.clear();
        this.log('[PERF] Cleared cache for memoized function');
      };
      
      memoizedFn.getCacheSize = () => cache.size;
      
      memoizedFn.getCacheStats = () => ({
        size: cache.size,
        maxSize: maxCacheSize,
        hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100
      });
      
      this.memoizedFunctions.set(key, memoizedFn);
      this.log('[PERF] Created memoized function with cache size:', maxCacheSize);
      
      return memoizedFn;
      
    } catch (error) {
      this.logError('[PERF] Error creating memoized function:', error);
      return func;
    }
  };

  /**
   * Optimizes rendering using requestAnimationFrame
   * @param {Function} callback - Callback to execute
   * @param {Object} options - RAF options
   * @returns {number} - RAF ID for cancellation
   */
  optimizeRender = (callback, options = {}) => {
    try {
      const rafCallback = (timestamp) => {
        try {
          callback(timestamp);
          this.metrics.renderOptimizations++;
          
          if (options.onComplete) {
            options.onComplete(timestamp);
          }
        } catch (error) {
          this.logError('[PERF] RAF callback error:', error);
          if (options.onError) {
            options.onError(error);
          }
        }
      };
      
      const rafId = requestAnimationFrame(rafCallback);
      this.rafCallbacks.add(rafId);
      
      this.log('[PERF] Scheduled RAF optimization');
      return rafId;
      
    } catch (error) {
      this.logError('[PERF] Error scheduling RAF:', error);
      // Fallback to immediate execution
      callback();
      return null;
    }
  };

  /**
   * Executes callback during idle time
   * @param {Function} callback - Callback to execute during idle
   * @param {Object} options - Idle callback options
   * @returns {number} - Idle callback ID for cancellation
   */
  executeWhenIdle = (callback, options = {}) => {
    try {
      const idleCallback = (deadline) => {
        try {
          if (deadline.timeRemaining() > 0) {
            callback(deadline);
            
            if (options.onComplete) {
              options.onComplete(deadline);
            }
          } else {
            // Reschedule if not enough time
            this.executeWhenIdle(callback, options);
          }
        } catch (error) {
          this.logError('[PERF] Idle callback error:', error);
          if (options.onError) {
            options.onError(error);
          }
        }
      };
      
      const idleId = requestIdleCallback ? 
        requestIdleCallback(idleCallback, { timeout: options.timeout || 5000 }) :
        setTimeout(() => idleCallback({ timeRemaining: () => 5 }), 0);
      
      this.idleCallbacks.add(idleId);
      
      this.log('[PERF] Scheduled idle callback');
      return idleId;
      
    } catch (error) {
      this.logError('[PERF] Error scheduling idle callback:', error);
      // Fallback to immediate execution
      callback({ timeRemaining: () => 0 });
      return null;
    }
  };

  /**
   * Monitors memory usage and suggests garbage collection
   */
  monitorMemory = () => {
    try {
      if (performance.memory) {
        const memory = performance.memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // Log memory stats
        this.log('[PERF] Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
        
        // Suggest GC if memory usage is high
        if (memory.usedJSHeapSize > this.gcSuggestionThreshold) {
          const timeSinceLastGC = Date.now() - this.metrics.lastGCTime;
          
          if (timeSinceLastGC > 30000) { // 30 seconds
            this.suggestGarbageCollection();
          }
        }
      }
    } catch (error) {
      this.logError('[PERF] Error monitoring memory:', error);
    }
  };

  /**
   * Suggests garbage collection
   */
  suggestGarbageCollection = () => {
    try {
      this.log('[PERF] Suggesting garbage collection due to high memory usage');
      
      // Clean up internal caches
      this.cleanupCaches();
      
      // Suggest browser GC (if available)
      if (window.gc && typeof window.gc === 'function') {
        window.gc();
        this.metrics.lastGCTime = Date.now();
        this.log('[PERF] Triggered garbage collection');
      }
      
    } catch (error) {
      this.logError('[PERF] Error suggesting GC:', error);
    }
  };

  /**
   * Cleans up internal caches
   */
  cleanupCaches = () => {
    try {
      let cleaned = 0;
      
      // Clean memoized function caches
      for (const [key, memoizedFn] of this.memoizedFunctions) {
        if (typeof memoizedFn.clearCache === 'function') {
          memoizedFn.clearCache();
          cleaned++;
        }
      }
      
      // Clear batched operations
      this.batchedOperations.clear();
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      
      this.log('[PERF] Cleaned up caches:', cleaned, 'memoized functions');
      
    } catch (error) {
      this.logError('[PERF] Error cleaning up caches:', error);
    }
  };

  /**
   * Gets performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics = () => {
    const now = Date.now();
    const memoryInfo = performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    } : null;
    
    return {
      ...this.metrics,
      debouncedFunctions: this.debouncedFunctions.size,
      throttledFunctions: this.throttledFunctions.size,
      memoizedFunctions: this.memoizedFunctions.size,
      batchedOperations: this.batchedOperations.size,
      activeRAFCallbacks: this.rafCallbacks.size,
      activeIdleCallbacks: this.idleCallbacks.size,
      memory: memoryInfo,
      optimizationRatio: this.metrics.apiCalls > 0 
        ? (this.metrics.optimizedApiCalls / this.metrics.apiCalls * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRatio: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
        : '0%'
    };
  };

  /**
   * Starts metrics collection interval
   */
  startMetricsCollection = () => {
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
    }
    
    this.metricsIntervalId = setInterval(() => {
      this.monitorMemory();
    }, this.metricsInterval);
    
    this.log('[PERF] Started metrics collection');
  };

  /**
   * Stops metrics collection interval
   */
  stopMetricsCollection = () => {
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
    
    this.log('[PERF] Stopped metrics collection');
  };

  /**
   * Resets performance metrics
   */
  resetMetrics = () => {
    this.metrics = {
      apiCalls: 0,
      optimizedApiCalls: 0,
      stateUpdates: 0,
      batchedUpdates: 0,
      cacheHits: 0,
      cacheMisses: 0,
      renderOptimizations: 0,
      memoryUsage: 0,
      lastGCTime: Date.now()
    };
    
    this.log('[PERF] Reset performance metrics');
  };

  /**
   * Cancels a RAF callback
   * @param {number} rafId - RAF ID to cancel
   */
  cancelRender = (rafId) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      this.rafCallbacks.delete(rafId);
    }
  };

  /**
   * Cancels an idle callback
   * @param {number} idleId - Idle callback ID to cancel
   */
  cancelIdle = (idleId) => {
    if (idleId) {
      if (cancelIdleCallback) {
        cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
      this.idleCallbacks.delete(idleId);
    }
  };

  /**
   * Creates an optimized API caller with automatic debouncing/throttling
   * @param {Function} apiFunction - API function to optimize
   * @param {Object} options - Optimization options
   * @returns {Function} - Optimized API function
   */
  optimizeApiCall = (apiFunction, options = {}) => {
    const strategy = options.strategy || OptimizationStrategies.DEBOUNCE;
    const delay = options.delay || 300;
    
    switch (strategy) {
      case OptimizationStrategies.DEBOUNCE:
        return this.debounce(apiFunction, delay, options);
      case OptimizationStrategies.THROTTLE:
        return this.throttle(apiFunction, delay, options);
      case OptimizationStrategies.MEMOIZE:
        return this.memoize(apiFunction, options);
      default:
        this.log('[PERF] Using original API function, no optimization applied');
        return apiFunction;
    }
  };

  /**
   * Logs debug information
   * @param {...any} args - Arguments to log
   */
  log = (...args) => {
    if (this.debugLogger) {
      this.debugLogger.log('[DEBUG_LOG]', ...args);
    } else {
      console.log('[DEBUG_LOG]', ...args);
    }
  };

  /**
   * Logs error information
   * @param {...any} args - Arguments to log
   */
  logError = (...args) => {
    if (this.debugLogger) {
      this.debugLogger.error('[DEBUG_LOG]', ...args);
    } else {
      console.error('[DEBUG_LOG]', ...args);
    }
  };

  /**
   * Destroys the performance optimizer and cleans up resources
   */
  destroy = () => {
    // Cancel all RAF callbacks
    for (const rafId of this.rafCallbacks) {
      this.cancelRender(rafId);
    }
    
    // Cancel all idle callbacks
    for (const idleId of this.idleCallbacks) {
      this.cancelIdle(idleId);
    }
    
    // Clear all timers
    for (const debouncedFn of this.debouncedFunctions.values()) {
      if (typeof debouncedFn.cancel === 'function') {
        debouncedFn.cancel();
      }
    }
    
    // Clear batched operations
    this.batchedOperations.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    // Stop metrics collection
    this.stopMetricsCollection();
    
    // Clear all maps
    this.debouncedFunctions.clear();
    this.throttledFunctions.clear();
    this.memoizedFunctions.clear();
    this.rafCallbacks.clear();
    this.idleCallbacks.clear();
    
    this.log('[PERF] Performance optimizer destroyed');
  };
}

/**
 * Factory function to create performance optimizer
 * @param {Object} options - Performance optimizer options
 * @returns {PerformanceOptimizer} - Performance optimizer instance
 */
export const createPerformanceOptimizer = (options = {}) => {
  return new PerformanceOptimizer(options);
};

/**
 * Global performance optimizer instance
 */
let globalPerformanceOptimizer = null;

/**
 * Gets or creates global performance optimizer
 * @param {Object} options - Performance optimizer options
 * @returns {PerformanceOptimizer} - Global performance optimizer instance
 */
export const getGlobalPerformanceOptimizer = (options = {}) => {
  if (!globalPerformanceOptimizer) {
    globalPerformanceOptimizer = new PerformanceOptimizer(options);
  }
  return globalPerformanceOptimizer;
};

/**
 * Utility function to create optimized API functions
 * @param {Object} apiFunctions - Object containing API functions
 * @param {Object} optimizations - Optimization config for each function
 * @returns {Object} - Object with optimized API functions
 */
export const optimizeApiFunctions = (apiFunctions, optimizations = {}) => {
  const optimizer = getGlobalPerformanceOptimizer();
  const optimized = {};
  
  for (const [name, func] of Object.entries(apiFunctions)) {
    const config = optimizations[name] || {};
    optimized[name] = optimizer.optimizeApiCall(func, config);
  }
  
  return optimized;
};