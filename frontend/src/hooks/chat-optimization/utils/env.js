/**
 * Environment detection utilities for chat optimization
 * Provides consistent environment checks and feature flags
 */

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
  // Vite uses import.meta.env.DEV
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.DEV
  }
  
  // Fallback for other bundlers
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development'
  }
  
  return false
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
  // Vite uses import.meta.env.PROD
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD
  }
  
  // Fallback for other bundlers
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production'
  }
  
  return true // Default to production for safety
}

/**
 * Get environment name
 * @returns {string} Environment name (development, production, test)
 */
export const getEnvironment = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE || 'production'
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'production'
  }
  
  return 'production'
}

/**
 * Check if performance monitoring should be enabled
 * @returns {boolean} True if performance monitoring is enabled
 */
export const isPerformanceMonitoringEnabled = () => {
  return isDevelopment() || (typeof window !== 'undefined' && window.performance)
}

/**
 * Check if debug logging should be enabled
 * @param {boolean} debugMode - Explicit debug mode flag
 * @returns {boolean} True if debug logging should be enabled
 */
export const isDebugEnabled = (debugMode = false) => {
  return debugMode && isDevelopment()
}

export default {
  isDevelopment,
  isProduction,
  getEnvironment,
  isPerformanceMonitoringEnabled,
  isDebugEnabled
}