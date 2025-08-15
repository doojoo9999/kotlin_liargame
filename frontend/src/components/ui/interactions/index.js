// Micro-interactions barrel export
// Centralized access to all interactive feedback systems

// Re-export ripple effects from PlayerAvatar
export {
  useRipple,
  AvatarEffects as InteractiveWrapper
} from '../PlayerAvatar/AvatarEffects.jsx'

// Accessibility utilities
export {
  useReducedMotion,
  accessibleVariants,
  getMotionSettings,
  getAccessibleButtonProps,
  getAccessibleRippleSettings,
  injectAccessibilityCSS,
  ACCESSIBILITY_DEFAULTS,
  ARIA_LABELS
} from './accessibility.js'

// Animation tokens for consistent micro-interactions
export const microInteractions = {
  // Timing functions optimized for 60fps performance
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  // Hover and focus transforms
  hover: {
    lift: 'translateY(-1px)',
    liftScale: 'translateY(-1px) scale(1.02)',
    scale: 'scale(1.02)',
    glow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  
  // Active/click transforms
  active: {
    press: 'translateY(0) scale(0.98)',
    tap: 'scale(0.95)',
  },
  
  // Focus styles for accessibility
  focus: {
    ring: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    glow: '0 0 0 4px rgba(99, 102, 241, 0.2), 0 0 8px rgba(99, 102, 241, 0.4)',
  },
  
  // Animation durations
  durations: {
    ripple: 600,
    feedback: 1000,
    shake: 500,
    bounce: 600,
    fadeIn: 300,
  }
}

// CSS keyframes for common animations
export const keyframes = {
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  
  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
  `,
  
  bounce: `
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        transform: translate3d(0, -6px, 0);
      }
      70% {
        animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        transform: translate3d(0, -3px, 0);
      }
      90% {
        transform: translate3d(0, -1px, 0);
      }
    }
  `,
  
  pulse: `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `,
  
  fadeInUp: `
    @keyframes fadeInUp {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  
  slideDown: `
    @keyframes slideDown {
      0% {
        opacity: 0;
        transform: translateY(-8px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
}

// Button interaction presets
export const buttonInteractions = {
  // Standard game button with ripple and hover effects
  gameButton: {
    enableRipple: true,
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.02, y: -1 },
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  
  // Action button with enhanced effects
  actionButton: {
    enableRipple: true,
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02, y: -2 },
    transition: { type: "spring", stiffness: 400, damping: 20 }
  },
  
  // Subtle button for secondary actions
  subtleButton: {
    enableRipple: false,
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.01, y: -0.5 },
    transition: { duration: 0.15 }
  }
}

// Input interaction presets
export const inputInteractions = {
  // Standard form input with focus glow
  formInput: {
    focusGlow: true,
    errorShake: true,
    successPulse: true
  },
  
  // Chat input with enhanced feedback
  chatInput: {
    focusGlow: true,
    errorShake: true,
    focusScale: 1.01
  }
}

// Usage examples and documentation
export const USAGE_EXAMPLES = {
  // Enable ripple on any button
  button: `
    import { useRipple } from '@/components/ui/interactions'
    
    const MyButton = () => {
      const { createRipple, RippleEffect } = useRipple()
      
      return (
        <button 
          onClick={createRipple}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          Button Text
          <RippleEffect />
        </button>
      )
    }
  `,
  
  // Use existing Button component with interactions
  enhancedButton: `
    import { Button } from '@/components/ui'
    import { buttonInteractions } from '@/components/ui/interactions'
    
    <Button 
      variant="primary"
      {...buttonInteractions.gameButton}
      feedbackState="success" // or 'error' or null
      feedbackDuration={1000}
    >
      Click Me
    </Button>
  `,
  
  // Interactive wrapper for any element
  wrapper: `
    import { InteractiveWrapper } from '@/components/ui/interactions'
    
    <InteractiveWrapper 
      enableRipple={true}
      effect="glow"
      duration="2s"
    >
      <div>Any content with ripple effect</div>
    </InteractiveWrapper>
  `
}

// Performance considerations
export const PERFORMANCE_NOTES = `
Micro-interactions Performance Guidelines:
1. All animations use transform and opacity for 60fps performance
2. Ripple effects are automatically cleaned up after 600ms
3. Use prefers-reduced-motion media query for accessibility
4. Feedback states timeout automatically to prevent memory leaks
5. Framer-motion is used for hardware-accelerated transforms
6. Maximum concurrent ripples per element: 3 (auto-managed)
`

// Accessibility considerations
export const ACCESSIBILITY_NOTES = `
Accessibility Guidelines:
1. All interactive elements maintain focus indicators
2. Animations respect prefers-reduced-motion setting
3. Color-based feedback includes non-color alternatives
4. ARIA labels provided for loading and feedback states
5. Keyboard navigation preserved during animations
6. High contrast mode compatibility maintained
`