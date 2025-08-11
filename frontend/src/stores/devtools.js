import {devtools} from 'zustand/middleware'

const isDevelopment = import.meta.env.MODE === 'development'

export const createDevtools = (name, options = {}) => {
  if (!isDevelopment) {
    return (config) => config
  }

  return devtools(config => config, {
    name: `GameStore_${name}`,
    serialize: true,
    ...options
  })
}

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

export const performanceMonitor = (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  const wrappedConfig = config(set, get, api)
  
  const monitoredConfig = {}
  
  for (const [key, value] of Object.entries(wrappedConfig)) {
    if (typeof value === 'function') {
      monitoredConfig[key] = (...args) => {
        const startTime = performance.now()
        const result = value(...args)
        
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

export const debugPersist = (name) => (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  const wrappedSet = (...args) => {
    set(...args)
    
    try {
      const state = get()
      localStorage.setItem(`debug_${name}_state`, JSON.stringify(state, null, 2))
    } catch (error) {
      console.warn(`Failed to save debug state for ${name}:`, error)
    }
  }

  return config(wrappedSet, get, api)
}

export const actionTracker = (config) => (set, get, api) => {
  if (!isDevelopment) {
    return config(set, get, api)
  }

  if (!window.__ZUSTAND_ACTION_TRACKER__) {
    window.__ZUSTAND_ACTION_TRACKER__ = {}
  }

  const wrappedConfig = config(set, get, api)
  const trackedConfig = {}
  
  for (const [key, value] of Object.entries(wrappedConfig)) {
    if (typeof value === 'function') {
      trackedConfig[key] = (...args) => {
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

export const logActionStats = () => {
  if (isDevelopment && window.__ZUSTAND_ACTION_TRACKER__) {
    console.table(window.__ZUSTAND_ACTION_TRACKER__)
  }
}

export const resetActionTracker = () => {
  if (isDevelopment) {
    window.__ZUSTAND_ACTION_TRACKER__ = {}
    console.log('🔄 Action tracker reset')
  }
}

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

  return createDevtools(name, devtoolsOptions)(enhancedConfig)
}

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