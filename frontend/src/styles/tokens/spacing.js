// Design tokens: Spacing system
// Based on 8px grid system for consistent spacing

export const spacing = {
  // Base spacing unit (8px)
  base: 8,
  
  // Spacing scale
  0: '0px',
  0.5: '2px', // 0.5 * 4px
  1: '4px',   // 1 * 4px
  1.5: '6px', // 1.5 * 4px
  2: '8px',   // 2 * 4px (base unit)
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px'
}

// Semantic spacing for common use cases
export const semanticSpacing = {
  // Component spacing
  component: {
    xxs: spacing[1],   // 4px - very tight spacing
    xs: spacing[2],    // 8px - tight spacing
    sm: spacing[3],    // 12px - small spacing
    md: spacing[4],    // 16px - medium spacing
    lg: spacing[6],    // 24px - large spacing
    xl: spacing[8],    // 32px - extra large spacing
    xxl: spacing[12]   // 48px - extra extra large spacing
  },

  // Layout spacing
  layout: {
    xs: spacing[4],    // 16px - small layout spacing
    sm: spacing[6],    // 24px - small layout spacing
    md: spacing[8],    // 32px - medium layout spacing
    lg: spacing[12],   // 48px - large layout spacing
    xl: spacing[16],   // 64px - extra large layout spacing
    xxl: spacing[24]   // 96px - extra extra large layout spacing
  },

  // Container spacing
  container: {
    xs: spacing[4],    // 16px - mobile padding
    sm: spacing[6],    // 24px - tablet padding
    md: spacing[8],    // 32px - desktop padding
    lg: spacing[12],   // 48px - wide desktop padding
    xl: spacing[16]    // 64px - ultra wide padding
  },

  // Game-specific spacing
  game: {
    playerCard: spacing[4],      // 16px - spacing around player cards
    chatMessage: spacing[2],     // 8px - spacing between chat messages
    actionButton: spacing[3],    // 12px - spacing around action buttons
    gameBoard: spacing[6],       // 24px - spacing around game board
    modal: spacing[8],           // 32px - modal padding
    tooltip: spacing[2]          // 8px - tooltip padding
  }
}

// Responsive spacing helpers
export const responsiveSpacing = {
  mobile: {
    container: semanticSpacing.container.xs,
    section: semanticSpacing.layout.sm,
    component: semanticSpacing.component.sm
  },
  tablet: {
    container: semanticSpacing.container.sm,
    section: semanticSpacing.layout.md,
    component: semanticSpacing.component.md
  },
  desktop: {
    container: semanticSpacing.container.md,
    section: semanticSpacing.layout.lg,
    component: semanticSpacing.component.lg
  }
}

export default spacing