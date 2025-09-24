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

declare global {
  interface Window {
    __passivePatched__?: boolean
  }
}

export function applyPassiveScrollOptimization() {
  if(typeof window === 'undefined') return
  if(window.__passivePatched__) return

  const original = EventTarget.prototype.addEventListener
  const patched: typeof original = function(this: EventTarget, type, listener, options){
    let normalized = options
    if(type.startsWith('touch') || type==='wheel' || type==='scroll'){
      if(typeof normalized === 'boolean') normalized = { capture: normalized, passive: true }
      else if(typeof normalized === 'object' && normalized !== null) normalized = { ...normalized, passive: true }
      else normalized = { passive: true }
    }
    return original.call(this, type, listener, normalized)
  }

  EventTarget.prototype.addEventListener = patched
  window.__passivePatched__ = true
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const mobileOptimizations = { auditTouchTargets, applyPassiveScrollOptimization, prefersReducedMotion }
void mobileOptimizations

