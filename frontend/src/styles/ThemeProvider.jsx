import React from 'react'
import {createGlobalStyle, ThemeProvider as StyledThemeProvider} from 'styled-components'
import {colors} from './tokens/colors'
import {responsiveSpacing, semanticSpacing, spacing} from './tokens/spacing'
import {fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, typography} from './tokens/typography'
import {coloredShadows, semanticShadows, shadows, transitionShadows} from './tokens/shadows'
import {borderRadius, cornerRadius, responsiveBorderRadius, semanticBorderRadius} from './tokens/borderRadius'
import {animations, duration, easing, keyframes, semanticTransitions, transition} from './tokens/animations'

// Unified theme object
const theme = {
  // Colors
  colors,
  
  // Spacing
  spacing,
  semanticSpacing,
  responsiveSpacing,
  
  // Typography
  typography,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  
  // Shadows
  shadows,
  semanticShadows,
  coloredShadows,
  transitionShadows,
  
  // Border radius
  borderRadius,
  semanticBorderRadius,
  responsiveBorderRadius,
  cornerRadius,
  
  // Animations
  duration,
  easing,
  transition,
  semanticTransitions,
  keyframes,
  animations,
  
  // Breakpoints for responsive design
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  },
  
  // Media queries
  media: {
    mobile: '@media (max-width: 767px)',
    tablet: '@media (min-width: 768px) and (max-width: 1023px)',
    desktop: '@media (min-width: 1024px)',
    wide: '@media (min-width: 1440px)'
  }
}

// Global styles with keyframes injection
const GlobalStyle = createGlobalStyle`
  /* Inject keyframes */
  ${theme.keyframes.pulse}
  ${theme.keyframes.bounce}
  ${theme.keyframes.shake}
  ${theme.keyframes.fadeIn}
  ${theme.keyframes.slideUp}
  ${theme.keyframes.scaleIn}
  ${theme.keyframes.game.cardFlip}
  ${theme.keyframes.game.countdownPulse}
  ${theme.keyframes.game.typing}
  
  /* Base styles */
  * {
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px; /* Base font size for rem calculations */
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: ${theme.fontFamily.primary};
    font-size: ${theme.fontSize.base};
    font-weight: ${theme.fontWeight.normal};
    line-height: ${theme.lineHeight.normal};
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.background.default};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Remove default button styles */
  button {
    border: none;
    background: none;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }
  
  /* Remove default input styles */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    border: none;
    outline: none;
    background: none;
    padding: 0;
    margin: 0;
  }
  
  /* Remove default link styles */
  a {
    color: inherit;
    text-decoration: none;
  }
  
  /* Remove default list styles */
  ul, ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  /* Remove default heading margins */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: inherit;
  }
  
  /* Remove default paragraph margins */
  p {
    margin: 0;
  }
  
  /* Focus outline for accessibility */
  :focus-visible {
    outline: 2px solid ${theme.colors.border.focus};
    outline-offset: 2px;
  }
  
  /* Disable outline for mouse users */
  :focus:not(:focus-visible) {
    outline: none;
  }
  
  /* Custom scrollbar for webkit browsers */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${theme.colors.surface.secondary};
    border-radius: ${theme.borderRadius.full};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.border.secondary};
    border-radius: ${theme.borderRadius.full};
    
    &:hover {
      background: ${theme.colors.text.tertiary};
    }
  }
  
  /* Selection color */
  ::selection {
    background-color: ${theme.colors.primary[100]};
    color: ${theme.colors.primary[800]};
  }
  
  /* Prevent horizontal scrolling */
  html, body {
    overflow-x: hidden;
  }
  
  /* Game-specific global styles */
  .game-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .game-background {
    background: linear-gradient(
      135deg,
      ${theme.colors.background.default} 0%,
      ${theme.colors.background.elevated} 100%
    );
    min-height: 100vh;
  }
  
  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .no-scroll {
    overflow: hidden;
  }
  
  /* Animation utility classes */
  .animate-pulse {
    animation: ${theme.animations.pulse};
  }
  
  .animate-bounce {
    animation: ${theme.animations.bounce};
  }
  
  .animate-shake {
    animation: ${theme.animations.shake};
  }
  
  .animate-fade-in {
    animation: ${theme.animations.fadeIn};
  }
  
  .animate-slide-up {
    animation: ${theme.animations.slideUp};
  }
  
  .animate-scale-in {
    animation: ${theme.animations.scaleIn};
  }
  
  /* Game animation utility classes */
  .animate-card-flip {
    animation: ${theme.animations.game.cardFlip};
  }
  
  .animate-countdown-pulse {
    animation: ${theme.animations.game.countdownPulse};
  }
  
  .animate-typing {
    animation: ${theme.animations.game.typing};
  }
`

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </StyledThemeProvider>
  )
}

export default ThemeProvider

// Hook for accessing theme in components
export const useTheme = () => {
  const theme = React.useContext(StyledThemeProvider.ThemeContext)
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return theme
}

// Export theme object for direct access
export { theme }