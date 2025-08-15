// Barrel export for design system
// Main entry point for all styling utilities and tokens

// Theme Provider and utilities
export { default as ThemeProvider, useTheme, theme } from './ThemeProvider.jsx'

// Design tokens
export { default as colors } from './tokens/colors'
export { default as spacing, semanticSpacing, responsiveSpacing } from './tokens/spacing'
export { 
  default as typography, 
  fontFamily, 
  fontWeight, 
  fontSize, 
  lineHeight, 
  letterSpacing 
} from './tokens/typography'
export { 
  default as shadows, 
  semanticShadows, 
  coloredShadows, 
  transitionShadows 
} from './tokens/shadows'
export { 
  default as borderRadius, 
  semanticBorderRadius, 
  responsiveBorderRadius, 
  cornerRadius 
} from './tokens/borderRadius'
export { 
  default as animations,
  duration,
  easing,
  transition,
  semanticTransitions,
  keyframes
} from './tokens/animations'

// Re-export individual token files for direct access
export * from './tokens/colors'
export * from './tokens/spacing'
export * from './tokens/typography'
export * from './tokens/shadows'
export * from './tokens/borderRadius'
export * from './tokens/animations'