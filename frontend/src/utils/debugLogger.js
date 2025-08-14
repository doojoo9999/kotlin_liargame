/**
 * Debug Logger System
 * Provides centralized logging, performance monitoring, error tracking,
 * and environment-specific log levels with structured output
 */

/**
 * Logger configuration
 */
const LOGGER_CONFIG = {
  // Log levels (lower number = higher priority)
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  },
  
  // Environment settings
  DEFAULT_LOG_LEVEL: 'DEBUG', // Development default
  PRODUCTION_LOG_LEVEL: 'WARN',
  
  // Output settings
  MAX_LOG_HISTORY: 1000,
  MAX_PERFORMANCE_ENTRIES: 500,
  MAX_ERROR_ENTRIES: 100,
  
  // Performance monitoring
  SLOW_OPERATION_THRESHOLD: 100, // ms
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024, // 50MB
  
  // Formatting
  TIMESTAMP_FORMAT: 'HH:mm:ss.SSS',
  ENABLE_COLORS: true,
  ENABLE_STACK_TRACES: true
};

/**
 * Log entry structure
 */
class LogEntry {
  constructor(level, message, data = null, source = null) {
    this.id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.level = level;
    this.message = message;
    this.data = data;
    this.source = source;
    this.timestamp = Date.now();
    this.formattedTime = this._formatTimestamp(this.timestamp);
    this.stackTrace = LOGGER_CONFIG.ENABLE_STACK_TRACES ? this._captureStackTrace() : null;
  }

  _formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  }

  _captureStackTrace() {
    try {
      const stack = new Error().stack;
      return stack ? stack.split('\n').slice(3, 8) : null; // Skip first 3 lines (Error, this function, logger call)
    } catch {
      return null;
    }
  }

  toConsoleFormat() {
    const prefix = `[${this.formattedTime}] [${this.level}]`;
    const sourceInfo = this.source ? ` [${this.source}]` : '';
    const baseMessage = `${prefix}${sourceInfo} ${this.message}`;
    
    if (this.data !== null) {
      return [baseMessage, this.data];
    }
    return [baseMessage];
  }

  toJSON() {
    return {
      id: this.id,
      level: this.level,
      message: this.message,
      data: this.data,
      source: this.source,
      timestamp: this.timestamp,
      formattedTime: this.formattedTime
    };
  }
}

/**
 * Performance monitoring entry
 */
class PerformanceEntry {
  constructor(operation, duration, metadata = {}) {
    this.id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.operation = operation;
    this.duration = duration;
    this.metadata = metadata;
    this.timestamp = Date.now();
    this.isSlow = duration > LOGGER_CONFIG.SLOW_OPERATION_THRESHOLD;
  }

  toJSON() {
    return {
      id: this.id,
      operation: this.operation,
      duration: this.duration,
      metadata: this.metadata,
      timestamp: this.timestamp,
      isSlow: this.isSlow
    };
  }
}

/**
 * Error tracking entry
 */
class ErrorEntry {
  constructor(error, context = {}) {
    this.id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.message = error.message || 'Unknown error';
    this.stack = error.stack || null;
    this.name = error.name || 'Error';
    this.context = context;
    this.timestamp = Date.now();
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    this.url = typeof window !== 'undefined' ? window.location.href : 'Unknown';
  }

  toJSON() {
    return {
      id: this.id,
      message: this.message,
      stack: this.stack,
      name: this.name,
      context: this.context,
      timestamp: this.timestamp,
      userAgent: this.userAgent,
      url: this.url
    };
  }
}

/**
 * Main Debug Logger implementation
 */
class DebugLogger {
  constructor() {
    this.currentLogLevel = this._determineLogLevel();
    this.logHistory = [];
    this.performanceEntries = [];
    this.errorEntries = [];
    this.loggers = new Map(); // Named logger instances
    this.muted = false;
    this.filters = new Set();
    this.transformers = new Map();
    
    // Performance monitoring
    this.performanceMarks = new Map();
    this.memoryChecks = [];
    
    // Initialize
    this._setupGlobalErrorHandling();
    this._startMemoryMonitoring();
  }

  /**
   * Determines appropriate log level based on environment
   */
  _determineLogLevel() {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      return LOGGER_CONFIG.LOG_LEVELS[LOGGER_CONFIG.PRODUCTION_LOG_LEVEL];
    }
    return LOGGER_CONFIG.LOG_LEVELS[LOGGER_CONFIG.DEFAULT_LOG_LEVEL];
  }

  /**
   * Sets up global error handling
   */
  _setupGlobalErrorHandling() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global error caught', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          reason: event.reason,
          promise: event.promise
        });
      });
    }
  }

  /**
   * Starts memory monitoring
   */
  _startMemoryMonitoring() {
    if (typeof performance !== 'undefined' && performance.memory) {
      setInterval(() => {
        const memoryInfo = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };

        this.memoryChecks.push(memoryInfo);
        
        // Keep only recent entries
        if (this.memoryChecks.length > 100) {
          this.memoryChecks.shift();
        }

        // Warn about high memory usage
        if (memoryInfo.usedJSHeapSize > LOGGER_CONFIG.MEMORY_WARNING_THRESHOLD) {
          this.warn('High memory usage detected', memoryInfo);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Creates or gets a named logger instance
   */
  getLogger(name) {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, {
        error: (message, data) => this.error(message, data, name),
        warn: (message, data) => this.warn(message, data, name),
        info: (message, data) => this.info(message, data, name),
        debug: (message, data) => this.debug(message, data, name),
        trace: (message, data) => this.trace(message, data, name),
        time: (label) => this.time(label, name),
        timeEnd: (label) => this.timeEnd(label, name)
      });
    }
    return this.loggers.get(name);
  }

  /**
   * Sets the current log level
   */
  setLogLevel(level) {
    const levelValue = typeof level === 'string' ? LOGGER_CONFIG.LOG_LEVELS[level.toUpperCase()] : level;
    if (levelValue !== undefined) {
      this.currentLogLevel = levelValue;
      this.info(`Log level set to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Checks if a log level should be processed
   */
  _shouldLog(level) {
    return !this.muted && LOGGER_CONFIG.LOG_LEVELS[level] <= this.currentLogLevel;
  }

  /**
   * Core logging method
   */
  _log(level, message, data = null, source = null) {
    if (!this._shouldLog(level)) return;

    const entry = new LogEntry(level, message, data, source);

    // Apply filters
    for (const filter of this.filters) {
      if (!filter(entry)) return;
    }

    // Apply transformers
    const transformer = this.transformers.get(level);
    if (transformer) {
      transformer(entry);
    }

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > LOGGER_CONFIG.MAX_LOG_HISTORY) {
      this.logHistory.shift();
    }

    // Output to console
    this._outputToConsole(level, entry);
  }

  /**
   * Outputs log entry to console with appropriate styling
   */
  _outputToConsole(level, entry) {
    const consoleArgs = entry.toConsoleFormat();
    const consoleMethod = this._getConsoleMethod(level);
    
    if (LOGGER_CONFIG.ENABLE_COLORS && typeof console !== 'undefined') {
      const color = this._getLevelColor(level);
      if (color) {
        consoleArgs[0] = `%c${consoleArgs[0]}`;
        consoleArgs.splice(1, 0, `color: ${color}; font-weight: bold;`);
      }
    }

    console[consoleMethod](...consoleArgs);
  }

  /**
   * Gets appropriate console method for log level
   */
  _getConsoleMethod(level) {
    switch (level) {
      case 'ERROR': return 'error';
      case 'WARN': return 'warn';
      case 'INFO': return 'info';
      case 'DEBUG': return 'log';
      case 'TRACE': return 'trace';
      default: return 'log';
    }
  }

  /**
   * Gets color for log level
   */
  _getLevelColor(level) {
    const colors = {
      ERROR: '#ff4444',
      WARN: '#ffaa00',
      INFO: '#4444ff',
      DEBUG: '#888888',
      TRACE: '#666666'
    };
    return colors[level];
  }

  // Public logging methods
  error(message, data = null, source = null) {
    this._log('ERROR', message, data, source);
    if (data instanceof Error) {
      this.errorEntries.push(new ErrorEntry(data, { message, source }));
      if (this.errorEntries.length > LOGGER_CONFIG.MAX_ERROR_ENTRIES) {
        this.errorEntries.shift();
      }
    }
  }

  warn(message, data = null, source = null) {
    this._log('WARN', message, data, source);
  }

  info(message, data = null, source = null) {
    this._log('INFO', message, data, source);
  }

  debug(message, data = null, source = null) {
    this._log('DEBUG', message, data, source);
  }

  trace(message, data = null, source = null) {
    this._log('TRACE', message, data, source);
  }

  // Performance monitoring methods
  time(label, source = null) {
    const key = source ? `${source}:${label}` : label;
    this.performanceMarks.set(key, {
      label,
      source,
      startTime: performance.now(),
      timestamp: Date.now()
    });
  }

  timeEnd(label, source = null) {
    const key = source ? `${source}:${label}` : label;
    const mark = this.performanceMarks.get(key);
    
    if (!mark) {
      this.warn(`Performance mark not found: ${label}`, { source });
      return 0;
    }

    const duration = performance.now() - mark.startTime;
    this.performanceMarks.delete(key);

    const entry = new PerformanceEntry(label, duration, { source });
    this.performanceEntries.push(entry);

    if (this.performanceEntries.length > LOGGER_CONFIG.MAX_PERFORMANCE_ENTRIES) {
      this.performanceEntries.shift();
    }

    const logLevel = duration > LOGGER_CONFIG.SLOW_OPERATION_THRESHOLD ? 'WARN' : 'DEBUG';
    this._log(logLevel, `Performance: ${label} completed in ${duration.toFixed(2)}ms`, { duration, source }, source);

    return duration;
  }

  // Utility methods
  addFilter(filterFn) {
    this.filters.add(filterFn);
  }

  removeFilter(filterFn) {
    this.filters.delete(filterFn);
  }

  addTransformer(level, transformerFn) {
    this.transformers.set(level, transformerFn);
  }

  removeTransformer(level) {
    this.transformers.delete(level);
  }

  mute() {
    this.muted = true;
    this.info('Logger muted');
  }

  unmute() {
    this.muted = false;
    this.info('Logger unmuted');
  }

  // Data retrieval methods
  getRecentLogs(limit = 50) {
    return this.logHistory.slice(-limit).map(entry => entry.toJSON());
  }

  getLogsByLevel(level, limit = 50) {
    return this.logHistory
      .filter(entry => entry.level === level)
      .slice(-limit)
      .map(entry => entry.toJSON());
  }

  getPerformanceData(limit = 50) {
    return this.performanceEntries.slice(-limit).map(entry => entry.toJSON());
  }

  getErrorData(limit = 20) {
    return this.errorEntries.slice(-limit).map(entry => entry.toJSON());
  }

  getMemoryData(limit = 50) {
    return this.memoryChecks.slice(-limit);
  }

  // Statistics and analysis
  getStats() {
    const levelCounts = {};
    Object.keys(LOGGER_CONFIG.LOG_LEVELS).forEach(level => {
      levelCounts[level] = this.logHistory.filter(entry => entry.level === level).length;
    });

    const avgPerformance = this.performanceEntries.length > 0 
      ? this.performanceEntries.reduce((sum, entry) => sum + entry.duration, 0) / this.performanceEntries.length
      : 0;

    return {
      totalLogs: this.logHistory.length,
      levelCounts,
      totalPerformanceEntries: this.performanceEntries.length,
      averagePerformance: avgPerformance,
      slowOperations: this.performanceEntries.filter(entry => entry.isSlow).length,
      totalErrors: this.errorEntries.length,
      memoryChecks: this.memoryChecks.length,
      activeLoggers: this.loggers.size,
      currentLogLevel: this.currentLogLevel,
      isMuted: this.muted
    };
  }

  // Cleanup methods
  clearHistory() {
    const logCount = this.logHistory.length;
    const perfCount = this.performanceEntries.length;
    const errorCount = this.errorEntries.length;
    
    this.logHistory = [];
    this.performanceEntries = [];
    this.errorEntries = [];
    this.memoryChecks = [];
    
    this.info(`Cleared history: ${logCount} logs, ${perfCount} performance entries, ${errorCount} errors`);
  }

  // Export functionality
  exportLogs() {
    return {
      metadata: {
        exportTime: Date.now(),
        totalLogs: this.logHistory.length,
        logLevel: this.currentLogLevel,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      },
      logs: this.logHistory.map(entry => entry.toJSON()),
      performance: this.performanceEntries.map(entry => entry.toJSON()),
      errors: this.errorEntries.map(entry => entry.toJSON()),
      memory: this.memoryChecks,
      stats: this.getStats()
    };
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Create convenient global methods
const logger = {
  error: (message, data, source) => debugLogger.error(message, data, source),
  warn: (message, data, source) => debugLogger.warn(message, data, source),
  info: (message, data, source) => debugLogger.info(message, data, source),
  debug: (message, data, source) => debugLogger.debug(message, data, source),
  trace: (message, data, source) => debugLogger.trace(message, data, source),
  time: (label, source) => debugLogger.time(label, source),
  timeEnd: (label, source) => debugLogger.timeEnd(label, source),
  getLogger: (name) => debugLogger.getLogger(name),
  setLogLevel: (level) => debugLogger.setLogLevel(level),
  getStats: () => debugLogger.getStats(),
  exportLogs: () => debugLogger.exportLogs(),
  clearHistory: () => debugLogger.clearHistory()
};

export default logger;
export { DebugLogger, LOGGER_CONFIG };