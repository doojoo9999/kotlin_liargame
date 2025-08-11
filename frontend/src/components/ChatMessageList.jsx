import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {FixedSizeList as List} from 'react-window'
import {Box, useMediaQuery, useTheme} from '@mui/material'
import PropTypes from 'prop-types'
import CompactChatMessage from './CompactChatMessage'
import {getChatListStyles} from '../styles/chatStyles'

// 메시지 그룹핑 함수
const groupMessages = (messages) => {
  const groups = []
  let currentGroup = null
  
  messages.forEach((message, index) => {
    const isSystem = message.isSystem || message.type === 'announcement'
    const senderId = message.playerId || message.playerNickname || message.sender
    const prevMessage = messages[index - 1]
    const prevSenderId = prevMessage ? (prevMessage.playerId || prevMessage.playerNickname || prevMessage.sender) : null
    
    // 시스템 메시지는 항상 독립 그룹
    if (isSystem) {
      if (currentGroup) {
        groups.push(currentGroup)
        currentGroup = null
      }
      groups.push({
        senderId: 'system',
        senderName: 'System',
        messages: [{ ...message, isFirst: true, isLast: true }],
        isSystem: true
      })
      return
    }
    
    // 새로운 그룹 시작 조건
    const shouldStartNewGroup = !currentGroup || 
      currentGroup.senderId !== senderId ||
      (message.timestamp && currentGroup.lastTimestamp && 
       new Date(message.timestamp) - new Date(currentGroup.lastTimestamp) > 60000) // 1분 이상 차이
    
    if (shouldStartNewGroup) {
      if (currentGroup) {
        // 이전 그룹의 마지막 메시지 표시
        currentGroup.messages[currentGroup.messages.length - 1].isLast = true
        groups.push(currentGroup)
      }
      
      currentGroup = {
        senderId,
        senderName: message.playerNickname || message.sender || '익명',
        messages: [{ ...message, isFirst: true, isLast: false }],
        lastTimestamp: message.timestamp
      }
    } else {
      // 기존 그룹에 메시지 추가
      currentGroup.messages.push({ ...message, isFirst: false, isLast: false })
      currentGroup.lastTimestamp = message.timestamp
    }
  })
  
  // 마지막 그룹 처리
  if (currentGroup) {
    currentGroup.messages[currentGroup.messages.length - 1].isLast = true
    groups.push(currentGroup)
  }
  
  return groups
}

// 그룹을 플랫한 메시지 리스트로 변환
const flattenGroups = (groups) => {
  const flatMessages = []
  
  groups.forEach(group => {
    group.messages.forEach(message => {
      flatMessages.push({
        ...message,
        groupInfo: {
          senderId: group.senderId,
          senderName: group.senderName,
          isSystem: group.isSystem || false
        }
      })
    })
  })
  
  return flatMessages
}

const MessageItem = React.memo(({ index, style, data }) => {
  const { messages, currentUserId, isDarkMode } = data
  const message = messages[index]
  
  if (!message) {
    return <div style={style} />
  }
  
  return (
    <div style={style}>
      <CompactChatMessage 
        message={message}
        currentUserId={currentUserId}
        isDarkMode={isDarkMode}
      />
    </div>
  )
})

MessageItem.displayName = 'MessageItem'


function ChatMessageList({ 
  messages, 
  currentUserId, 
  isDarkMode = false, 
  height = 400,
  autoScroll = true,
  maxMessages = 10000,
  onScrollToBottom,
  className
}) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const listRef = useRef(null)
  const containerRef = useRef(null)
  const prevMessagesLengthRef = useRef(0)
  
  // 메시지 그룹핑 및 플래튼
  const processedMessages = useMemo(() => {
    const limitedMessages = messages.length <= maxMessages ? messages : messages.slice(-maxMessages)
    const groupedMessages = groupMessages(limitedMessages)
    return flattenGroups(groupedMessages)
  }, [messages, maxMessages])
  
  const itemHeight = useMemo(() => {
    return 60 // 동적 높이를 위해 넉넉하게 설정
  }, [])
  
  const scrollToBottom = useCallback(() => {
    if (listRef.current && processedMessages.length > 0) {
      listRef.current.scrollToItem(processedMessages.length - 1, 'end')
      onScrollToBottom?.()
    }
  }, [processedMessages.length, onScrollToBottom])
  
  useEffect(() => {
    if (autoScroll && processedMessages.length > prevMessagesLengthRef.current) {
      const timeoutId = setTimeout(scrollToBottom, 50)
      return () => clearTimeout(timeoutId)
    }
    prevMessagesLengthRef.current = processedMessages.length
  }, [processedMessages.length, autoScroll, scrollToBottom])
  
  const handleScroll = useCallback((scrollProps) => {
    const { scrollOffset, scrollDirection } = scrollProps
    const container = containerRef.current
    
    if (!container) return
    
    const containerHeight = container.clientHeight
    const scrollHeight = processedMessages.length * itemHeight
    const isAtBottom = scrollOffset + containerHeight >= scrollHeight - itemHeight
    
    if (onScrollToBottom && isAtBottom && scrollDirection === 'forward') {
      onScrollToBottom()
    }
  }, [processedMessages.length, itemHeight, onScrollToBottom])
  
  const itemData = useMemo(() => ({
    messages: processedMessages,
    currentUserId,
    isDarkMode
  }), [processedMessages, currentUserId, isDarkMode])
  
  const [containerHeight, setContainerHeight] = useState(400)
  
  useLayoutEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const clientHeight = containerRef.current.clientHeight
        if (clientHeight > 0) {
          setContainerHeight(clientHeight)
        }
      }
    }
    
    updateContainerHeight()
    
    const resizeObserver = new ResizeObserver(updateContainerHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [])
  
  const numericHeight = useMemo(() => {
    if (typeof height === 'number') {
      return height
    }
    if (typeof height === 'string') {
      if (height === '100%') {
        return containerHeight
      }
      const parsed = parseInt(height, 10)
      return isNaN(parsed) ? 400 : parsed
    }
    return 400
  }, [height, containerHeight])
  
  const containerStyles = getChatListStyles(isDarkMode)
  
  if (processedMessages.length === 0) {
    return (
      <Box 
        ref={containerRef}
        sx={{
          ...containerStyles,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}
        className={className}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}>💬</Box>
          <Box sx={{ fontSize: 14, opacity: 0.7 }}>
            채팅을 시작해보세요!
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      ref={containerRef}
      sx={{
        ...containerStyles,
        height,
        '& .react-window-list': {
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? 'rgba(255,255,255,0.3) transparent' : 'rgba(0,0,0,0.3) transparent',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            borderRadius: '3px',
            '&:hover': {
              background: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
            }
          }
        }
      }}
      className={className}
      role="log"
      aria-live="polite"
      aria-label={`Chat messages, ${processedMessages.length} total`}
    >
      <List
        ref={listRef}
        height={numericHeight}
        itemCount={processedMessages.length}
        itemSize={itemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        className="react-window-list"
        overscanCount={5}
        initialScrollOffset={processedMessages.length * itemHeight}
      >
        {MessageItem}
      </List>
    </Box>
  )
}

ChatMessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      playerNickname: PropTypes.string,
      playerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sender: PropTypes.string,
      content: PropTypes.string.isRequired,
      isSystem: PropTypes.bool,
      type: PropTypes.string,
      timestamp: PropTypes.string,
      createdAt: PropTypes.string
    })
  ).isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isDarkMode: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  autoScroll: PropTypes.bool,
  maxMessages: PropTypes.number,
  onScrollToBottom: PropTypes.func,
  className: PropTypes.string
}

ChatMessageList.defaultProps = {
  currentUserId: null,
  isDarkMode: false,
  height: 400,
  autoScroll: true,
  maxMessages: 10000,
  onScrollToBottom: null,
  className: ''
}

export default ChatMessageList