// Accessibility utilities for micro-interactions
// Provides prefers-reduced-motion support and accessible animation controls

import { useEffect, useState } from 'react'

// Hook to detect user's motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)
    
    // Listen for changes
    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}

// Accessible animation variants for framer-motion
export const accessibleVariants = {
  // Reduced motion variants
  reducedMotion: {
    hover: { scale: 1 },
    tap: { scale: 1 },
    focus: { scale: 1 },
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    transition: { duration: 0 }
  },
  
  // Full motion variants
  fullMotion: {
    hover: { scale: 1.02, y: -1 },
    tap: { scale: 0.98 },
    focus: { scale: 1.01 },
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
}

// CSS for reduced motion
export const reducedMotionCSS = `
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    
    /* Disable specific animations */
    .ripple-animation,
    .pulse-animation,
    .shake-animation,
    .bounce-animation {
      animation: none !important;
    }
  }
`

// Utility to get appropriate motion settings
export const getMotionSettings = (prefersReducedMotion, baseSettings = {}) => {
  if (prefersReducedMotion) {
    return {
      ...baseSettings,
      animate: baseSettings.animate || {},
      transition: { duration: 0 },
      whileHover: {},
      whileTap: {},
      whileFocus: {}
    }
  }
  
  return baseSettings
}

// Accessible button interactions that respect motion preferences
export const getAccessibleButtonProps = (prefersReducedMotion, variant = 'default') => {
  const baseProps = {
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.02, y: -1 },
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
  
  const variants = {
    default: baseProps,
    subtle: {
      whileTap: { scale: 0.98 },
      whileHover: { scale: 1.01, y: -0.5 },
      transition: { duration: 0.15 }
    },
    action: {
      whileTap: { scale: 0.95 },
      whileHover: { scale: 1.02, y: -2 },
      transition: { type: "spring", stiffness: 400, damping: 20 }
    }
  }
  
  return getMotionSettings(prefersReducedMotion, variants[variant] || baseProps)
}

// Accessible ripple settings
export const getAccessibleRippleSettings = (prefersReducedMotion) => {
  return {
    enableRipple: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 600,
    opacity: prefersReducedMotion ? 0 : 0.3
  }
}

// Focus ring styles for accessibility
export const focusRingStyles = `
  /* High contrast focus rings */
  .focus-ring:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  @media (prefers-contrast: high) {
    .focus-ring:focus-visible {
      outline: 3px solid #000;
      outline-offset: 2px;
    }
  }
  
  /* Focus ring for buttons */
  .button-focus:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
`

// Utility to inject accessibility CSS
export const injectAccessibilityCSS = () => {
  // Check if styles are already injected
  if (document.getElementById('micro-interactions-accessibility')) {
    return
  }
  
  const style = document.createElement('style')
  style.id = 'micro-interactions-accessibility'
  style.textContent = reducedMotionCSS + focusRingStyles
  document.head.appendChild(style)
}

// Default accessibility settings
export const ACCESSIBILITY_DEFAULTS = {
  respectReducedMotion: true,
  provideFocusRings: true,
  maintainKeyboardNavigation: true,
  includeAriaLabels: true,
  supportHighContrast: true
}

// ARIA labels for interactive states
export const ARIA_LABELS = {
  loading: '로딩 중',
  success: '성공',
  error: '오류 발생',
  disabled: '비활성화됨',
  ripple: '클릭 효과 재생 중'
}