/**
 * Theme variant definitions for chat message UI optimization
 * Provides centralized theme color management for dark/light modes
 */

import {getColorWithAlpha, getUserColor} from '../utils/colorUtils'

// Base theme colors for light mode
export const LIGHT_THEME_COLORS = {
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    paper: '#fafafa',
    elevated: '#ffffff'
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)'
  },
  border: {
    light: 'rgba(0, 0, 0, 0.12)',
    medium: 'rgba(0, 0, 0, 0.23)',
    dark: 'rgba(0, 0, 0, 0.42)'
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.2)'
  }
}

// Base theme colors for dark mode
export const DARK_THEME_COLORS = {
  background: {
    primary: '#121212',
    secondary: '#1e1e1e',
    paper: '#242424',
    elevated: '#2d2d2d'
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    hint: 'rgba(255, 255, 255, 0.38)'
  },
  border: {
    light: 'rgba(255, 255, 255, 0.12)',
    medium: 'rgba(255, 255, 255, 0.23)',
    dark: 'rgba(255, 255, 255, 0.42)'
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.4)',
    dark: 'rgba(0, 0, 0, 0.5)'
  }
}

/**
 * Get theme-specific colors based on current mode
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} Theme color palette
 */
export const getThemeColors = (isDarkMode = false) => {
  return isDarkMode ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
}

/**
 * Chat-specific theme variants
 */
export const CHAT_THEME_VARIANTS = {
  light: {
    message: {
      background: 'rgba(255, 255, 255, 0.9)',
      backgroundHover: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(0, 0, 0, 0.12)',
      shadow: '0 1px 2px rgba(0,0,0,0.1)'
    },
    system: {
      background: 'rgba(33, 150, 243, 0.05)',
      border: 'rgba(33, 150, 243, 0.2)',
      text: '#1976d2',
      shadow: '0 1px 2px rgba(33,150,243,0.1)'
    },
    announcement: {
      background: 'rgba(245, 124, 0, 0.1)',
      border: 'rgba(245, 124, 0, 0.4)',
      text: '#f57c00',
      shadow: '0 2px 4px rgba(245,124,0,0.15)'
    },
    scrollbar: {
      track: 'transparent',
      thumb: 'rgba(0, 0, 0, 0.3)',
      thumbHover: 'rgba(0, 0, 0, 0.5)'
    }
  },
  dark: {
    message: {
      background: 'rgba(255, 255, 255, 0.05)',
      backgroundHover: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.12)',
      shadow: '0 1px 2px rgba(0,0,0,0.3)'
    },
    system: {
      background: 'rgba(144, 202, 249, 0.1)',
      border: 'rgba(144, 202, 249, 0.3)',
      text: '#90caf9',
      shadow: '0 1px 2px rgba(144,202,249,0.2)'
    },
    announcement: {
      background: 'rgba(255, 183, 77, 0.15)',
      border: 'rgba(255, 183, 77, 0.5)',
      text: '#ffb74d',
      shadow: '0 2px 4px rgba(255,183,77,0.25)'
    },
    scrollbar: {
      track: 'transparent',
      thumb: 'rgba(255, 255, 255, 0.3)',
      thumbHover: 'rgba(255, 255, 255, 0.5)'
    }
  }
}

/**
 * Get chat theme variant based on mode
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} Chat theme variant
 */
export const getChatThemeVariant = (isDarkMode = false) => {
  return isDarkMode ? CHAT_THEME_VARIANTS.dark : CHAT_THEME_VARIANTS.light
}

/**
 * Generate user-specific theme colors
 * @param {string|number} userId - User identifier
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} User-specific theme colors
 */
export const getUserThemeColors = (userId, isDarkMode = false) => {
  const baseColor = getUserColor(userId)
  const theme = getThemeColors(isDarkMode)
  
  return {
    primary: baseColor,
    background: getColorWithAlpha(baseColor, isDarkMode ? 0.15 : 0.1),
    backgroundHover: getColorWithAlpha(baseColor, isDarkMode ? 0.25 : 0.2),
    border: getColorWithAlpha(baseColor, isDarkMode ? 0.5 : 0.4),
    text: baseColor,
    textOnPrimary: '#ffffff',
    shadow: `0 1px 3px ${getColorWithAlpha(baseColor, isDarkMode ? 0.4 : 0.3)}`
  }
}

/**
 * MUI theme overrides for chat components
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} MUI theme overrides
 */
export const getChatMuiThemeOverrides = (isDarkMode = false) => {
  const theme = getThemeColors(isDarkMode)
  const chatTheme = getChatThemeVariant(isDarkMode)
  
  return {
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: theme.background.paper,
            backgroundImage: 'none'
          }
        }
      },
      MuiList: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            padding: 0
          }
        }
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            padding: 0,
            margin: 0
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontSize: '12px',
            fontWeight: 'bold'
          }
        }
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            wordBreak: 'break-word'
          }
        }
      }
    },
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: theme.background,
      text: theme.text,
      divider: theme.border.light,
      chat: chatTheme
    }
  }
}

/**
 * CSS custom properties for dynamic theming
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} CSS custom properties
 */
export const getChatCssVariables = (isDarkMode = false) => {
  const theme = getThemeColors(isDarkMode)
  const chatTheme = getChatThemeVariant(isDarkMode)
  
  return {
    '--chat-bg-primary': theme.background.primary,
    '--chat-bg-secondary': theme.background.secondary,
    '--chat-bg-paper': theme.background.paper,
    '--chat-text-primary': theme.text.primary,
    '--chat-text-secondary': theme.text.secondary,
    '--chat-border-light': theme.border.light,
    '--chat-border-medium': theme.border.medium,
    '--chat-shadow-light': theme.shadow.light,
    '--chat-shadow-medium': theme.shadow.medium,
    '--chat-message-bg': chatTheme.message.background,
    '--chat-message-border': chatTheme.message.border,
    '--chat-message-shadow': chatTheme.message.shadow,
    '--chat-system-bg': chatTheme.system.background,
    '--chat-system-border': chatTheme.system.border,
    '--chat-system-text': chatTheme.system.text,
    '--chat-announcement-bg': chatTheme.announcement.background,
    '--chat-announcement-border': chatTheme.announcement.border,
    '--chat-announcement-text': chatTheme.announcement.text,
    '--chat-scrollbar-thumb': chatTheme.scrollbar.thumb,
    '--chat-scrollbar-thumb-hover': chatTheme.scrollbar.thumbHover
  }
}

/**
 * Accessibility-compliant color combinations
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} WCAG-compliant color combinations
 */
export const getAccessibleColors = (isDarkMode = false) => {
  return {
    highContrast: {
      background: isDarkMode ? '#000000' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#000000',
      border: isDarkMode ? '#ffffff' : '#000000',
      focus: '#0066cc'
    },
    mediumContrast: {
      background: isDarkMode ? '#121212' : '#fafafa',
      text: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)',
      border: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      focus: isDarkMode ? '#66b3ff' : '#0052cc'
    }
  }
}

/**
 * Theme transition animations
 */
export const THEME_TRANSITIONS = {
  standard: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  color: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}

export default {
  LIGHT_THEME_COLORS,
  DARK_THEME_COLORS,
  CHAT_THEME_VARIANTS,
  getThemeColors,
  getChatThemeVariant,
  getUserThemeColors,
  getChatMuiThemeOverrides,
  getChatCssVariables,
  getAccessibleColors,
  THEME_TRANSITIONS
}