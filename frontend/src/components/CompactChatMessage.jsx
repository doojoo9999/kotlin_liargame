import React from 'react'
import {Avatar, Box, Typography, useMediaQuery, useTheme} from '@mui/material'
import PropTypes from 'prop-types'
import {getUserColorSet} from '../utils/colorUtils'
import {
    CHAT_DESIGN_CONSTANTS,
    getAnnouncementMessageStyles,
    getAvatarStyles,
    getHighContrastOverrides,
    getMessageContainerStyles,
    getMessageContentStyles,
    getNicknameStyles,
    getResponsiveOverrides,
    getSystemMessageStyles,
    getTimestampStyles
} from '../styles/chatStyles'

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      const timeMatch = timestamp.match(/(\d{2}):(\d{2})/)
      return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : ''
    }
    
    return date.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('[DEBUG_LOG] Failed to format timestamp:', timestamp, error)
    return ''
  }
}

const getAvatarText = (name) => {
  if (!name) return '?'
  
  const trimmedName = name.trim()
  if (/[가-힣]/.test(trimmedName)) {
    return trimmedName[0]
  } else {
    return trimmedName.substring(0, 2).toUpperCase()
  }
}

function CompactChatMessage({ message, currentUserId, isDarkMode = false }) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const isHighContrast = useMediaQuery('(prefers-contrast: high)')
  
  console.log('[DEBUG_LOG] CompactChatMessage rendering:', message)
  
  const responsiveOverrides = getResponsiveOverrides(isXs ? 'xs' : 'sm')
  
  const isOwnMessage = currentUserId && (
    message.playerId === currentUserId ||
    message.sender === currentUserId ||
    message.playerNickname === currentUserId
  )
  
  const senderName = message.playerNickname || message.sender || '익명'
  const userId = message.playerId || message.playerNickname || message.sender
  const userColor = getUserColorSet(userId, isDarkMode).base
  const timestamp = formatTimestamp(message.timestamp || message.createdAt)
  
  if (message.isSystem) {
    const systemStyles = getSystemMessageStyles(isDarkMode)
    const contentStyles = getMessageContentStyles(isDarkMode, true)
    const highContrastOverrides = getHighContrastOverrides(isHighContrast)
    
    return (
      <Box
        sx={{
          ...systemStyles,
          ...highContrastOverrides,
          ...(responsiveOverrides.padding && {
            padding: `${responsiveOverrides.padding.vertical}px ${responsiveOverrides.padding.horizontal}px`
          })
        }}
        role="listitem"
        aria-label={`System message: ${message.content}`}
      >
        <Typography
          sx={{
            ...contentStyles,
            ...(responsiveOverrides.fontSize && {
              fontSize: responsiveOverrides.fontSize.message
            })
          }}
        >
          {message.content}
        </Typography>
        {timestamp && (
          <Typography
            sx={{
              ...getTimestampStyles(isDarkMode),
              marginLeft: 2,
              ...(responsiveOverrides.fontSize && {
                fontSize: responsiveOverrides.fontSize.timestamp
              })
            }}
          >
            {timestamp}
          </Typography>
        )}
      </Box>
    )
  }
  
  if (message.type === 'announcement') {
    const announcementStyles = getAnnouncementMessageStyles(isDarkMode)
    const contentStyles = getMessageContentStyles(isDarkMode, false)
    const highContrastOverrides = getHighContrastOverrides(isHighContrast)
    
    return (
      <Box
        sx={{
          ...announcementStyles,
          ...highContrastOverrides,
          ...(responsiveOverrides.padding && {
            padding: `${responsiveOverrides.padding.vertical}px ${responsiveOverrides.padding.horizontal}px`
          })
        }}
        role="listitem"
        aria-label={`Announcement from ${senderName}: ${message.content}`}
      >
        <Typography
          sx={{
            ...contentStyles,
            fontWeight: 'medium',
            ...(responsiveOverrides.fontSize && {
              fontSize: responsiveOverrides.fontSize.message
            })
          }}
        >
          {message.content}
        </Typography>
        {timestamp && (
          <Typography
            sx={{
              ...getTimestampStyles(isDarkMode),
              ...(responsiveOverrides.fontSize && {
                fontSize: responsiveOverrides.fontSize.timestamp
              })
            }}
          >
            {timestamp}
          </Typography>
        )}
      </Box>
    )
  }
  
  const containerStyles = getMessageContainerStyles(message, isDarkMode, isOwnMessage)
  const avatarStyles = getAvatarStyles(isXs || responsiveOverrides.avatar === CHAT_DESIGN_CONSTANTS.AVATAR.SIZE_SMALL)
  const nicknameStyles = getNicknameStyles(userColor, isDarkMode)
  const contentStyles = getMessageContentStyles(isDarkMode, false)
  const timestampStyles = getTimestampStyles(isDarkMode)
  const highContrastOverrides = getHighContrastOverrides(isHighContrast)
  
  return (
    <Box
      sx={{
        ...containerStyles,
        ...highContrastOverrides,
        ...(responsiveOverrides.padding && {
          padding: `${responsiveOverrides.padding.vertical}px ${responsiveOverrides.padding.horizontal}px`
        }),
        animation: 'fadeInUp 0.3s ease-out',
        '@keyframes fadeInUp': {
          '0%': {
            opacity: 0,
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
      role="listitem"
      aria-label={`Message from ${senderName} at ${timestamp}: ${message.content}`}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          ...avatarStyles,
          backgroundColor: userColor,
          color: 'white',
          ...(responsiveOverrides.avatar && {
            width: responsiveOverrides.avatar,
            height: responsiveOverrides.avatar
          })
        }}
        aria-hidden="true"
      >
        {getAvatarText(senderName)}
      </Avatar>
      
      {/* Nickname */}
      <Typography
        component="span"
        sx={{
          ...nicknameStyles,
          ...(responsiveOverrides.fontSize && {
            fontSize: responsiveOverrides.fontSize.nickname
          })
        }}
      >
        {senderName}
      </Typography>
      
      {/* Message Content */}
      <Typography
        component="span"
        sx={{
          ...contentStyles,
          ...(responsiveOverrides.fontSize && {
            fontSize: responsiveOverrides.fontSize.message
          })
        }}
      >
        {message.content}
      </Typography>
      
      {/* Timestamp */}
      {timestamp && (
        <Typography
          component="span"
          sx={{
            ...timestampStyles,
            ...(responsiveOverrides.fontSize && {
              fontSize: responsiveOverrides.fontSize.timestamp
            })
          }}
        >
          {timestamp}
        </Typography>
      )}
    </Box>
  )
}

CompactChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    playerNickname: PropTypes.string,
    playerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    sender: PropTypes.string,
    content: PropTypes.string.isRequired,
    isSystem: PropTypes.bool,
    type: PropTypes.string,
    timestamp: PropTypes.string,
    createdAt: PropTypes.string
  }).isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isDarkMode: PropTypes.bool
}

CompactChatMessage.defaultProps = {
  currentUserId: null,
  isDarkMode: false
}

const MemoizedCompactChatMessage = React.memo(CompactChatMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isDarkMode === nextProps.isDarkMode
  )
})

MemoizedCompactChatMessage.displayName = 'CompactChatMessage'

export default MemoizedCompactChatMessage