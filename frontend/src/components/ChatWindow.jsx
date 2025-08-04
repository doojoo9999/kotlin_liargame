import {useEffect, useRef} from 'react'
import {Alert, Box, Button, List, Paper, Typography} from '@mui/material'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import {useGame} from '../context/GameContext'

function ChatWindow() {
  const {
    chatMessages,
    socketConnected,
    sendChatMessage,
    currentUser,
    currentRoom,
    error
  } = useGame()

  const gameNumber = currentRoom?.gameNumber || currentRoom?.gNumber

  console.log('[DEBUG_LOG] ChatWindow - currentRoom from useGame:', currentRoom)
  console.log('[DEBUG_LOG] ChatWindow - gameNumber:', gameNumber)
  console.log('[DEBUG_LOG] ChatWindow - socketConnected:', socketConnected)

  if (!gameNumber) {
    return (
        <Paper sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="error" variant="body2">
            채팅을 사용할 수 없습니다. 방 정보를 확인해주세요.
          </Typography>
        </Paper>
    )
  }

  if (!socketConnected) {
    return (
        <Paper sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="info" variant="body2">
            채팅 연결 중...
          </Typography>
        </Paper>
    )

  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // 디버그 로그로 ChatWindow에서 currentRoom 확인
  useEffect(() => {
    console.log('[DEBUG_LOG] ChatWindow - currentRoom from useGame:', currentRoom)
    console.log('[DEBUG_LOG] ChatWindow - gameNumber:', currentRoom?.gameNumber || currentRoom?.gNumber)
    console.log('[DEBUG_LOG] ChatWindow - socketConnected:', socketConnected)
  }, [currentRoom, socketConnected])

  const handleSendMessage = (content) => {
    // currentRoom이 있는지 확인
    if (!currentRoom) {
      console.error('[DEBUG_LOG] Cannot send message: currentRoom is null/undefined')
      return
    }

    const gameNumber = currentRoom.gameNumber || currentRoom.gNumber
    if (!gameNumber) {
      console.error('[DEBUG_LOG] Cannot send message: gameNumber is null/undefined')
      return
    }

    if (!socketConnected) {
      console.warn('[DEBUG_LOG] Cannot send message: WebSocket not connected')
      return
    }

    console.log('[DEBUG_LOG] Sending chat message:', content, 'to game:', gameNumber)
    sendChatMessage(gameNumber, content)
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
            overflow: 'hidden'
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
              Game Chat {gameNumber ? `#${gameNumber}` : ''}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* 디버그 버튼들 */}
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'white', fontSize: '10px' }}
                onClick={() => {
                  if (currentRoom?.gNumber) {
                    console.log('[DEBUG] Manual chat history reload triggered')
                    // GameContext에서 loadChatHistory 함수를 export하여 사용
                    window.location.reload() // 임시 해결책
                  }
                }}
              >
                새로고침
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'white', fontSize: '10px' }}
                onClick={() => {
                  console.log('[DEBUG] Current chat state:', chatMessages)
                  console.log('[DEBUG] Socket connected:', socketConnected)
                  console.log('[DEBUG] Current room:', currentRoom)
                }}
              >
                상태확인
              </Button>
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

        {/* No currentRoom warning */}
        {!currentRoom && (
            <Alert severity="warning" sx={{ m: 1 }}>
              방 정보를 불러오는 중입니다...
            </Alert>
        )}

        {/* Chat messages area */}
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
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Chat input area - currentRoom이 있을 때만 활성화 */}
        <ChatInput
            onSendMessage={handleSendMessage}
            disabled={!currentRoom || !socketConnected}
        />
      </Paper>
  )
}

export default ChatWindow
