// Mobile optimization helpers (Stage 3)
export interface TouchTargetReport { node: HTMLElement; width: number; height: number; meetsStandard: boolean }

export function auditTouchTargets(minSize = 44): TouchTargetReport[] {
  if(typeof document === 'undefined') return []
  const elements = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"], input, textarea'))
  return elements.map(el => {
    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    return { node: el, width: w, height: h, meetsStandard: w>=minSize && h>=minSize }
  })
}

export function applyPassiveScrollOptimization() {
  if(typeof window === 'undefined') return
  // Force passive listeners for scroll & touch events to improve FPS
  const original = EventTarget.prototype.addEventListener
  // @ts-expect-error augment
  if(!('___passivePatched' in window)){
    // @ts-expect-error mark
    window.___passivePatched = true
    // @ts-expect-error override
    EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: any){
      if(type.startsWith('touch') || type==='wheel' || type==='scroll'){
        if(typeof options === 'boolean') options = { capture: options, passive: true }
        else if(typeof options === 'object') options = {...options, passive: true }
        else options = { passive: true }
      }
      return original.call(this, type, listener, options)
    }
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const mobileOptimizations = { auditTouchTargets, applyPassiveScrollOptimization, prefersReducedMotion }
void mobileOptimizations

