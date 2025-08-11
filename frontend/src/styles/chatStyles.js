import {getAnnouncementColors, getSystemMessageColors, getUserColorSet} from '../utils/colorUtils'

export const CHAT_DESIGN_CONSTANTS = {
  MESSAGE_HEIGHT: {
    MIN: 40,
    MAX: 48,
    COMPACT: 42
  },
  PADDING: {
    VERTICAL: 6,
    HORIZONTAL: 10,
    VERTICAL_TIGHT: 4,
    HORIZONTAL_TIGHT: 8
  },
  MARGIN: {
    VERTICAL: 2,
    HORIZONTAL: 0
  },
  AVATAR: {
    SIZE: 28,
    SIZE_SMALL: 24
  },
  FONT_SIZES: {
    NICKNAME: 14,
    MESSAGE: 13,
    TIMESTAMP: 11,
    SYSTEM: 12
  },
  BORDER_RADIUS: 8,
  BOX_SHADOW: '0 1px 2px rgba(0,0,0,0.1)',
  BOX_SHADOW_DARK: '0 1px 2px rgba(0,0,0,0.3)'
}

export const getMessageContainerStyles = (message, isDarkMode = false, isOwnMessage = false) => {
  // Main container that holds the entire message row
  return {
    display: 'flex',
    width: '100%',
    marginBottom: `${CHAT_DESIGN_CONSTANTS.MARGIN.VERTICAL * 2}px`,
    alignItems: 'flex-end', // Align avatars with bottom of speech bubble
    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
    gap: '8px'
  }
}

export const getSpeechBubbleStyles = (message, isDarkMode = false, isOwnMessage = false) => {
  let colorSet

  if (message.isSystem) {
    colorSet = getSystemMessageColors(isDarkMode)
  } else if (message.type === 'announcement') {
    colorSet = getAnnouncementColors(isDarkMode)
  } else {
    const userId = message.playerId || message.playerNickname || message.sender
    colorSet = getUserColorSet(userId, isDarkMode)
  }

  const bubbleStyles = {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '75%', // 70-80% constraint as requested
    minWidth: '60px', // Minimum width for very short messages
    padding: `${CHAT_DESIGN_CONSTANTS.PADDING.VERTICAL + 2}px ${CHAT_DESIGN_CONSTANTS.PADDING.HORIZONTAL + 2}px`,
    backgroundColor: colorSet.background,
    border: `1px solid ${colorSet.border}`,
    borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px', // KakaoTalk-style bubble shape
    boxShadow: isDarkMode ? CHAT_DESIGN_CONSTANTS.BOX_SHADOW_DARK : CHAT_DESIGN_CONSTANTS.BOX_SHADOW,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    wordBreak: 'break-word',
    '&:hover': {
      backgroundColor: colorSet.background.replace(/[\d.]+\)$/g, (isDarkMode ? '0.2)' : '0.15)')),
      transform: 'translateY(-1px)',
      boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.15)'
    }
  }

  return bubbleStyles
}

export const getAvatarStyles = (isSmall = false) => ({
  width: isSmall ? CHAT_DESIGN_CONSTANTS.AVATAR.SIZE_SMALL : CHAT_DESIGN_CONSTANTS.AVATAR.SIZE,
  height: isSmall ? CHAT_DESIGN_CONSTANTS.AVATAR.SIZE_SMALL : CHAT_DESIGN_CONSTANTS.AVATAR.SIZE,
  marginRight: '2',
  flexShrink: 0,
  fontSize: isSmall ? 10 : 12,
  fontWeight: 'bold'
})

export const getNicknameStyles = (userColor, isDarkMode = false) => ({
  fontSize: CHAT_DESIGN_CONSTANTS.FONT_SIZES.NICKNAME,
  fontWeight: 'bold',
  color: userColor,
  marginLeft: 1,
  marginRight: 1,
  flexShrink: 0,
  lineHeight: 1.2,
  maxWidth: '80px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

export const getMessageContentStyles = (isDarkMode = false, isSystem = false, isOwnMessage = false) => ({
  fontSize: isSystem ? CHAT_DESIGN_CONSTANTS.FONT_SIZES.SYSTEM : CHAT_DESIGN_CONSTANTS.FONT_SIZES.MESSAGE,
  fontStyle: isSystem ? 'italic' : 'normal',
  fontWeight: isSystem ? 'medium' : 'normal',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
  lineHeight: 1.4,
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap', // Preserve line breaks and wrap text
  textAlign: isSystem ? 'center' : (isOwnMessage ? 'left' : 'left'), // Keep left alignment for readability
  margin: 0,
  padding: 0
})

export const getTimestampStyles = (isDarkMode = false) => ({
  fontSize: CHAT_DESIGN_CONSTANTS.FONT_SIZES.TIMESTAMP,
  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
  flexShrink: 0,
  lineHeight: 1,
  whiteSpace: 'nowrap'
})

export const getChatListStyles = (isDarkMode = false) => ({
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  padding: 0,
  margin: 0,
  backgroundColor: 'transparent'
})

export const getSystemMessageStyles = (isDarkMode = false) => {
  const colorSet = getSystemMessageColors(isDarkMode)
  
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: CHAT_DESIGN_CONSTANTS.MESSAGE_HEIGHT.MIN,
    padding: `${CHAT_DESIGN_CONSTANTS.PADDING.VERTICAL_TIGHT}px ${CHAT_DESIGN_CONSTANTS.PADDING.HORIZONTAL}px`,
    margin: `${CHAT_DESIGN_CONSTANTS.MARGIN.VERTICAL * 2}px ${CHAT_DESIGN_CONSTANTS.MARGIN.HORIZONTAL}px`,
    backgroundColor: colorSet.background,
    border: `1px solid ${colorSet.border}`,
    borderRadius: CHAT_DESIGN_CONSTANTS.BORDER_RADIUS,
    boxShadow: isDarkMode ? CHAT_DESIGN_CONSTANTS.BOX_SHADOW_DARK : CHAT_DESIGN_CONSTANTS.BOX_SHADOW
  }
}

export const getAnnouncementMessageStyles = (isDarkMode = false) => {
  const colorSet = getAnnouncementColors(isDarkMode)
  
  return {
    display: 'flex',
    alignItems: 'center',
    minHeight: CHAT_DESIGN_CONSTANTS.MESSAGE_HEIGHT.COMPACT,
    padding: `${CHAT_DESIGN_CONSTANTS.PADDING.VERTICAL}px ${CHAT_DESIGN_CONSTANTS.PADDING.HORIZONTAL}px`,
    margin: `${CHAT_DESIGN_CONSTANTS.MARGIN.VERTICAL * 2}px ${CHAT_DESIGN_CONSTANTS.MARGIN.HORIZONTAL}px`,
    backgroundColor: colorSet.background,
    border: `2px solid ${colorSet.border}`, // Thicker border for emphasis
    borderRadius: CHAT_DESIGN_CONSTANTS.BORDER_RADIUS,
    boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.15)',
    position: 'relative',
    '&::before': {
      content: '"📢"',
      marginRight: 8,
      fontSize: 16
    }
  }
}

export const getResponsiveOverrides = (breakpoint) => {
  const overrides = {}
  
  switch (breakpoint) {
    case 'xs':
      overrides.fontSize = {
        nickname: CHAT_DESIGN_CONSTANTS.FONT_SIZES.NICKNAME - 1,
        message: CHAT_DESIGN_CONSTANTS.FONT_SIZES.MESSAGE - 1,
        timestamp: CHAT_DESIGN_CONSTANTS.FONT_SIZES.TIMESTAMP - 1
      }
      overrides.padding = {
        vertical: CHAT_DESIGN_CONSTANTS.PADDING.VERTICAL_TIGHT,
        horizontal: CHAT_DESIGN_CONSTANTS.PADDING.HORIZONTAL_TIGHT
      }
      overrides.avatar = CHAT_DESIGN_CONSTANTS.AVATAR.SIZE_SMALL
      break
    case 'sm':
      overrides.padding = {
        vertical: CHAT_DESIGN_CONSTANTS.PADDING.VERTICAL_TIGHT,
        horizontal: CHAT_DESIGN_CONSTANTS.PADDING.HORIZONTAL
      }
      break
    default:
      break
  }
  
  return overrides
}

export const messageAnimations = {
  fadeInUp: {
    '@keyframes fadeInUp': {
      '0%': {
        opacity: 0,
        transform: 'translateY(20px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)'
      }
    }
  },
  slideInRight: {
    '@keyframes slideInRight': {
      '0%': {
        opacity: 0,
        transform: 'translateX(20px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateX(0)'
      }
    }
  }
}

export const getHighContrastOverrides = (isHighContrast = false) => {
  if (!isHighContrast) return {}
  
  return {
    border: '2px solid currentColor',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    }
  }
}

export default {
  CHAT_DESIGN_CONSTANTS,
  getMessageContainerStyles,
  getAvatarStyles,
  getNicknameStyles,
  getMessageContentStyles,
  getTimestampStyles,
  getChatListStyles,
  getSystemMessageStyles,
  getAnnouncementMessageStyles,
  getResponsiveOverrides,
  messageAnimations,
  getHighContrastOverrides
}