/**
 * Common logging utility for centralized log management
 * Provides consistent logging patterns and easy production/development control
 */

// Log levels
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// Current log level - can be controlled by environment
let CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.WARN 
  : LOG_LEVELS.DEBUG

/**
 * Debug logger - replaces [DEBUG_LOG] console.log calls
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const debugLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.log(`[DEBUG_LOG] ${message}`, ...args)
  }
}

/**
 * Info logger
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const infoLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
    console.info(`[INFO] ${message}`, ...args)
  }
}

/**
 * Warning logger
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const warnLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
    console.warn(`[WARN] ${message}`, ...args)
  }
}

/**
 * Error logger
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const errorLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
    console.error(`[ERROR] ${message}`, ...args)
  }
}

/**
 * WebSocket specific logger
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const wsLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.log(`[WS_LOG] ${message}`, ...args)
  }
}

/**
 * React Query specific logger
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const queryLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.log(`[QUERY_LOG] ${message}`, ...args)
  }
}

/**
 * Game specific logger
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const gameLog = (message, ...args) => {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.log(`[GAME_LOG] ${message}`, ...args)
  }
}

/**
 * Generic logger that accepts level
 * @param {number} level - Log level
 * @param {string} prefix - Log prefix
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const log = (level, prefix, message, ...args) => {
  if (CURRENT_LOG_LEVEL <= level) {
    const logFunction = level === LOG_LEVELS.ERROR ? console.error :
                       level === LOG_LEVELS.WARN ? console.warn :
                       level === LOG_LEVELS.INFO ? console.info :
                       console.log
    
    logFunction(`[${prefix}] ${message}`, ...args)
  }
}

/**
 * Set log level dynamically (for development/testing)
 * @param {number} level - New log level
 */
export const setLogLevel = (level) => {
  if (process.env.NODE_ENV !== 'production') {
    CURRENT_LOG_LEVEL = level
  }
}

/**
 * Get current log level
 * @returns {number} Current log level
 */
export const getLogLevel = () => CURRENT_LOG_LEVEL

// Default export for backward compatibility
export default {
  debugLog,
  infoLog,
  warnLog,
  errorLog,
  wsLog,
  queryLog,
  gameLog,
  log,
  setLogLevel,
  getLogLevel,
  LOG_LEVELS
}