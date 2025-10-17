import * as React from 'react'
import {useSwipeable} from 'react-swipeable'

export interface UseGesturesOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  trackMouse?: boolean
  longPressMs?: number
  onLongPress?: (e: PointerEvent) => void
}

export function useGestures(opts: UseGesturesOptions = {}) {
  const {threshold=12,trackMouse=false,longPressMs=450} = opts
  const longPressRef = React.useRef<number | null>(null)
  const targetRef = React.useRef<HTMLElement | null>(null)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => opts.onSwipeLeft?.(),
    onSwipedRight: () => opts.onSwipeRight?.(),
    onSwipedUp: () => opts.onSwipeUp?.(),
    onSwipedDown: () => opts.onSwipeDown?.(),
    delta: threshold,
    trackMouse,
    preventScrollOnSwipe: true
  })

  const bindLongPress = React.useCallback((el: HTMLElement | null) => {
    if(!el) return
    targetRef.current = el
    const handleDown = (e: PointerEvent) => {
      if(longPressRef.current) window.clearTimeout(longPressRef.current)
      longPressRef.current = window.setTimeout(()=> {
        opts.onLongPress?.(e)
      }, longPressMs)
    }
    const clear = () => { if(longPressRef.current){ window.clearTimeout(longPressRef.current); longPressRef.current=null } }
    el.addEventListener('pointerdown', handleDown)
    el.addEventListener('pointerup', clear)
    el.addEventListener('pointerleave', clear)
    el.addEventListener('pointercancel', clear)
  },[longPressMs, opts])

  React.useEffect(()=> () => { if(longPressRef.current) window.clearTimeout(longPressRef.current) },[])

  return { swipeHandlers, bindLongPress }
}
void useGestures

