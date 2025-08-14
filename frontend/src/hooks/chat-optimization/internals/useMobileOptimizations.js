/**
 * Mobile optimizations hook for device-specific performance tuning
 * Handles mobile device detection and parameter adjustments
 */

import { useMemo } from 'react'
import { mobileLog } from '../utils/logger.js'

/**
 * Default mobile user agent patterns
 */
const DEFAULT_MOBILE_PATTERNS = [
  'Android',
  'webOS',
  'iPhone',
  'iPad',
  'iPod',
  'BlackBerry',
  'IEMobile',
  'Opera Mini'
]

/**
 * Custom hook for mobile-specific optimizations
 * @param {import('./types.js').MobileOptimizationOptions} options - Mobile optimization configuration
 * @returns {import('./types.js').MobileOptimizations} Mobile optimization settings
 */
export const useMobileOptimizations = ({
  batchSize = 20,
  throttleDelay = 100,
  getUserAgent = null
}) => {
  const optimizations = useMemo(() => {
    // Get user agent safely with optional injection for testing
    const userAgent = getUserUserAgentSafely(getUserAgent)
    
    // Detect if device is mobile
    const isMobile = detectMobileDevice(userAgent)
    
    if (!isMobile) {
      mobileLog(false, 'Desktop device detected, no mobile optimizations applied')
      return {}
    }

    // Apply mobile-specific optimizations
    const reducedBatchSize = Math.floor(batchSize / 2)
    const increasedThrottleDelay = throttleDelay * 1.5

    mobileLog(false, `Mobile device detected, applying optimizations: batchSize ${batchSize} -> ${reducedBatchSize}, throttleDelay ${throttleDelay} -> ${increasedThrottleDelay}`)

    return {
      reducedBatchSize,
      increasedThrottleDelay,
      isMobile: true,
      deviceInfo: {
        userAgent,
        estimatedPerformance: getEstimatedPerformanceLevel(userAgent),
        recommendedSettings: getRecommendedMobileSettings(userAgent)
      }
    }
  }, [batchSize, throttleDelay, getUserAgent])

  return optimizations
}

/**
 * Get user agent string safely with error handling
 * @param {function(): string} [getUserAgentFn] - Optional user agent provider function
 * @returns {string} User agent string or empty string if unavailable
 */
function getUserUserAgentSafely(getUserAgentFn = null) {
  try {
    // Use injected function if provided (for testing)
    if (typeof getUserAgentFn === 'function') {
      return getUserAgentFn()
    }
    
    // Use navigator.userAgent if available
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent
    }
    
    return ''
  } catch (error) {
    mobileLog(false, `Error accessing user agent: ${error.message}`)
    return ''
  }
}

/**
 * Detect if the current device is mobile based on user agent
 * @param {string} userAgent - User agent string
 * @returns {boolean} True if mobile device detected
 */
function detectMobileDevice(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return false
  }

  try {
    const regex = new RegExp(DEFAULT_MOBILE_PATTERNS.join('|'), 'i')
    return regex.test(userAgent)
  } catch (error) {
    mobileLog(false, `Error in mobile detection: ${error.message}`)
    return false
  }
}

/**
 * Estimate device performance level based on user agent patterns
 * @param {string} userAgent - User agent string
 * @returns {string} Performance level: 'high', 'medium', 'low'
 */
function getEstimatedPerformanceLevel(userAgent) {
  if (!userAgent) return 'medium'

  try {
    const ua = userAgent.toLowerCase()

    // High performance indicators
    const highPerformancePatterns = [
      'iphone.*os 1[4-9]', // iOS 14+
      'android.*chrome.*1[0-9][0-9]', // Recent Chrome on Android
      'ipad.*os 1[4-9]' // iPadOS 14+
    ]

    // Low performance indicators
    const lowPerformancePatterns = [
      'android.*[2-4]\\.', // Android 2-4
      'iphone.*os [5-9]\\.', // iOS 5-9
      'opera mini',
      'blackberry'
    ]

    for (const pattern of highPerformancePatterns) {
      if (new RegExp(pattern, 'i').test(ua)) {
        return 'high'
      }
    }

    for (const pattern of lowPerformancePatterns) {
      if (new RegExp(pattern, 'i').test(ua)) {
        return 'low'
      }
    }

    return 'medium'
  } catch (error) {
    mobileLog(false, `Error estimating performance level: ${error.message}`)
    return 'medium'
  }
}

/**
 * Get recommended settings based on device type and performance
 * @param {string} userAgent - User agent string
 * @returns {Object} Recommended settings object
 */
function getRecommendedMobileSettings(userAgent) {
  const performanceLevel = getEstimatedPerformanceLevel(userAgent)

  const settings = {
    high: {
      maxMessages: 50000,
      batchSizeMultiplier: 0.75, // Less aggressive reduction
      throttleDelayMultiplier: 1.25,
      memoryCleanupInterval: 30000,
      enableVirtualization: true
    },
    medium: {
      maxMessages: 25000,
      batchSizeMultiplier: 0.5,  // Standard mobile optimization
      throttleDelayMultiplier: 1.5,
      memoryCleanupInterval: 20000,
      enableVirtualization: true
    },
    low: {
      maxMessages: 10000,
      batchSizeMultiplier: 0.25, // Aggressive reduction
      throttleDelayMultiplier: 2.0,
      memoryCleanupInterval: 10000,
      enableVirtualization: true
    }
  }

  return settings[performanceLevel] || settings.medium
}

/**
 * Hook variant that provides detailed mobile optimization analysis
 * @param {Object} options - Configuration options
 * @returns {Object} Detailed mobile optimization data
 */
export const useDetailedMobileOptimizations = (options) => {
  const basicOptimizations = useMobileOptimizations(options)

  const detailedOptimizations = useMemo(() => {
    const userAgent = getUserUserAgentSafely(options.getUserAgent)
    const isMobile = detectMobileDevice(userAgent)

    return {
      ...basicOptimizations,
      analysis: {
        userAgent,
        isMobile,
        detectedPatterns: DEFAULT_MOBILE_PATTERNS.filter(pattern => 
          userAgent.toLowerCase().includes(pattern.toLowerCase())
        ),
        performanceLevel: getEstimatedPerformanceLevel(userAgent),
        recommendations: getRecommendedMobileSettings(userAgent)
      },
      
      /**
       * Apply recommendations to current settings
       * @param {Object} currentSettings - Current optimization settings
       * @returns {Object} Optimized settings for mobile
       */
      applyRecommendations: (currentSettings) => {
        if (!isMobile) return currentSettings

        const recommendations = getRecommendedMobileSettings(userAgent)
        
        return {
          ...currentSettings,
          maxMessages: Math.min(currentSettings.maxMessages || Infinity, recommendations.maxMessages),
          batchSize: Math.floor((currentSettings.batchSize || 20) * recommendations.batchSizeMultiplier),
          throttleDelay: Math.floor((currentSettings.throttleDelay || 100) * recommendations.throttleDelayMultiplier),
          enableVirtualization: currentSettings.enableVirtualization ?? recommendations.enableVirtualization
        }
      }
    }
  }, [basicOptimizations, options.getUserAgent])

  return detailedOptimizations
}

/**
 * Utility function to check if device is likely to have performance constraints
 * @param {string} [userAgent] - Optional user agent string
 * @returns {boolean} True if device likely has performance constraints
 */
export const hasPerformanceConstraints = (userAgent = null) => {
  const ua = getUserUserAgentSafely(() => userAgent)
  const isMobile = detectMobileDevice(ua)
  const performanceLevel = getEstimatedPerformanceLevel(ua)
  
  return isMobile && (performanceLevel === 'low' || performanceLevel === 'medium')
}

export default useMobileOptimizations