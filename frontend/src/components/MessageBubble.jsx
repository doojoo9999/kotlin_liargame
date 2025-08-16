import React from 'react'
import {Box} from '@components/ui'
import PropTypes from 'prop-types'
import {getAnnouncementColors, getSystemMessageColors, getUserColorSet} from '../utils/colorUtils'
import {
    CHAT_DESIGN_CONSTANTS,
    getAnnouncementMessageStyles,
    getHighContrastOverrides,
    getMessageContainerStyles,
    getSystemMessageStyles
} from '../styles/chatStyles'

/**
 * MessageBubble - A reusable bubble wrapper component for consistent message styling
 * Can be used independently or as part of the chat message system
 */
function MessageBubble({
  children,
  variant = 'normal', // 'normal', 'system', 'announcement', 'own'
  userId,
  isDarkMode = false,
  isHighContrast = false,
  size = 'normal', // 'compact', 'normal', 'large'
  elevation = 1,
  animated = true,
  onClick,
  onHover,
  className,
  sx = {},
  ...otherProps
}) {
  
  // Generate appropriate color set based on variant
  const getColorSet = () => {
    switch (variant) {
      case 'system':
        return getSystemMessageColors(isDarkMode)
      case 'announcement':
        return getAnnouncementColors(isDarkMode)
      case 'normal':
      case 'own':
      default:
        return getUserColorSet(userId || 'default', isDarkMode)
    }
  }
  
  // Get base styles based on variant
  const getBaseStyles = () => {
    const mockMessage = { 
      isSystem: variant === 'system',
      type: variant === 'announcement' ? 'announcement' : undefined,
      playerId: userId,
      playerNickname: userId,
      sender: userId
    }
    
    switch (variant) {
      case 'system':
        return getSystemMessageStyles(isDarkMode)
      case 'announcement':
        return getAnnouncementMessageStyles(isDarkMode)
      case 'normal':
      case 'own':
      default:
        return getMessageContainerStyles(mockMessage, isDarkMode, variant === 'own')
    }
  }
  
  // Size-based style adjustments
  const getSizeStyles = () => {
    const baseHeight = CHAT_DESIGN_CONSTANTS.MESSAGE_HEIGHT
    const basePadding = CHAT_DESIGN_CONSTANTS.PADDING
    
    switch (size) {
      case 'compact':
        return {
          minHeight: baseHeight.MIN,
          maxHeight: baseHeight.MIN + 8,
          padding: `${basePadding.VERTICAL_TIGHT}px ${basePadding.HORIZONTAL_TIGHT}px`
        }
      case 'large':
        return {
          minHeight: baseHeight.MAX,
          maxHeight: baseHeight.MAX + 16,
          padding: `${basePadding.VERTICAL + 2}px ${basePadding.HORIZONTAL + 4}px`
        }
      case 'normal':
      default:
        return {
          minHeight: baseHeight.COMPACT,
          maxHeight: baseHeight.MAX,
          padding: `${basePadding.VERTICAL}px ${basePadding.HORIZONTAL}px`
        }
    }
  }
  
  // Elevation-based shadow styles
  const getElevationStyles = () => {
    const shadows = {
      0: 'none',
      1: isDarkMode ? CHAT_DESIGN_CONSTANTS.BOX_SHADOW_DARK : CHAT_DESIGN_CONSTANTS.BOX_SHADOW,
      2: isDarkMode ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.15)',
      3: isDarkMode ? '0 4px 8px rgba(0,0,0,0.5)' : '0 4px 8px rgba(0,0,0,0.2)'
    }
    
    return {
      boxShadow: shadows[elevation] || shadows[1]
    }
  }
  
  // Animation styles
  const getAnimationStyles = () => {
    if (!animated) return {}
    
    return {
      transition: 'all 0.2s ease-in-out',
      animation: 'messageSlideIn 0.3s ease-out',
      '@keyframes messageSlideIn': {
        '0%': {
          opacity: 0,
          transform: 'translateY(10px) scale(0.95)'
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }
      }
    }
  }
  
  // Interaction styles
  const getInteractionStyles = () => {
    const colorSet = getColorSet()
    
    const hoverStyles = {
      '&:hover': {
        backgroundColor: colorSet.background.replace(/[\d.]+\)$/g, (isDarkMode ? '0.25)' : '0.2)')),
        transform: animated ? 'translateY(-1px) scale(1.02)' : 'translateY(-1px)',
        boxShadow: isDarkMode ? '0 3px 6px rgba(0,0,0,0.5)' : '0 3px 6px rgba(0,0,0,0.2)'
      }
    }
    
    const clickStyles = onClick ? {
      cursor: 'pointer',
      '&:active': {
        transform: animated ? 'translateY(0) scale(0.98)' : 'translateY(0)',
        transition: 'transform 0.1s ease-out'
      }
    } : {}
    
    return { ...hoverStyles, ...clickStyles }
  }
  
  // Combine all styles
  const combinedStyles = {
    ...getBaseStyles(),
    ...getSizeStyles(),
    ...getElevationStyles(),
    ...getAnimationStyles(),
    ...getInteractionStyles(),
    ...getHighContrastOverrides(isHighContrast),
    ...sx
  }
  
  // Handle mouse events
  const handleMouseEnter = (event) => {
    onHover?.(event, true)
  }
  
  const handleMouseLeave = (event) => {
    onHover?.(event, false)
  }
  
  const handleClick = (event) => {
    onClick?.(event)
  }
  
  return (
    <Box
      className={className}
      sx={combinedStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : 'presentation'}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      } : undefined}
      {...otherProps}
    >
      {children}
    </Box>
  )
}

MessageBubble.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['normal', 'system', 'announcement', 'own']),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isDarkMode: PropTypes.bool,
  isHighContrast: PropTypes.bool,
  size: PropTypes.oneOf(['compact', 'normal', 'large']),
  elevation: PropTypes.oneOf([0, 1, 2, 3]),
  animated: PropTypes.bool,
  onClick: PropTypes.func,
  onHover: PropTypes.func,
  className: PropTypes.string,
  sx: PropTypes.object
}

MessageBubble.defaultProps = {
  variant: 'normal',
  userId: null,
  isDarkMode: false,
  isHighContrast: false,
  size: 'normal',
  elevation: 1,
  animated: true,
  onClick: null,
  onHover: null,
  className: '',
  sx: {}
}

export default MessageBubble