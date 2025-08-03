import {useEffect, useRef} from 'react'
import {Alert, Box, List, Paper, Typography} from '@mui/material'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import {useGame} from '../context/GameContext'

/**
 * ChatWindow component serves as the main container for the chat functionality.
 * It displays chat messages and provides an input field for sending new messages.
 */
function ChatWindow() {
  // Get chat state and functions from context
  const { 
    chatMessages, 
    socketConnected, 
    sendChatMessage, 
    currentUser,
    currentRoom,  // 추가: gameNumber를 얻기 위해
    error 
  } = useGame()

  // Reference to the message list container for auto-scrolling
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Handle sending a new message via WebSocket
  const handleSendMessage = (content) => {
    // 더미 모드에서도 채팅 허용
    const isDummyMode = import.meta.env.VITE_USE_DUMMY_WEBSOCKET === 'true'
    
    if (!socketConnected && !isDummyMode) {
      console.warn('[DEBUG_LOG] Cannot send message: WebSocket not connected')
      return
    }
    
    // gameNumber 확인
    if (!currentRoom?.gameNumber) {
      console.warn('[DEBUG_LOG] Cannot send message: No gameNumber available')
      return
    }
    
    console.log('[DEBUG_LOG] Sending chat message:', content, 'to game:', currentRoom.gameNumber)
    // gameNumber와 content 모두 전달
    sendChatMessage(currentRoom.gameNumber, content)
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        overflow: 'hidden' // Ensures content doesn't overflow rounded corners
      }}
    >
      {/* Chat header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'primary.light'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="white">
            Game Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: socketConnected ? 'success.main' : 'error.main'
              }}
            />
            <Typography variant="caption" color="white">
              {socketConnected ? '연결됨' : '연결 끊김'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Connection Error Alert */}
      {error.socket && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error.socket}
        </Alert>
      )}

      {/* Chat messages area with scrolling */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 1
      }}>
        <List sx={{ width: '100%' }}>
          {chatMessages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'text.secondary'
            }}>
              <Typography variant="body2">
                {socketConnected ? '채팅을 시작해보세요!' : 'WebSocket에 연결 중...'}
              </Typography>
            </Box>
          ) : (
            chatMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
        </List>
      </Box>

      {/* Chat input area */}
      <ChatInput onSendMessage={handleSendMessage} />
    </Paper>
  )
}

export default ChatWindow