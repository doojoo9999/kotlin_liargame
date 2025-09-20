import {useEffect, useMemo, useState} from 'react'
import {animationVariants} from '@/animations/variants'
import {transitions} from '@/animations/transitions'

export interface UseAnimationsOptions { reduceMotion?: boolean }

export function useAnimations(opts: UseAnimationsOptions = {}) {
  const [prefersReduced,setPrefersReduced] = useState(false)
  useEffect(()=>{
    if(opts.reduceMotion) { setPrefersReduced(true); return }
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setPrefersReduced(m.matches)
    handler();
    m.addEventListener('change', handler)
    return () => m.removeEventListener('change', handler)
  },[opts.reduceMotion])

  return useMemo(()=>({
    variants: animationVariants,
    transitions,
    disabled: prefersReduced
  }),[prefersReduced])
}
void useAnimations

