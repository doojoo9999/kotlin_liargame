import { useCallback, useEffect, useRef } from 'react'

/**
 * Custom hook for managing auto-scroll functionality in chat
 * Handles scrolling to bottom when new messages arrive with configurable delay
 * 
 * @param {Object} params - Configuration object
 * @param {React.RefObject} params.listRef - Reference to the react-window List component
 * @param {number} params.itemCount - Total number of items in the list
 * @param {boolean} params.enabled - Whether auto-scroll is enabled
 * @param {Function} params.onBottom - Callback function to call when scrolled to bottom
 * @param {number} params.delayMs - Delay in milliseconds before scrolling (default: 50)
 * @returns {Function} scrollToBottom - Function to manually trigger scroll to bottom
 */
export const useChatAutoScroll = ({ 
  listRef, 
  itemCount, 
  enabled, 
  onBottom, 
  delayMs = 50 
}) => {
  const prevItemCountRef = useRef(0)
  
  const scrollToBottom = useCallback(() => {
    if (listRef.current && itemCount > 0) {
      listRef.current.scrollToItem(itemCount - 1, 'end')
      onBottom?.()
    }
  }, [listRef, itemCount, onBottom])
  
  useEffect(() => {
    if (enabled && itemCount > prevItemCountRef.current) {
      const timeoutId = setTimeout(scrollToBottom, delayMs)
      
      // Cleanup function to clear timeout
      return () => clearTimeout(timeoutId)
    }
    
    // Update previous item count reference
    prevItemCountRef.current = itemCount
  }, [itemCount, enabled, scrollToBottom, delayMs])
  
  return scrollToBottom
}