import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import OptimizedEnhancedChatSystem from '../../../components/OptimizedEnhancedChatSystem'

const ChatPanel = React.memo(function ChatPanel({
  messages,
  currentUser,
  onSendMessage,
  disabled,
  placeholder,
}) {
  return (
    <OptimizedEnhancedChatSystem
      messages={messages || []}
      currentUser={currentUser}
      onSendMessage={onSendMessage}
      disabled={disabled}
      placeholder={placeholder}
      fallback={
        disabled ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              서버에 연결 중...
            </Typography>
          </Box>
        ) : null
      }
    />
  )
})

ChatPanel.displayName = 'ChatPanel'
export default ChatPanel
