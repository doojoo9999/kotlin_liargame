import { useLayoutEffect, useState } from 'react'

/**
 * Custom hook for tracking element height using ResizeObserver
 * Provides dynamic height calculation with proper cleanup
 * 
 * @param {React.RefObject} containerRef - Reference to the container element to observe
 * @param {number} initial - Initial height value (default: 400)
 * @returns {number} Current height of the observed container
 */
export const useResizeObserverHeight = (containerRef, initial = 400) => {
  const [containerHeight, setContainerHeight] = useState(initial)
  
  useLayoutEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const clientHeight = containerRef.current.clientHeight
        if (clientHeight > 0) {
          setContainerHeight(clientHeight)
        }
      }
    }
    
    // Initial height calculation
    updateContainerHeight()
    
    // Set up ResizeObserver for dynamic height tracking
    const resizeObserver = new ResizeObserver(updateContainerHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    // Cleanup function to disconnect observer
    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])
  
  return containerHeight
}