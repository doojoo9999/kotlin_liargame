import {createTheme} from '@mui/material/styles'

// Responsive breakpoints configuration for adaptive layout
export const RESPONSIVE_BREAKPOINTS = {
  xs: 0,     // Phone
  sm: 600,   // Tablet
  md: 900,   // Small laptop
  lg: 1200,  // Desktop
  xl: 1536   // Large desktop
}

// Layout transition durations
export const TRANSITION_DURATIONS = {
  fast: 150,
  standard: 300,
  slow: 500,
  layout: 200 // Specific for layout changes
}

// Adaptive layout theme extension
export const adaptiveLayoutTheme = (baseTheme) => createTheme({
  ...baseTheme,
  
  // Custom breakpoints for game layout
  breakpoints: {
    ...baseTheme.breakpoints,
    values: RESPONSIVE_BREAKPOINTS
  },
  
  // Custom spacing for adaptive components
  spacing: baseTheme.spacing,
  
  // Custom transitions
  transitions: {
    ...baseTheme.transitions,
    duration: {
      ...baseTheme.transitions.duration,
      ...TRANSITION_DURATIONS
    }
  },
  
  // Adaptive layout specific palette extensions
  palette: {
    ...baseTheme.palette,
    
    // Game status colors
    gameStatus: {
      waiting: baseTheme.palette.info.main,
      active: baseTheme.palette.primary.main,
      urgent: baseTheme.palette.warning.main,
      critical: baseTheme.palette.error.main,
      success: baseTheme.palette.success.main
    },
    
    // Panel background colors
    panels: {
      left: baseTheme.palette.background.paper,
      center: baseTheme.palette.background.default,
      right: baseTheme.palette.background.paper,
      overlay: 'rgba(0, 0, 0, 0.04)'
    },
    
    // System message priorities
    systemMessage: {
      high: baseTheme.palette.error.main,
      medium: baseTheme.palette.warning.main,
      low: baseTheme.palette.info.main,
      success: baseTheme.palette.success.main
    }
  },
  
  // Custom component styles
  components: {
    ...baseTheme.components,
    
    // Adaptive Game Layout
    MuiBox: {
      ...baseTheme.components?.MuiBox,
      styleOverrides: {
        ...baseTheme.components?.MuiBox?.styleOverrides,
        root: {
          '&.adaptive-layout': {
            transition: `all ${TRANSITION_DURATIONS.layout}ms ease-in-out`,
            '&.transitioning': {
              pointerEvents: 'none'
            }
          },
          '&.left-panel': {
            backgroundColor: baseTheme.palette.background.paper,
            borderRight: `1px solid ${baseTheme.palette.divider}`,
            '&.collapsed': {
              width: '0 !important',
              overflow: 'hidden'
            }
          },
          '&.right-panel': {
            backgroundColor: baseTheme.palette.background.paper,
            borderLeft: `1px solid ${baseTheme.palette.divider}`,
            '&.collapsed': {
              width: '0 !important',
              overflow: 'hidden'
            }
          },
          '&.center-panel': {
            backgroundColor: baseTheme.palette.background.default,
            position: 'relative'
          }
        }
      }
    },
    
    // Game Status Card
    MuiCard: {
      ...baseTheme.components?.MuiCard,
      styleOverrides: {
        ...baseTheme.components?.MuiCard?.styleOverrides,
        root: {
          '&.game-status-card': {
            borderRadius: baseTheme.shape.borderRadius * 2,
            boxShadow: baseTheme.shadows[2],
            transition: `all ${TRANSITION_DURATIONS.standard}ms ease-in-out`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: baseTheme.shadows[4]
            },
            '&.urgent': {
              animation: 'pulse 1s infinite',
              borderColor: baseTheme.palette.error.main
            }
          }
        }
      }
    },
    
    // System Notifications
    MuiList: {
      ...baseTheme.components?.MuiList,
      styleOverrides: {
        ...baseTheme.components?.MuiList?.styleOverrides,
        root: {
          '&.system-notifications': {
            '& .MuiListItem-root': {
              transition: `all ${TRANSITION_DURATIONS.fast}ms ease-in-out`,
              '&:hover': {
                backgroundColor: baseTheme.palette.action.hover
              },
              '&.high-priority': {
                backgroundColor: `${baseTheme.palette.error.light}08`,
                borderLeft: `3px solid ${baseTheme.palette.error.main}`
              },
              '&.medium-priority': {
                borderLeft: `3px solid ${baseTheme.palette.warning.main}`
              }
            }
          }
        }
      }
    },
    
    // Expanded Chat Panel
    MuiTabs: {
      ...baseTheme.components?.MuiTabs,
      styleOverrides: {
        ...baseTheme.components?.MuiTabs?.styleOverrides,
        root: {
          '&.chat-tabs': {
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: baseTheme.typography.fontWeightMedium,
              '&.Mui-selected': {
                color: baseTheme.palette.primary.main,
                fontWeight: baseTheme.typography.fontWeightBold
              }
            }
          }
        }
      }
    },
    
    // Quick Reactions
    MuiIconButton: {
      ...baseTheme.components?.MuiIconButton,
      styleOverrides: {
        ...baseTheme.components?.MuiIconButton?.styleOverrides,
        root: {
          '&.quick-reaction': {
            borderRadius: baseTheme.shape.borderRadius,
            transition: `all ${TRANSITION_DURATIONS.fast}ms ease-in-out`,
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor: baseTheme.palette.action.hover
            }
          }
        }
      }
    }
  }
})

// CSS-in-JS styles for adaptive components
export const adaptiveLayoutStyles = {
  // Main adaptive layout container
  adaptiveLayout: {
    height: '100vh',
    display: 'grid',
    transition: `grid-template-columns ${TRANSITION_DURATIONS.layout}ms ease-in-out`,
    backgroundColor: 'background.default',
    
    // Mobile styles
    [RESPONSIVE_BREAKPOINTS.xs]: {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto 1fr'
    },
    
    // Tablet styles
    [`@media (min-width: ${RESPONSIVE_BREAKPOINTS.md}px)`]: {
      gridTemplateColumns: 'var(--left-width, 25%) var(--center-width, 50%) var(--right-width, 25%)',
      gridTemplateRows: 'auto 1fr'
    },
    
    // Desktop styles
    [`@media (min-width: ${RESPONSIVE_BREAKPOINTS.lg}px)`]: {
      gridTemplateColumns: 'var(--left-width, 25%) var(--center-width, 50%) var(--right-width, 25%)',
      gridTemplateRows: 'auto 1fr'
    }
  },
  
  // Left information panel
  leftPanel: {
    gridArea: 'left',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.paper',
    borderRight: 1,
    borderColor: 'divider',
    overflow: 'hidden',
    transition: `all ${TRANSITION_DURATIONS.layout}ms ease-in-out`,
    
    // Mobile: hidden by default
    [RESPONSIVE_BREAKPOINTS.xs]: {
      display: 'none'
    },
    
    // Tablet and up: visible
    [`@media (min-width: ${RESPONSIVE_BREAKPOINTS.md}px)`]: {
      display: 'flex'
    }
  },
  
  // Center game area
  centerPanel: {
    gridArea: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.default',
    overflow: 'hidden',
    minHeight: 0
  },
  
  // Right chat panel
  rightPanel: {
    gridArea: 'right',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.paper',
    borderLeft: 1,
    borderColor: 'divider',
    overflow: 'hidden',
    transition: `all ${TRANSITION_DURATIONS.layout}ms ease-in-out`,
    
    // Mobile: hidden by default
    [RESPONSIVE_BREAKPOINTS.xs]: {
      display: 'none'
    },
    
    // Tablet and up: visible
    [`@media (min-width: ${RESPONSIVE_BREAKPOINTS.md}px)`]: {
      display: 'flex'
    }
  },
  
  // Game status card animations
  gameStatusCard: {
    borderRadius: 2,
    transition: `all ${TRANSITION_DURATIONS.standard}ms ease-in-out`,
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4
    },
    
    '&.urgent': {
      animation: 'gameStatusPulse 1s infinite alternate',
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: 'error.main'
    }
  },
  
  // Action guide animations
  actionGuide: {
    '& .action-item': {
      transition: `all ${TRANSITION_DURATIONS.fast}ms ease-in-out`,
      
      '&.completed': {
        opacity: 0.6,
        textDecoration: 'line-through'
      },
      
      '&.urgent': {
        backgroundColor: 'error.light',
        borderRadius: 1,
        padding: 1,
        animation: 'actionUrgentPulse 0.8s infinite alternate'
      }
    }
  },
  
  // System notifications animations
  systemNotifications: {
    '& .notification-item': {
      transition: `all ${TRANSITION_DURATIONS.fast}ms ease-in-out`,
      
      '&:hover': {
        backgroundColor: 'action.hover'
      },
      
      '&.high-priority': {
        backgroundColor: 'error.light',
        borderLeft: 3,
        borderColor: 'error.main',
        borderStyle: 'solid'
      },
      
      '&.entering': {
        animation: 'notificationSlideIn 0.3s ease-out'
      },
      
      '&.exiting': {
        animation: 'notificationSlideOut 0.3s ease-in'
      }
    }
  },
  
  // Chat panel enhancements
  chatPanel: {
    '& .chat-tabs': {
      borderBottom: 1,
      borderColor: 'divider',
      
      '& .MuiTab-root': {
        textTransform: 'none',
        fontSize: '0.875rem',
        
        '&.Mui-selected': {
          fontWeight: 'bold'
        }
      }
    },
    
    '& .quick-reactions': {
      padding: 1,
      borderTop: 1,
      borderColor: 'divider',
      
      '& .reaction-button': {
        transition: `all ${TRANSITION_DURATIONS.fast}ms ease-in-out`,
        
        '&:hover': {
          transform: 'scale(1.2)',
          backgroundColor: 'action.hover'
        }
      }
    }
  }
}

// CSS animations as strings for injection
export const layoutAnimations = `
  @keyframes gameStatusPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.3);
    }
    100% {
      box-shadow: 0 0 0 8px rgba(244, 67, 54, 0);
    }
  }
  
  @keyframes actionUrgentPulse {
    0% {
      background-color: rgba(244, 67, 54, 0.1);
    }
    100% {
      background-color: rgba(244, 67, 54, 0.2);
    }
  }
  
  @keyframes notificationSlideIn {
    0% {
      transform: translateX(-100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes notificationSlideOut {
    0% {
      transform: translateX(0);
      opacity: 1;
    }
    100% {
      transform: translateX(-100%);
      opacity: 0;
    }
  }
  
  @keyframes layoutTransition {
    0% {
      opacity: 0.8;
    }
    100% {
      opacity: 1;
    }
  }
`

// Utility functions for responsive layout
export const getResponsiveLayoutRatios = (breakpoint, gameStatus) => {
  // Base layout ratios from LAYOUT_CONFIG
  const baseRatios = {
    WAITING: { left: '25%', center: '50%', right: '25%' },
    HINT_PHASE: { left: '20%', center: '45%', right: '35%' },
    VOTING: { left: '30%', center: '35%', right: '35%' },
    DEFENSE: { left: '25%', center: '40%', right: '35%' },
    WORD_GUESS: { left: '20%', center: '60%', right: '20%' }
  }
  
  const ratios = baseRatios[gameStatus] || baseRatios.WAITING
  
  // Adjust for different screen sizes
  switch (breakpoint) {
    case 'xs':
    case 'sm':
      // Mobile: single column
      return { left: '100%', center: '100%', right: '100%' }
      
    case 'md':
      // Tablet: slightly compressed ratios
      return {
        left: `${Math.max(15, parseInt(ratios.left) - 5)}%`,
        center: ratios.center,
        right: `${Math.max(20, parseInt(ratios.right) - 5)}%`
      }
      
    case 'lg':
    case 'xl':
    default:
      // Desktop: full ratios
      return ratios
  }
}

export default {
  RESPONSIVE_BREAKPOINTS,
  TRANSITION_DURATIONS,
  adaptiveLayoutTheme,
  adaptiveLayoutStyles,
  layoutAnimations,
  getResponsiveLayoutRatios
}