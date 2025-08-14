/**
 * Virtual scroll helpers hook for optimized list rendering
 * Provides utilities for virtual scrolling with react-window or similar libraries
 */

import { useMemo } from 'react'
import { virtualScrollLog } from '../utils/logger.js'

/**
 * Custom hook for virtual scrolling helpers
 * @param {import('./types.js').VirtualScrollOptions} options - Virtual scroll configuration
 * @returns {import('./types.js').VirtualScrollHelpers|null} Virtual scroll helper functions
 */
export const useVirtualScrollHelpers = ({
  enableVirtualization = true,
  itemHeight = 46
}) => {
  const helpers = useMemo(() => {
    if (!enableVirtualization) {
      return null
    }

    return {
      /**
       * Get the height of a single item in pixels
       * @returns {number} Item height in pixels
       */
      getItemHeight: () => {
        return itemHeight
      },

      /**
       * Get estimated total height for n items
       * @param {number} itemCount - Number of items
       * @returns {number} Estimated total height in pixels
       */
      getEstimatedTotalHeight: (itemCount) => {
        if (typeof itemCount !== 'number' || itemCount < 0) {
          return 0
        }
        return itemCount * itemHeight
      },

      /**
       * Determine if a list item should update based on props comparison
       * Used with React.memo or similar optimization techniques
       * @param {Object} prevProps - Previous props
       * @param {Object} nextProps - Next props
       * @returns {boolean} True if the item should update
       */
      shouldItemUpdate: (prevProps, nextProps) => {
        // Basic prop comparison for common cases
        if (prevProps.index !== nextProps.index) {
          return true
        }

        // Check if the data structure exists
        if (!prevProps.data || !nextProps.data) {
          return prevProps.data !== nextProps.data
        }

        // Check if messages array exists
        if (!prevProps.data.messages || !nextProps.data.messages) {
          return prevProps.data.messages !== nextProps.data.messages
        }

        // Check if the specific message at this index has changed
        const prevMessage = prevProps.data.messages[prevProps.index]
        const nextMessage = nextProps.data.messages[nextProps.index]

        // If both messages don't exist, no update needed
        if (!prevMessage && !nextMessage) {
          return false
        }

        // If one exists and the other doesn't, update needed
        if (!prevMessage || !nextMessage) {
          return true
        }

        // Compare message IDs if available
        if (prevMessage.id !== nextMessage.id) {
          return true
        }

        // Compare other key properties that might change
        if (prevMessage.content !== nextMessage.content ||
            prevMessage.timestamp !== nextMessage.timestamp ||
            prevMessage.sender !== nextMessage.sender ||
            prevMessage.type !== nextMessage.type) {
          return true
        }

        // No significant changes detected
        return false
      },

      /**
       * Get size information for variable-size lists
       * @param {number} index - Item index
       * @returns {number} Size of the item at given index
       */
      getItemSize: (index) => {
        // For now, return fixed size, but this could be extended
        // to support variable-height items based on content
        return itemHeight
      },

      /**
       * Get the key for a list item (for React keys)
       * @param {number} index - Item index
       * @param {Array} messages - Messages array
       * @returns {string|number} Unique key for the item
       */
      getItemKey: (index, messages) => {
        if (!messages || !messages[index]) {
          return index
        }

        const message = messages[index]
        return message.id || message.timestamp || index
      },

      /**
       * Utility to check if virtualization should be enabled based on item count
       * @param {number} itemCount - Number of items
       * @param {number} threshold - Threshold above which virtualization is recommended
       * @returns {boolean} True if virtualization is recommended
       */
      shouldVirtualize: (itemCount, threshold = 100) => {
        return itemCount > threshold
      },

      /**
       * Get optimization settings based on item count
       * @param {number} itemCount - Number of items
       * @returns {Object} Optimization settings
       */
      getOptimizationSettings: (itemCount) => {
        // For large lists, use more aggressive optimization
        if (itemCount > 10000) {
          return {
            overscanCount: 5,        // Render fewer off-screen items
            useIsScrolling: true,    // Enable scrolling indicator
            estimatedItemSize: itemHeight
          }
        } else if (itemCount > 1000) {
          return {
            overscanCount: 10,       // Moderate off-screen rendering
            useIsScrolling: true,
            estimatedItemSize: itemHeight
          }
        } else {
          return {
            overscanCount: 15,       // More off-screen items for smoother scrolling
            useIsScrolling: false,   // No need for scrolling indicator
            estimatedItemSize: itemHeight
          }
        }
      }
    }
  }, [enableVirtualization, itemHeight])

  return helpers
}

/**
 * Hook variant that provides additional utilities for advanced virtual scrolling
 * @param {Object} options - Configuration options
 * @returns {Object} Extended virtual scroll utilities
 */
export const useAdvancedVirtualScrollHelpers = ({
  enableVirtualization = true,
  itemHeight = 46,
  debugMode = false
}) => {
  const basicHelpers = useVirtualScrollHelpers({ enableVirtualization, itemHeight })

  const advancedHelpers = useMemo(() => {
    if (!enableVirtualization || !basicHelpers) {
      return null
    }

    return {
      ...basicHelpers,

      /**
       * Performance-aware item renderer that logs render statistics
       * @param {Function} renderItem - Original item renderer function
       * @returns {Function} Wrapped item renderer with performance logging
       */
      withPerformanceLogging: (renderItem) => {
        return (props) => {
          if (debugMode) {
            const startTime = performance.now()
            const result = renderItem(props)
            const renderTime = performance.now() - startTime
            
            if (renderTime > 16) { // Log slow renders (>1 frame at 60fps)
              virtualScrollLog(debugMode, `Slow item render: ${renderTime.toFixed(2)}ms for index ${props.index}`)
            }
            
            return result
          }
          return renderItem(props)
        }
      },

      /**
       * Create a memoized item component for better performance
       * @param {Function} ItemComponent - React component to memoize
       * @returns {Function} Memoized component
       */
      createMemoizedItem: (ItemComponent) => {
        // This would typically use React.memo with custom comparison
        // For now, return the original component with guidance
        virtualScrollLog(debugMode, 'Consider wrapping item component with React.memo for better performance')
        return ItemComponent
      }
    }
  }, [basicHelpers, debugMode, enableVirtualization])

  return advancedHelpers || basicHelpers
}

export default useVirtualScrollHelpers