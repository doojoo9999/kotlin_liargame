import React from 'react'
import PropTypes from 'prop-types'
import {createGlobalStyle, ThemeProvider as StyledThemeProvider, useTheme as useStyledTheme} from 'styled-components'
import {colors} from './tokens/colors'
import {responsiveSpacing, semanticSpacing, spacing} from './tokens/spacing'
import {typography} from './tokens/typography'
import {coloredShadows, semanticShadows, shadows} from './tokens/shadows'
import {borderRadius, cornerRadius, responsiveBorderRadius, semanticBorderRadius} from './tokens/borderRadius'
import {animations, semanticTransitions} from './tokens/animations'

const theme = {
  colors,
  spacing,
  semanticSpacing,
  responsiveSpacing,
  typography,
  // Compatibility aliases for components referencing typography tokens at root
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  lineHeight: typography.lineHeight,
  letterSpacing: typography.letterSpacing,
  fontWeight: typography.fontWeight, // alias for components expecting root fontWeight
  shadows,
  semanticShadows,
  coloredShadows,
  borderRadius,
  semanticBorderRadius,
  responsiveBorderRadius,
  cornerRadius,
  animations,
  semanticTransitions,
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  },
  
  media: {
    mobile: '@media (max-width: 767px)',
    tablet: '@media (min-width: 768px) and (max-width: 1023px)',
    desktop: '@media (min-width: 1024px)',
    wide: '@media (min-width: 1440px)'
  }
}

const ResetStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
  
  button {
    border: none;
    background: none;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }
  
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    border: none;
    outline: none;
    background: none;
    padding: 0;
    margin: 0;
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }
  
  ul, ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: inherit;
    font-size: inherit;
  }
  
  p {
    margin: 0;
  }
`

const BaseStyles = createGlobalStyle`
  html {
    font-size: 16px; /* Base font size for rem calculations */
    scroll-behavior: smooth;
    overflow-x: hidden;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: ${({ theme }) => (theme?.typography?.fontFamily?.primary) || 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, sans-serif'};
    font-size: ${({ theme }) => (theme?.typography?.body?.fontSize) || (theme?.typography?.body1?.fontSize) || '1rem'};
    font-weight: ${({ theme }) => (theme?.typography?.body?.fontWeight) || (theme?.typography?.body1?.fontWeight) || 400};
    line-height: ${({ theme }) => (theme?.typography?.body?.lineHeight) || (theme?.typography?.body1?.lineHeight) || 1.5};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background.default};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
`

const AccessibilityStyles = createGlobalStyle`
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }
  
  :focus:not(:focus-visible) {
    outline: none;
  }
`

const CustomScrollbarStyles = createGlobalStyle`
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface.secondary};
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.secondary};
    border-radius: ${({ theme }) => theme.borderRadius.full};
    
    &:hover {
      background: ${({ theme }) => theme.colors.text.tertiary};
    }
  }
`

const SelectionStyles = createGlobalStyle`
  ::selection {
    background-color: ${({ theme }) => theme.colors.primary[100]};
    color: ${({ theme }) => theme.colors.primary[800]};
  }
`

export const ThemeProvider = ({ children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      <ResetStyles />
      <BaseStyles />
      <AccessibilityStyles />
      <CustomScrollbarStyles />
      <SelectionStyles />
      {children}
    </StyledThemeProvider>
  )
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ThemeProvider

export const useTheme = useStyledTheme

export { theme }