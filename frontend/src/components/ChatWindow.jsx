import {useEffect, useRef, useState} from 'react'
import {Box, List, Paper, Typography} from '@mui/material'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

/**
 * ChatWindow component serves as the main container for the chat functionality.
 * It displays chat messages and provides an input field for sending new messages.
 */
function ChatWindow() {
  // Initial dummy chat messages
  const [messages, setMessages] = useState([
    { id: 1, content: "게임이 시작되었습니다!", isSystem: true },
    { id: 2, sender: "Player 1", content: "안녕하세요! 반갑습니다." },
    { id: 3, sender: "Player 2", content: "저도 반가워요! 오늘 주제는 뭘까요?" },
    { id: 4, content: "라이어가 선정되었습니다!", isSystem: true },
    { id: 5, sender: "Player 3", content: "이번 주제는 어려울 것 같아요." },
    { id: 6, sender: "Player 4", content: "저는 준비됐어요! 시작해봅시다." },
    { id: 7, content: "30초 뒤 투표가 시작됩니다.", isSystem: true },
  ])

  // Reference to the message list container for auto-scrolling
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle sending a new message
  const handleSendMessage = (content) => {
    const newMessage = {
      id: messages.length + 1,
      sender: "You", // In a real app, this would be the current user's name
      content,
      isSystem: false
    }
    setMessages([...messages, newMessage])
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
        <Typography variant="h6" color="white">
          Game Chat
        </Typography>
      </Box>

      {/* Chat messages area with scrolling */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 1
      }}>
        <List sx={{ width: '100%' }}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
        </List>
      </Box>

      {/* Chat input area */}
      <ChatInput onSendMessage={handleSendMessage} />
    </Paper>
  )
}

export default ChatWindow