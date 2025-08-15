// Design tokens: Border radius system
// Based on existing 16px value from gameTheme.js, expanded for comprehensive rounded design

export const borderRadius = {
  // Base radius values
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',    // Base value from gameTheme.js
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '32px',
  
  // Special radius values
  full: '9999px', // For pill buttons and circular elements
  half: '50%'     // For circular avatars and icons
}

// Semantic border radius for specific components
export const semanticBorderRadius = {
  // Button radius
  button: {
    small: borderRadius.md,   // 8px for small buttons
    medium: borderRadius.lg,  // 12px for medium buttons
    large: borderRadius.xl    // 16px for large buttons (matches gameTheme)
  },

  // Card radius
  card: {
    small: borderRadius.md,   // 8px for small cards
    medium: borderRadius.xl,  // 16px for medium cards (matches gameTheme)
    large: borderRadius['2xl'] // 20px for large cards
  },

  // Input radius
  input: {
    small: borderRadius.sm,   // 4px for small inputs
    medium: borderRadius.md,  // 8px for medium inputs
    large: borderRadius.lg    // 12px for large inputs
  },

  // Modal radius
  modal: {
    small: borderRadius.lg,   // 12px for small modals
    medium: borderRadius.xl,  // 16px for medium modals
    large: borderRadius['2xl'] // 20px for large modals
  },

  // Badge radius
  badge: {
    default: borderRadius.md, // 8px for default badges
    pill: borderRadius.full   // Full radius for pill badges
  },

  // Avatar radius
  avatar: {
    square: borderRadius.md,  // 8px for square avatars
    rounded: borderRadius.lg, // 12px for rounded avatars
    circular: borderRadius.half // 50% for circular avatars
  },

  // Progress radius
  progress: {
    bar: borderRadius.full,   // Full radius for progress bars
    circular: borderRadius.half // 50% for circular progress
  },

  // Game-specific radius
  game: {
    playerCard: borderRadius.xl,     // 16px for player cards (matches gameTheme)
    chatBubble: {
      user: borderRadius.lg,         // 12px for user chat bubbles
      other: borderRadius.lg         // 12px for other player chat bubbles
    },
    actionButton: borderRadius.lg,   // 12px for action buttons
    statusIndicator: borderRadius.full, // Full radius for status dots
    gameBoard: borderRadius['2xl'],  // 20px for game board container
    tooltip: borderRadius.md,        // 8px for tooltips
    dropdown: borderRadius.lg        // 12px for dropdown menus
  }
}

// Responsive border radius (adjusts based on screen size)
export const responsiveBorderRadius = {
  mobile: {
    card: semanticBorderRadius.card.small,
    button: semanticBorderRadius.button.small,
    modal: semanticBorderRadius.modal.small
  },
  tablet: {
    card: semanticBorderRadius.card.medium,
    button: semanticBorderRadius.button.medium,
    modal: semanticBorderRadius.modal.medium
  },
  desktop: {
    card: semanticBorderRadius.card.large,
    button: semanticBorderRadius.button.large,
    modal: semanticBorderRadius.modal.large
  }
}

// Corner-specific radius for complex components
export const cornerRadius = {
  // Top corners only
  top: {
    sm: `${borderRadius.sm} ${borderRadius.sm} 0 0`,
    md: `${borderRadius.md} ${borderRadius.md} 0 0`,
    lg: `${borderRadius.lg} ${borderRadius.lg} 0 0`,
    xl: `${borderRadius.xl} ${borderRadius.xl} 0 0`
  },
  
  // Bottom corners only
  bottom: {
    sm: `0 0 ${borderRadius.sm} ${borderRadius.sm}`,
    md: `0 0 ${borderRadius.md} ${borderRadius.md}`,
    lg: `0 0 ${borderRadius.lg} ${borderRadius.lg}`,
    xl: `0 0 ${borderRadius.xl} ${borderRadius.xl}`
  },
  
  // Left corners only
  left: {
    sm: `${borderRadius.sm} 0 0 ${borderRadius.sm}`,
    md: `${borderRadius.md} 0 0 ${borderRadius.md}`,
    lg: `${borderRadius.lg} 0 0 ${borderRadius.lg}`,
    xl: `${borderRadius.xl} 0 0 ${borderRadius.xl}`
  },
  
  // Right corners only
  right: {
    sm: `0 ${borderRadius.sm} ${borderRadius.sm} 0`,
    md: `0 ${borderRadius.md} ${borderRadius.md} 0`,
    lg: `0 ${borderRadius.lg} ${borderRadius.lg} 0`,
    xl: `0 ${borderRadius.xl} ${borderRadius.xl} 0`
  }
}

export default borderRadius