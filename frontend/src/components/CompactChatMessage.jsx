import React, {useEffect, useState} from 'react'
import {Box, Typography} from './ui'
import PropTypes from 'prop-types'
import {getUserColorSet} from '../utils/colorUtils'
import {
    getAnnouncementMessageStyles,
    getAvatarStyles,
    getHighContrastOverrides,
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
  const [isXs, setIsXs] = useState(window.innerWidth < 600)
  const [isHighContrast, setIsHighContrast] = useState(false)
  
  useEffect(() => {
    const handleResize = () => setIsXs(window.innerWidth < 600)
    const handleContrastChange = (e) => setIsHighContrast(e.matches)
    
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)
    
    window.addEventListener('resize', handleResize)
    mediaQuery.addEventListener('change', handleContrastChange)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      mediaQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])
  
  const responsiveOverrides = getResponsiveOverrides(isXs ? 'xs' : 'sm')
  
  const isOwnMessage = currentUserId && (
    String(message.playerId) === String(currentUserId) ||
    String(message.sender) === String(currentUserId) ||
    String(message.playerNickname) === String(currentUserId)
  )
  
  const senderName = message.playerNickname || message.sender || '익명'
  const userId = message.playerId || message.playerNickname || message.sender
  const userColor = getUserColorSet(userId, isDarkMode).base
  const timestamp = formatTimestamp(message.timestamp || message.createdAt)
  
  // 그룹 정보 추출
  const isFirst = message.isFirst
  const isLast = message.isLast

  if (message.isSystem) {
    const systemStyles = getSystemMessageStyles(isDarkMode)
    const contentStyles = getMessageContentStyles(isDarkMode, true)
    const highContrastOverrides = getHighContrastOverrides(isHighContrast)
    
    return (
      <Box
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '4px 16px',
          marginBottom: '2px',
        }}
        role="listitem"
        aria-label={`System message: ${message.content}`}
      >
        <Box
          style={{
            ...systemStyles,
            ...highContrastOverrides,
            ...(responsiveOverrides.padding && {
              padding: `${responsiveOverrides.padding.vertical}px ${responsiveOverrides.padding.horizontal}px`
            })
          }}
        >
          <Typography
            style={{
              ...contentStyles,
              ...(responsiveOverrides.fontSize && {
                fontSize: responsiveOverrides.fontSize.message
              })
            }}
          >
            {message.content}
          </Typography>
        </Box>
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
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '4px 16px',
          marginBottom: '2px',
        }}
        role="listitem"
        aria-label={`Announcement from ${senderName}: ${message.content}`}
      >
        <Box
          sx={{
            ...announcementStyles,
            ...highContrastOverrides,
            ...(responsiveOverrides.padding && {
              padding: `${responsiveOverrides.padding.vertical}px ${responsiveOverrides.padding.horizontal}px`
            })
          }}
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
        </Box>
      </Box>
    )
  }

  const avatarStyles = getAvatarStyles(isXs)
  const nicknameStyles = getNicknameStyles(userColor, isDarkMode)
  const contentStyles = getMessageContentStyles(isDarkMode, false, isOwnMessage)
  const timestampStyles = getTimestampStyles(isDarkMode)
  const highContrastOverrides = getHighContrastOverrides(isHighContrast)
  
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '2px 16px',
        marginBottom: isLast ? '4px' : '2px', // 그룹 마지막일 때만 큰 간격
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      }}
      role="listitem"
      aria-label={`Message from ${senderName}: ${message.content}`}
    >
      {/* 상대방 메시지 - 왼쪽 아바타 (첫 메시지일 때만) */}
      {!isOwnMessage && (
        <Box sx={{ 
          width: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginRight: 1,
        }}>
          {isFirst && (
            <>
              <Avatar
                sx={{
                  ...avatarStyles,
                  backgroundColor: userColor,
                  color: 'white',
                  marginBottom: 0.5,
                  ...(responsiveOverrides.avatar && {
                    width: responsiveOverrides.avatar,
                    height: responsiveOverrides.avatar
                  })
                }}
                aria-hidden="true"
              >
                {getAvatarText(senderName)}
              </Avatar>
              <Typography
                sx={{
                  ...nicknameStyles,
                  fontSize: '10px',
                  textAlign: 'center',
                  ...(responsiveOverrides.fontSize && {
                    fontSize: responsiveOverrides.fontSize.nickname - 2
                  })
                }}
              >
                {senderName}
              </Typography>
            </>
          )}
        </Box>
      )}
      
      {/* 메시지 말풍선과 시간 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-end',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        gap: 1,
        maxWidth: '75%',
      }}>
        {/* 말풍선 */}
        <Box
          sx={{
            padding: '8px 12px',
            backgroundColor: isOwnMessage 
              ? (isDarkMode ? '#4CAF50' : '#DCF8C6') 
              : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'white'),
            color: isOwnMessage 
              ? (isDarkMode ? 'white' : 'black')
              : 'text.primary',
            borderRadius: isOwnMessage 
              ? '18px 18px 4px 18px' 
              : '18px 18px 18px 4px',
            boxShadow: isDarkMode 
              ? '0 1px 2px rgba(0,0,0,0.3)' 
              : '0 1px 2px rgba(0,0,0,0.1)',
            border: isOwnMessage 
              ? 'none' 
              : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'}`,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            minWidth: '20px',
            maxWidth: '100%',
            animation: 'fadeInUp 0.2s ease-out',
            '@keyframes fadeInUp': {
              '0%': {
                opacity: 0,
                transform: 'translateY(5px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            },
            ...highContrastOverrides,
          }}
        >
          <Typography
            sx={{
              ...contentStyles,
              fontSize: '14px',
              lineHeight: 1.4,
              margin: 0,
              ...(responsiveOverrides.fontSize && {
                fontSize: responsiveOverrides.fontSize.message
              })
            }}
          >
            {message.content}
          </Typography>
        </Box>
        
        {/* 시간 (마지막 메시지일 때만) */}
        {timestamp && isLast && (
          <Typography
            sx={{
              ...timestampStyles,
              fontSize: '10px',
              color: 'text.secondary',
              alignSelf: 'flex-end',
              marginBottom: '2px',
              ...(responsiveOverrides.fontSize && {
                fontSize: responsiveOverrides.fontSize.timestamp
              })
            }}
          >
            {timestamp}
          </Typography>
        )}
      </Box>
      
      {/* 본인 메시지 - 오른쪽 아바타 (첫 메시지일 때만) */}
      {isOwnMessage && (
        <Box sx={{ 
          width: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginLeft: 1,
        }}>
          {isFirst && (
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
          )}
        </Box>
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
    createdAt: PropTypes.string,
    isFirst: PropTypes.bool,
    isLast: PropTypes.bool
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
    prevProps.message.isFirst === nextProps.message.isFirst &&
    prevProps.message.isLast === nextProps.message.isLast &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isDarkMode === nextProps.isDarkMode
  )
})

MemoizedCompactChatMessage.displayName = 'CompactChatMessage'

export default MemoizedCompactChatMessage
