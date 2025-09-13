// Framer Motion animation variants for consistent animations across the application
import {Variants} from 'framer-motion'

// Phase transition animations
export const phaseTransition: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
}

// Card animations
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
}

// List item animations with stagger
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.3,
      ease: 'easeOut'
    }
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2
    }
  }
}

// Modal/dialog animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

// Slide in animations (for moderator commentary)
export const slideInVariants: Variants = {
  hidden: {
    opacity: 0,
    x: '100%'
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
}

// Fade animations
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

// Button animations
export const buttonVariants: Variants = {
  idle: {
    scale: 1
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  },
  disabled: {
    scale: 1,
    opacity: 0.6
  }
}

// Loading animations
export const loadingVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

// Pulse animations
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Success/Error feedback animations
export const feedbackVariants: Variants = {
  success: {
    scale: [1, 1.1, 1],
    backgroundColor: ['#ffffff', '#22c55e', '#ffffff'],
    transition: {
      duration: 0.6,
      ease: 'easeInOut'
    }
  },
  error: {
    x: [0, -10, 10, -10, 10, 0],
    backgroundColor: ['#ffffff', '#ef4444', '#ffffff'],
    transition: {
      duration: 0.6,
      ease: 'easeInOut'
    }
  }
}

// Game-specific animations
export const gameVariants = {
  // Player join animation
  playerJoin: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  },

  // Vote animation
  vote: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  },

  // Timer warning animation
  timerWarning: {
    animate: {
      scale: [1, 1.1, 1],
      color: ['#000000', '#ef4444', '#000000'],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // Turn indicator
  turnIndicator: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
} as const

// Container animations with stagger children
export const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}