import React, {useEffect, useState} from 'react'
import {Alert, Box, Button, Paper, Typography} from './ui'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'
import {useGame} from '../context/GameContext'
import {useChatOptimization} from '../hooks/chat-optimization/useChatOptimization'
import {getChatThemeVariant, THEME_TRANSITIONS} from '../styles/themeVariants'

function OptimizedChatWindow() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)
  const isDarkMode = false // Default to light mode since we removed theme
  const isXs = isMobile

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const {
    chatMessages,
    socketConnected,
    sendChatMessage,
    currentUser,
    currentRoom,
    error
  } = useGame()

  const gameNumber = currentRoom?.gameNumber
  const currentUserId = currentUser?.id || currentUser?.playerId

  // Chat optimization hook
  const {
    messages: optimizedMessages,
    addMessages,
    clearMessages,
    isThrottling,
    performanceStats,
    getPerformanceReport
  } = useChatOptimization({
    maxMessages: 10000,
    throttleDelay: isXs ? 150 : 100, // Slower on mobile
    batchSize: isXs ? 10 : 20,
    enableVirtualization: true,
    enableMessageLimiting: false,
    enableThrottling: true,
    debugMode: process.env.NODE_ENV === 'development'
  })

  // State for debugging and monitoring
  const [showPerformanceStats, setShowPerformanceStats] = useState(false)
  
  // Sync chat messages with optimization hook
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      // Only add new messages that aren't already in optimized messages
      const lastOptimizedId = optimizedMessages.length > 0 ? 
        optimizedMessages[optimizedMessages.length - 1].id : null
      
      if (chatMessages.length === 0) {
        clearMessages()
      } else if (!lastOptimizedId || 
                 chatMessages[chatMessages.length - 1].id !== lastOptimizedId) {
        // Find new messages to add
        const lastOptimizedIndex = lastOptimizedId ? 
          chatMessages.findIndex(msg => msg.id === lastOptimizedId) : -1
        
        const newMessages = lastOptimizedIndex >= 0 ? 
          chatMessages.slice(lastOptimizedIndex + 1) : chatMessages
        
        if (newMessages.length > 0) {
          addMessages(newMessages)
        }
      }
    }
  }, [chatMessages, optimizedMessages, addMessages, clearMessages])

  // Get chat theme
  const chatTheme = getChatThemeVariant(isDarkMode)

  console.log('[DEBUG_LOG] OptimizedChatWindow - currentRoom:', currentRoom)
  console.log('[DEBUG_LOG] OptimizedChatWindow - gameNumber:', gameNumber)
  console.log('[DEBUG_LOG] OptimizedChatWindow - socketConnected:', socketConnected)
  console.log('[DEBUG_LOG] OptimizedChatWindow - optimized messages count:', optimizedMessages.length)

  if (!gameNumber) {
    return (
      <Paper style={{ 
        padding: '16px', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}>
        <Typography variant="body2" style={{ color: '#f44336' }}>
          채팅을 사용할 수 없습니다. 방 정보를 확인해주세요.
        </Typography>
      </Paper>
    )
  }

  if (!socketConnected) {
    return (
      <Paper style={{ 
        padding: '16px', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}>
        <Typography variant="body2" style={{ color: '#2196f3' }}>
          채팅 연결 중...
        </Typography>
      </Paper>
    )
  }

  const handleSendMessage = (content) => {
    if (!currentRoom) {
      console.error('[DEBUG_LOG] Cannot send message: currentRoom is null/undefined')
      return
    }

    const gameNumber = currentRoom.gameNumber
    if (!gameNumber) {
      console.error('[DEBUG_LOG] Cannot send message: gameNumber is null/undefined')
      return
    }

    if (!socketConnected) {
      console.warn('[DEBUG_LOG] Cannot send message: WebSocket not connected')
      return
    }

    console.log('[DEBUG_LOG] Sending optimized chat message:', content, 'to game:', gameNumber)
    sendChatMessage(gameNumber, content)
  }

  const handlePerformanceStatsToggle = () => {
    setShowPerformanceStats(!showPerformanceStats)
    if (!showPerformanceStats) {
      console.log('[DEBUG_LOG] Performance Report:', getPerformanceReport())
    }
  }

  return (
    <Paper
      elevation={3}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '32px',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Chat header */}
      <Box style={{
        padding: isXs ? '12px' : '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        backgroundColor: '#667eea',
        transition: 'all 0.3s ease'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant={isXs ? "subtitle1" : "h6"} color="white">
            채팅 {gameNumber ? `#${gameNumber}` : ''}
            {isThrottling && (
              <Typography component="span" sx={{ ml: 1, opacity: 0.7, fontSize: '0.75em' }}>
                (처리중...)
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Performance stats toggle (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'white', 
                  fontSize: '10px',
                  minWidth: 'auto',
                  px: 1
                }}
                onClick={handlePerformanceStatsToggle}
              >
                성능
              </Button>
            )}
            
            {/* Connection status indicator */}
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: socketConnected ? 'success.main' : 'error.main',
                transition: THEME_TRANSITIONS.standard
              }}
            />
            <Typography variant="caption" color="white">
              {socketConnected ? '연결됨' : '연결 끊김'}
            </Typography>
          </Box>
        </Box>
        
        {/* Performance stats display */}
        {showPerformanceStats && process.env.NODE_ENV === 'development' && (
          <Box sx={{ 
            mt: 1, 
            p: 1, 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            borderRadius: 1,
            fontSize: '11px',
            color: 'white'
          }}>
            <Typography variant="caption" display="block">
              메시지: {performanceStats.messagesProcessed} | 
              삭제됨: {performanceStats.messagesDropped} | 
              렌더링: {performanceStats.averageRenderTime}ms | 
              메모리: {performanceStats.memoryUsage}MB
            </Typography>
          </Box>
        )}
      </Box>

      {/* Connection Error Alert */}
      {error.socket && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error.socket}
        </Alert>
      )}

      {/* No currentRoom warning */}
      {!currentRoom && (
        <Alert severity="warning" sx={{ m: 1 }}>
          방 정보를 불러오는 중입니다...
        </Alert>
      )}

      {/* Optimized Chat messages area */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: isXs ? 0.5 : 1
      }}>
        <ChatMessageList
          messages={optimizedMessages}
          currentUserId={currentUserId}
          isDarkMode={isDarkMode}
          height="100%" 
          autoScroll={true}
          maxMessages={10000}
          onScrollToBottom={() => {
            console.log('[DEBUG_LOG] User scrolled to bottom')
          }}
        />
      </Box>

      {/* Chat input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!currentRoom || !socketConnected}
      />
    </Paper>
  )
}

export default OptimizedChatWindow