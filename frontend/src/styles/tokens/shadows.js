// Design tokens: Shadow system
// Soft shadows optimized for rounded white-mode design

export const shadows = {
  // No shadow
  none: 'none',

  // Subtle shadows for minimal elevation
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  // Default shadows for cards and containers
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Large shadows for modals and overlays
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Inner shadows for input fields and pressed states
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
}

// Semantic shadows for specific use cases
export const semanticShadows = {
  // Card shadows
  card: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.xs
  },

  // Button shadows
  button: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.inner,
    disabled: shadows.none
  },

  // Modal shadows
  modal: {
    backdrop: '0 0 0 1000px rgba(0, 0, 0, 0.5)',
    content: shadows['2xl']
  },

  // Dropdown shadows
  dropdown: shadows.lg,

  // Tooltip shadows
  tooltip: shadows.md,

  // Input shadows
  input: {
    default: shadows.xs,
    focus: '0 0 0 3px rgba(99, 102, 241, 0.1), ' + shadows.sm,
    error: '0 0 0 3px rgba(239, 68, 68, 0.1), ' + shadows.sm
  },

  // Game-specific shadows
  game: {
    playerCard: {
      default: shadows.sm,
      active: shadows.md,
      speaking: '0 0 0 2px rgba(255, 159, 67, 0.3), ' + shadows.md,
      liar: '0 0 0 2px rgba(255, 71, 87, 0.3), ' + shadows.md,
      citizen: '0 0 0 2px rgba(83, 82, 237, 0.3), ' + shadows.md,
      voting: '0 0 0 2px rgba(196, 69, 105, 0.3), ' + shadows.md
    },
    chatMessage: shadows.xs,
    actionButton: {
      default: shadows.sm,
      hover: shadows.md,
      active: shadows.xs
    },
    gameBoard: shadows.lg,
    statusIndicator: shadows.sm
  }
}

// Colored shadows for special effects
export const coloredShadows = {
  primary: '0 10px 15px -3px rgba(99, 102, 241, 0.2), 0 4px 6px -2px rgba(99, 102, 241, 0.1)',
  secondary: '0 10px 15px -3px rgba(236, 72, 153, 0.2), 0 4px 6px -2px rgba(236, 72, 153, 0.1)',
  success: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
  warning: '0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1)',
  error: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)',

  // Game-specific colored shadows
  game: {
    liar: '0 10px 15px -3px rgba(255, 71, 87, 0.25), 0 4px 6px -2px rgba(255, 71, 87, 0.15)',
    citizen: '0 10px 15px -3px rgba(83, 82, 237, 0.25), 0 4px 6px -2px rgba(83, 82, 237, 0.15)',
    speaking: '0 10px 15px -3px rgba(255, 159, 67, 0.25), 0 4px 6px -2px rgba(255, 159, 67, 0.15)',
    voting: '0 10px 15px -3px rgba(196, 69, 105, 0.25), 0 4px 6px -2px rgba(196, 69, 105, 0.15)',
    waiting: '0 10px 15px -3px rgba(127, 176, 105, 0.25), 0 4px 6px -2px rgba(127, 176, 105, 0.15)'
  }
}

// Animation-friendly shadows for transitions
export const transitionShadows = {
  // Smooth shadow transitions for interactive elements
  elevate: {
    from: shadows.sm,
    to: shadows.lg
  },
  depress: {
    from: shadows.md,
    to: shadows.inner
  },
  glow: {
    from: shadows.md,
    to: coloredShadows.primary
  }
}

export default shadows