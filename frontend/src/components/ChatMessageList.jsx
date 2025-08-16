import React, {useCallback, useMemo, useRef} from 'react'
import {FixedSizeList as List} from 'react-window'
import {Box} from './ui'
import PropTypes from 'prop-types'
import {getChatListStyles} from '../styles/chatStyles'
import {flattenGroups, groupMessages} from './chat-message-list/utils/chatGrouping'
import {useChatAutoScroll} from './chat-message-list/hooks/useChatAutoScroll'
import {useResizeObserverHeight} from './chat-message-list/hooks/useResizeObserverHeight'
import MessageItem from './chat-message-list/components/MessageItem'


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
  const listRef = useRef(null)
  const containerRef = useRef(null)
  
  // 메시지 그룹핑 및 플래튼
  const processedMessages = useMemo(() => {
    const limitedMessages = messages.length <= maxMessages ? messages : messages.slice(-maxMessages)
    const groupedMessages = groupMessages(limitedMessages)
    return flattenGroups(groupedMessages)
  }, [messages, maxMessages])
  
  const itemHeight = useMemo(() => {
    return 60 // 동적 높이를 위해 넉넉하게 설정
  }, [])
  
  // Custom hooks for extracted functionality
  const containerHeight = useResizeObserverHeight(containerRef, 400)
  
  useChatAutoScroll({
    listRef,
    itemCount: processedMessages.length,
    enabled: autoScroll,
    onBottom: onScrollToBottom,
    delayMs: 50
  })
  
  const handleScroll = useCallback((scrollProps) => {
    const { scrollOffset, scrollDirection } = scrollProps
    const container = containerRef.current
    
    if (!container) return
    
    const containerClientHeight = container.clientHeight
    const scrollHeight = processedMessages.length * itemHeight
    const isAtBottom = scrollOffset + containerClientHeight >= scrollHeight - itemHeight
    
    if (onScrollToBottom && isAtBottom && scrollDirection === 'forward') {
      onScrollToBottom()
    }
  }, [processedMessages.length, itemHeight, onScrollToBottom])
  
  const itemData = useMemo(() => ({
    messages: processedMessages,
    currentUserId,
    isDarkMode
  }), [processedMessages, currentUserId, isDarkMode])
  
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
  
  // Memoized container styles for performance
  const containerStyles = useMemo(() => getChatListStyles(isDarkMode), [isDarkMode])
  
  // Memoized styles for empty state
  const emptyStateStyles = useMemo(() => ({
    ...containerStyles,
    height: numericHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(0, 0, 0, 0.6)'
  }), [containerStyles, numericHeight])
  
  const emptyContentStyles = useMemo(() => ({
    textAlign: 'center', 
    paddingTop: '32px',
    paddingBottom: '32px'
  }), [])
  
  const emptyIconStyles = useMemo(() => ({
    fontSize: '48px', 
    marginBottom: '16px', 
    opacity: 0.5
  }), [])
  
  const emptyTextStyles = useMemo(() => ({
    fontSize: '14px', 
    opacity: 0.7
  }), [])
  
  // Memoized styles for main container
  const mainContainerStyles = useMemo(() => ({
    ...containerStyles,
    height: numericHeight,
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
  }), [containerStyles, numericHeight, isDarkMode])
  
  // ItemKey function for react-window performance optimization
  const itemKey = useCallback((index, data) => {
    return data.messages[index]?.id ?? `${index}`
  }, [])
  
  if (processedMessages.length === 0) {
    return (
      <Box 
        ref={containerRef}
        sx={emptyStateStyles}
        className={className}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <Box sx={emptyContentStyles}>
          <Box sx={emptyIconStyles}>💬</Box>
          <Box sx={emptyTextStyles}>
            채팅을 시작해보세요!
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      ref={containerRef}
      sx={mainContainerStyles}
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
        itemKey={itemKey}
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