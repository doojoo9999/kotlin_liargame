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
  onSwipeLeft,onSwipeRight,onSwipeUp,onSwipeDown,trackMouse=false,threshold=12,className,children,...rest
},ref) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipeLeft?.(),
    onSwipedRight: () => onSwipeRight?.(),
    onSwipedUp: () => onSwipeUp?.(),
    onSwipedDown: () => onSwipeDown?.(),
    trackMouse,
    delta: threshold,
    preventScrollOnSwipe: true
  })
  return (
    <div ref={ref} {...handlers} className={cn('touch-pan-y touch-pan-x', className)} {...rest}>
      {children}
    </div>
  )
})
SwipeContainer.displayName='SwipeContainer'
void SwipeContainer

