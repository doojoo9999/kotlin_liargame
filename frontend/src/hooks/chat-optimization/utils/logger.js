/**
 * Chat optimization specific logger
 * Wraps the existing logger with chat-specific functionality
 * Maintains compatibility with existing [DEBUG_LOG] format
 */

import { debugLog, infoLog, warnLog, errorLog } from '../../../utils/logger.js'
import { isDebugEnabled } from './env.js'

/**
 * Chat optimization debug logger
 * Only logs when debugMode is true and in development environment
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const chatDebugLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    debugLog(message, ...args)
  }
}

/**
 * Chat optimization info logger
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const chatInfoLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    infoLog(`[CHAT_OPT] ${message}`, ...args)
  }
}

/**
 * Chat optimization warning logger
 * Always logs warnings regardless of debug mode
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const chatWarnLog = (message, ...args) => {
  warnLog(`[CHAT_OPT] ${message}`, ...args)
}

/**
 * Chat optimization error logger
 * Always logs errors regardless of debug mode
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const chatErrorLog = (message, ...args) => {
  errorLog(`[CHAT_OPT] ${message}`, ...args)
}

/**
 * Message queue specific logger
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const queueLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    debugLog(`[QUEUE] ${message}`, ...args)
  }
}

/**
 * Performance metrics specific logger
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const perfLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    debugLog(`[PERF] ${message}`, ...args)
  }
}

/**
 * Memory cleanup specific logger
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const memoryLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    debugLog(`[MEMORY] ${message}`, ...args)
  }
}

/**
 * Mobile optimization specific logger
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const mobileLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    debugLog(`[MOBILE] ${message}`, ...args)
  }
}

/**
 * Virtual scroll specific logger
 * @param {boolean} debugMode - Debug mode flag from hook options
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export const virtualScrollLog = (debugMode, message, ...args) => {
  if (isDebugEnabled(debugMode)) {
    debugLog(`[VSCROLL] ${message}`, ...args)
  }
}

export default {
  chatDebugLog,
  chatInfoLog,
  chatWarnLog,
  chatErrorLog,
  queueLog,
  perfLog,
  memoryLog,
  mobileLog,
  virtualScrollLog
}