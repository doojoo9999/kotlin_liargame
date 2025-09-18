import * as React from 'react'
import {useSwipeable} from 'react-swipeable'
import {cn} from '@/lib/utils'

export interface SwipeContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  trackMouse?: boolean
  threshold?: number
}

export const SwipeContainer = React.forwardRef<HTMLDivElement, SwipeContainerProps>(({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  trackMouse = false,
  threshold = 12,
  className,
  children,
  ...rest
}, ref) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipeLeft?.(),
    onSwipedRight: () => onSwipeRight?.(),
    onSwipedUp: () => onSwipeUp?.(),
    onSwipedDown: () => onSwipeDown?.(),
    trackMouse,
    delta: threshold,
    preventScrollOnSwipe: true
  })

  const { ref: swipeRef, ...swipeHandlers } = handlers

  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    swipeRef(node)
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }, [ref, swipeRef])

  return (
    <div ref={combinedRef} {...swipeHandlers} className={cn('touch-pan-y touch-pan-x', className)} {...rest}>
      {children}
    </div>
  )
})
SwipeContainer.displayName = 'SwipeContainer'

