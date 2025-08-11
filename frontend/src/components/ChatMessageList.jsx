import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {FixedSizeList as List} from 'react-window'
import {Box, useMediaQuery, useTheme} from '@mui/material'
import PropTypes from 'prop-types'
import CompactChatMessage from './CompactChatMessage'
import {CHAT_DESIGN_CONSTANTS, getChatListStyles} from '../styles/chatStyles'

/**
 * Individual message item renderer for react-window
 * @param {Object} props - Item renderer props from react-window
 */
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

/**
 * Optimized chat message list with virtualization for performance
 * Handles large numbers of messages efficiently
 */
function ChatMessageList({ 
  messages, 
  currentUserId, 
  isDarkMode = false, 
  height = 400,
  autoScroll = true,
  maxMessages = 500,
  onScrollToBottom,
  className
}) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const listRef = useRef(null)
  const containerRef = useRef(null)
  const prevMessagesLengthRef = useRef(0)
  
  // Calculate item height based on screen size
  const itemHeight = useMemo(() => {
    if (isXs) {
      return CHAT_DESIGN_CONSTANTS.MESSAGE_HEIGHT.MIN + CHAT_DESIGN_CONSTANTS.MARGIN.VERTICAL * 2
    }
    return CHAT_DESIGN_CONSTANTS.MESSAGE_HEIGHT.COMPACT + CHAT_DESIGN_CONSTANTS.MARGIN.VERTICAL * 2
  }, [isXs])
  
  // Limit messages for performance
  const limitedMessages = useMemo(() => {
    if (messages.length <= maxMessages) {
      return messages
    }
    // Keep the most recent messages
    return messages.slice(-maxMessages)
  }, [messages, maxMessages])
  
  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (listRef.current && limitedMessages.length > 0) {
      listRef.current.scrollToItem(limitedMessages.length - 1, 'end')
      onScrollToBottom?.()
    }
  }, [limitedMessages.length, onScrollToBottom])
  
  // Handle auto scroll on new messages
  useEffect(() => {
    if (autoScroll && limitedMessages.length > prevMessagesLengthRef.current) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(scrollToBottom, 50)
      return () => clearTimeout(timeoutId)
    }
    prevMessagesLengthRef.current = limitedMessages.length
  }, [limitedMessages.length, autoScroll, scrollToBottom])
  
  // Handle scroll events for manual scroll detection
  const handleScroll = useCallback((scrollProps) => {
    const { scrollOffset, scrollDirection } = scrollProps
    const container = containerRef.current
    
    if (!container) return
    
    // Check if user is at the bottom
    const containerHeight = container.clientHeight
    const scrollHeight = limitedMessages.length * itemHeight
    const isAtBottom = scrollOffset + containerHeight >= scrollHeight - itemHeight
    
    // Notify parent about scroll state
    if (onScrollToBottom && isAtBottom && scrollDirection === 'forward') {
      onScrollToBottom()
    }
  }, [limitedMessages.length, itemHeight, onScrollToBottom])
  
  // Prepare data for react-window
  const itemData = useMemo(() => ({
    messages: limitedMessages,
    currentUserId,
    isDarkMode
  }), [limitedMessages, currentUserId, isDarkMode])
  
  // Get container styles
  const containerStyles = getChatListStyles(isDarkMode)
  
  // Handle empty messages
  if (limitedMessages.length === 0) {
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
        // Ensure proper scrollbar styling
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
      aria-label={`Chat messages, ${limitedMessages.length} total`}
    >
      <List
        ref={listRef}
        height={height}
        itemCount={limitedMessages.length}
        itemSize={itemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        className="react-window-list"
        overscanCount={5}
        initialScrollOffset={limitedMessages.length * itemHeight}
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
  height: PropTypes.number,
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
  maxMessages: 500,
  onScrollToBottom: null,
  className: ''
}

export default ChatMessageList