import {devtools} from 'zustand/middleware'

/**
 * Development tools configuration for Zustand stores
 * Provides Redux DevTools integration and logging
 */

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development'

/**
 * Creates a devtools middleware configuration for a store
 * @param {string} name - Name of the store for DevTools
 * @param {Object} options - Additional devtools options
 * @returns {Function} Devtools middleware
 */
export const createDevtools = (name, options = {}) => {
  if (!isDevelopment) {
    // In production, return a no-op middleware
    return (config) => config
  }

  return devtools(config => config, {
    name: `GameStore_${name}`,
    serialize: true,
    ...options
  })
}

/**
 * Logger middleware for development
 * Logs all state changes to console
 */
export const logger = (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  return config(
    (...args) => {
      const prevState = get()
      set(...args)
      const nextState = get()
      
      console.group(`🔄 Store Update - ${api.name || 'Unknown'}`)
      console.log('Previous State:', prevState)
      console.log('Next State:', nextState)
      console.groupEnd()
    },
    get,
    api
  )
}

/**
 * Performance monitoring middleware
 * Tracks action execution times
 */
export const performanceMonitor = (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  const wrappedConfig = config(set, get, api)
  
  // Wrap all functions to monitor performance
  const monitoredConfig = {}
  
  for (const [key, value] of Object.entries(wrappedConfig)) {
    if (typeof value === 'function') {
      monitoredConfig[key] = (...args) => {
        const startTime = performance.now()
        const result = value(...args)
        
        // Handle both sync and async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            const endTime = performance.now()
            console.log(`⏱️ ${key} took ${(endTime - startTime).toFixed(2)}ms`)
          })
        } else {
          const endTime = performance.now()
          console.log(`⏱️ ${key} took ${(endTime - startTime).toFixed(2)}ms`)
          return result
        }
      }
    } else {
      monitoredConfig[key] = value
    }
  }
  
  return monitoredConfig
}

/**
 * State persistence middleware for debugging
 * Saves state snapshots to localStorage
 */
export const debugPersist = (name) => (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  const wrappedSet = (...args) => {
    set(...args)
    
    // Save state snapshot
    try {
      const state = get()
      localStorage.setItem(`debug_${name}_state`, JSON.stringify(state, null, 2))
    } catch (error) {
      console.warn(`Failed to save debug state for ${name}:`, error)
    }
  }

  return config(wrappedSet, get, api)
}

/**
 * Action tracking middleware
 * Tracks which actions are called and how often
 */
export const actionTracker = (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  // Initialize action counter
  if (!window.__ZUSTAND_ACTION_TRACKER__) {
    window.__ZUSTAND_ACTION_TRACKER__ = {}
  }

  const wrappedConfig = config(set, get, api)
  const trackedConfig = {}
  
  for (const [key, value] of Object.entries(wrappedConfig)) {
    if (typeof value === 'function') {
      trackedConfig[key] = (...args) => {
        // Track action call
        const storeName = api.name || 'Unknown'
        const actionKey = `${storeName}.${key}`
        
        if (!window.__ZUSTAND_ACTION_TRACKER__[actionKey]) {
          window.__ZUSTAND_ACTION_TRACKER__[actionKey] = 0
        }
        window.__ZUSTAND_ACTION_TRACKER__[actionKey]++
        
        console.log(`🎯 Action: ${actionKey} (called ${window.__ZUSTAND_ACTION_TRACKER__[actionKey]} times)`)
        
        return value(...args)
      }
    } else {
      trackedConfig[key] = value
    }
  }
  
  return trackedConfig
}

/**
 * Utility function to log current action tracker stats
 */
export const logActionStats = () => {
  if (isDevelopment && window.__ZUSTAND_ACTION_TRACKER__) {
    console.table(window.__ZUSTAND_ACTION_TRACKER__)
  }
}

/**
 * Utility function to reset action tracker
 */
export const resetActionTracker = () => {
  if (isDevelopment) {
    window.__ZUSTAND_ACTION_TRACKER__ = {}
    console.log('🔄 Action tracker reset')
  }
}

/**
 * Combined development middleware
 * Applies all development tools in the correct order
 */
export const withDevtools = (name, config, options = {}) => {
  if (!isDevelopment) {
    return config
  }

  const {
    enableLogger = true,
    enablePerformanceMonitor = true,
    enableActionTracker = true,
    enableDebugPersist = false,
    devtoolsOptions = {}
  } = options

  let enhancedConfig = config

  // Apply middlewares in order
  if (enableDebugPersist) {
    enhancedConfig = debugPersist(name)(enhancedConfig)
  }
  
  if (enableActionTracker) {
    enhancedConfig = actionTracker(enhancedConfig)
  }
  
  if (enablePerformanceMonitor) {
    enhancedConfig = performanceMonitor(enhancedConfig)
  }
  
  if (enableLogger) {
    enhancedConfig = logger(enhancedConfig)
  }

  // Apply devtools last
  return createDevtools(name, devtoolsOptions)(enhancedConfig)
}

// Export development utilities
export const devUtils = {
  logActionStats,
  resetActionTracker,
  getDebugState: (storeName) => {
    if (isDevelopment) {
      try {
        const state = localStorage.getItem(`debug_${storeName}_state`)
        return state ? JSON.parse(state) : null
      } catch (error) {
        console.warn(`Failed to get debug state for ${storeName}:`, error)
        return null
      }
    }
    return null
  }
}

export default {
  createDevtools,
  logger,
  performanceMonitor,
  debugPersist,
  actionTracker,
  withDevtools,
  devUtils
}