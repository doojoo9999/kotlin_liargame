import React from 'react'
import { createStyles } from '@mantine/core'

const useStyles = createStyles((theme) => ({
  global: {
    // Reset and base styles
    '*': {
      boxSizing: 'border-box',
    },
    
    'html, body': {
      margin: 0,
      padding: 0,
      height: '100%',
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizes.md,
      lineHeight: theme.lineHeight,
      color: theme.colors.dark[9],
      backgroundColor: theme.colors.gray[0],
    },
    
    '#root': {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    
    // Game-specific global styles
    '.game-container': {
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    },
    
    '.game-card': {
      background: `linear-gradient(135deg, ${theme.colors.white}, ${theme.colors.gray[0]})`,
      border: `2px solid ${theme.colors.gray[3]}`,
      borderRadius: theme.radius.md,
      boxShadow: theme.shadows.sm,
    },
    
    '.game-button': {
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows.md,
      },
    },
    
    // Animation classes
    '.fade-in': {
      animation: 'fadeIn 0.3s ease-in',
    },
    
    '.slide-up': {
      animation: 'slideUp 0.3s ease-out',
    },
    
    '.scale-in': {
      animation: 'scaleIn 0.2s ease-out',
    },
    
    // Keyframes
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    
    '@keyframes slideUp': {
      from: { 
        opacity: 0,
        transform: 'translateY(20px)',
      },
      to: { 
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    
    '@keyframes scaleIn': {
      from: { 
        opacity: 0,
        transform: 'scale(0.9)',
      },
      to: { 
        opacity: 1,
        transform: 'scale(1)',
      },
    },
  },
}))

// CssBaseline component
export const CssBaseline = ({ children }) => {
  const { classes } = useStyles()

  return (
    <div className={classes.global}>
      {children}
    </div>
  )
}

CssBaseline.displayName = 'CssBaseline'

export default CssBaseline