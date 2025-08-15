// Design tokens: Animation and transition system
// Optimized for smooth game interactions and visual feedback

export const duration = {
  // Base durations (in milliseconds)
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750
}

export const easing = {
  // Standard easing functions
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Custom easing for game elements
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Game-specific easing
  game: {
    cardFlip: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    buttonPress: 'cubic-bezier(0.4, 0, 0.2, 1)',
    modalOpen: 'cubic-bezier(0.16, 1, 0.3, 1)',
    slideIn: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
}

// Basic transition templates
export const transition = {
  // Quick transitions for immediate feedback
  fast: `all ${duration.fast}ms ${easing.easeOut}`,
  
  // Standard transitions for most interactions
  default: `all ${duration.normal}ms ${easing.easeInOut}`,
  
  // Smooth transitions for large movements
  smooth: `all ${duration.slow}ms ${easing.smooth}`,
  
  // Property-specific transitions
  color: `color ${duration.fast}ms ${easing.easeOut}`,
  background: `background-color ${duration.fast}ms ${easing.easeOut}`,
  border: `border-color ${duration.fast}ms ${easing.easeOut}`,
  shadow: `box-shadow ${duration.normal}ms ${easing.easeOut}`,
  transform: `transform ${duration.normal}ms ${easing.easeOut}`,
  opacity: `opacity ${duration.fast}ms ${easing.easeOut}`,
  
  // Combined transitions for complex effects
  elevate: `transform ${duration.normal}ms ${easing.easeOut}, box-shadow ${duration.normal}ms ${easing.easeOut}`,
  fadeScale: `opacity ${duration.fast}ms ${easing.easeOut}, transform ${duration.fast}ms ${easing.easeOut}`
}

// Semantic transitions for specific use cases
export const semanticTransitions = {
  // Button transitions
  button: {
    default: transition.fast,
    hover: `transform ${duration.fast}ms ${easing.easeOut}, box-shadow ${duration.fast}ms ${easing.easeOut}`,
    press: `transform ${duration.fast}ms ${easing.game.buttonPress}`
  },
  
  // Card transitions
  card: {
    hover: transition.elevate,
    flip: `transform ${duration.slow}ms ${easing.game.cardFlip}`,
    slide: `transform ${duration.normal}ms ${easing.game.slideIn}`
  },
  
  // Modal transitions
  modal: {
    backdrop: `opacity ${duration.normal}ms ${easing.easeOut}`,
    content: `opacity ${duration.normal}ms ${easing.game.modalOpen}, transform ${duration.normal}ms ${easing.game.modalOpen}`
  },
  
  // Input transitions
  input: {
    focus: `border-color ${duration.fast}ms ${easing.easeOut}, box-shadow ${duration.fast}ms ${easing.easeOut}`,
    error: `border-color ${duration.fast}ms ${easing.easeOut}, box-shadow ${duration.fast}ms ${easing.easeOut}`
  },
  
  // Game-specific transitions
  game: {
    playerHighlight: `box-shadow ${duration.normal}ms ${easing.easeOut}, transform ${duration.normal}ms ${easing.bounce}`,
    statusChange: `background-color ${duration.normal}ms ${easing.easeOut}, color ${duration.normal}ms ${easing.easeOut}`,
    chatMessage: `opacity ${duration.fast}ms ${easing.easeOut}, transform ${duration.fast}ms ${easing.game.slideIn}`,
    actionButton: `all ${duration.fast}ms ${easing.game.buttonPress}`,
    countdownPulse: `transform ${duration.normal}ms ${easing.bounce}`,
    notification: `opacity ${duration.normal}ms ${easing.easeOut}, transform ${duration.normal}ms ${easing.bounce}`
  }
}

// Animation keyframes for complex animations
export const keyframes = {
  // Pulse animation for notifications
  pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
  
  // Bounce animation for success states
  bounce: `
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -8px, 0);
      }
      70% {
        transform: translate3d(0, -4px, 0);
      }
      90% {
        transform: translate3d(0, -2px, 0);
      }
    }
  `,
  
  // Shake animation for errors
  shake: `
    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-2px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(2px);
      }
    }
  `,
  
  // Fade in animation
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  
  // Slide up animation
  slideUp: `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  
  // Scale in animation
  scaleIn: `
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  
  // Game-specific keyframes
  game: {
    cardFlip: `
      @keyframes cardFlip {
        0% {
          transform: perspective(400px) rotateY(0);
        }
        50% {
          transform: perspective(400px) rotateY(-90deg);
        }
        100% {
          transform: perspective(400px) rotateY(0);
        }
      }
    `,
    
    countdownPulse: `
      @keyframes countdownPulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
    
    typing: `
      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-10px);
        }
      }
    `
  }
}

// Animation utilities
export const animations = {
  pulse: `pulse ${duration.slower}ms ${easing.easeInOut} infinite`,
  bounce: `bounce ${duration.slower}ms ${easing.bounce}`,
  shake: `shake ${duration.slow}ms ${easing.easeInOut}`,
  fadeIn: `fadeIn ${duration.normal}ms ${easing.easeOut}`,
  slideUp: `slideUp ${duration.normal}ms ${easing.game.slideIn}`,
  scaleIn: `scaleIn ${duration.normal}ms ${easing.game.modalOpen}`,
  
  // Game-specific animations
  game: {
    cardFlip: `cardFlip ${duration.slower}ms ${easing.game.cardFlip}`,
    countdownPulse: `countdownPulse ${duration.normal}ms ${easing.bounce} infinite`,
    typing: `typing 1.4s ${easing.easeInOut} infinite`
  }
}

export default {
  duration,
  easing,
  transition,
  semanticTransitions,
  keyframes,
  animations
}