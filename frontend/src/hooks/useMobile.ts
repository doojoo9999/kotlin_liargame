import * as React from 'react'

export interface MobileState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
  prefersReducedMotion: boolean
}

const getOrientation = () => (window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait') as 'portrait'|'landscape'

function deriveState(): MobileState {
  const w = window.innerWidth
  const h = window.innerHeight
  return {
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
    width: w,
    height: h,
    orientation: getOrientation(),
    isTouch: matchMedia('(pointer: coarse)').matches,
    prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

export function useMobile() {
  const [state,setState] = React.useState<MobileState>(() => (typeof window === 'undefined'? {
    isMobile:false,isTablet:false,isDesktop:true,width:0,height:0,orientation:'portrait',isTouch:false,prefersReducedMotion:false
  }: deriveState()))

  React.useEffect(()=> {
    const onResize = () => setState(deriveState())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  },[])

  return state
}
void useMobile

