/**
 * Type definitions and JSDoc documentation for chat optimization hooks
 * Defines the public API contract and internal interfaces
 */

/**
 * @typedef {Object} ChatOptimizationOptions
 * @property {number} [maxMessages=100000] - Maximum number of messages to keep in memory
 * @property {number} [throttleDelay=100] - Delay between batch processing in milliseconds
 * @property {number} [batchSize=20] - Number of messages to process per batch
 * @property {boolean} [enableVirtualization=true] - Enable virtual scrolling helpers
 * @property {boolean} [enableMessageLimiting=true] - Enable message count limiting
 * @property {boolean} [enableThrottling=true] - Enable message throttling/batching
 * @property {boolean} [debugMode=false] - Enable debug logging
 */

/**
 * @typedef {Object} PerformanceStats
 * @property {number} messagesProcessed - Total number of messages processed
 * @property {number} messagesDropped - Total number of messages dropped due to limits
 * @property {number} averageRenderTime - Average render time in milliseconds
 * @property {number} memoryUsage - Current memory usage in MB (if available)
 */

/**
 * @typedef {Object} VirtualScrollHelpers
 * @property {function(): number} getItemHeight - Get the height of a single item
 * @property {function(number): number} getEstimatedTotalHeight - Get estimated total height for n items
 * @property {function(Object, Object): boolean} shouldItemUpdate - Determine if item should update
 */

/**
 * @typedef {Object} MobileOptimizations
 * @property {number} [reducedBatchSize] - Reduced batch size for mobile devices
 * @property {number} [increasedThrottleDelay] - Increased throttle delay for mobile devices
 */

/**
 * @typedef {Object} PerformanceReport
 * @property {number} messagesProcessed - Total messages processed
 * @property {number} messagesDropped - Total messages dropped
 * @property {number} averageRenderTime - Average render time in milliseconds
 * @property {number} memoryUsage - Memory usage in MB
 * @property {number} currentMessageCount - Current number of messages
 * @property {number} queuedMessages - Number of queued messages
 * @property {boolean} isThrottling - Whether throttling is active
 * @property {number} averageMessageSize - Average message size in bytes
 * @property {number[]} renderTimes - Recent render times (last 10)
 */

/**
 * @typedef {Object} ChatOptimizationResult
 * @property {Array} messages - Array of chat messages
 * @property {function(Array|Object): void} addMessages - Add messages to the chat
 * @property {function(): void} clearMessages - Clear all messages
 * @property {boolean} isThrottling - Whether throttling is currently active
 * @property {PerformanceStats} performanceStats - Performance statistics
 * @property {VirtualScrollHelpers|null} virtualScrollHelpers - Virtual scrolling utilities
 * @property {function(): PerformanceReport} getPerformanceReport - Get detailed performance report
 * @property {MobileOptimizations} mobileOptimizations - Mobile-specific optimizations
 * @property {boolean} isOptimizationEnabled - Whether any optimization is enabled
 * @property {number} queueLength - Current length of the message queue
 */

/**
 * @typedef {Object} MessageQueueOptions
 * @property {boolean} enableThrottling - Enable throttling functionality
 * @property {number} batchSize - Size of each processing batch
 * @property {number} throttleDelay - Delay between batches
 * @property {boolean} debugMode - Enable debug logging
 * @property {function(Array): void} onBatchProcessed - Callback when batch is processed
 */

/**
 * @typedef {Object} MessageQueueResult
 * @property {function(Array): void} enqueue - Add messages to queue
 * @property {boolean} isThrottling - Whether throttling is active
 * @property {number} queueLength - Current queue length
 * @property {function(): void} flushNow - Force flush the queue immediately
 * @property {function(): void} dispose - Cleanup function
 */

/**
 * @typedef {Object} PerfMetricsOptions
 * @property {number} [windowSize=100] - Size of the sliding window for averages
 * @property {boolean} debugMode - Enable debug logging
 */

/**
 * @typedef {Object} PerfMetricsResult
 * @property {function(number): void} measure - Record a render time measurement
 * @property {Object} stats - Performance statistics
 * @property {number} stats.averageRenderTime - Average render time in milliseconds
 * @property {function(): void} reset - Reset all metrics
 * @property {function(): void} dispose - Cleanup function
 */

/**
 * @typedef {Object} MemoryCleanupOptions
 * @property {number} maxMessages - Maximum messages to keep
 * @property {boolean} enableLimit - Enable message limiting
 * @property {boolean} debugMode - Enable debug logging
 */

/**
 * @typedef {Object} MemoryCleanupResult
 * @property {function(Array): {nextList: Array, dropped: number}} clamp - Clamp message list to limits
 * @property {function(): void} schedule - Schedule next cleanup
 * @property {function(): void} dispose - Cleanup function
 * @property {Object} stats - Memory statistics
 * @property {number} stats.memoryUsage - Current memory usage in MB
 */

/**
 * @typedef {Object} VirtualScrollOptions
 * @property {boolean} enableVirtualization - Enable virtual scrolling
 * @property {number} [itemHeight=46] - Height of each item in pixels
 */

/**
 * @typedef {Object} MobileOptimizationOptions
 * @property {number} batchSize - Default batch size
 * @property {number} throttleDelay - Default throttle delay
 * @property {function(): string} [getUserAgent] - Custom user agent provider (for testing)
 */

export default {
  // Export empty object for JSDoc-only file
}