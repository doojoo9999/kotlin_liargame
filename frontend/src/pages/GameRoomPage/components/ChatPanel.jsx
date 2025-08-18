// Modernized ChatPanel component
// Bubble-style chat with modern message system

import React, {useEffect, useRef, useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Box, CircularProgress, Typography, useRipple} from '../../../components/ui'
import {Send as SendIcon} from 'lucide-react'
import {getChatPanelStyles, getResponsiveStyles} from './ChatPanel.styles'

// Message Bubble Component
const MessageBubble = React.memo(function MessageBubble({
  message,
  isUser = false,
  isSystem = false,
  theme,
  ...props
}) {
  const styles = getChatPanelStyles(theme)
  
  if (isSystem) {
    return (
      <motion.div
        style={styles.messageBubble('system', theme)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        <div style={styles.messageContent}>
          {message.content}
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      style={styles.messageBubble(isUser ? 'user' : 'other', theme)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {!isSystem && (
        <div style={styles.messageHeader}>
          <span style={styles.senderName(isUser, theme)}>
            {message.senderName || '알 수 없음'}
          </span>
          <span style={styles.timestamp(isUser, theme)}>
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
          </span>
        </div>
      )}
      
      <div style={styles.messageContent}>
        {message.content}
      </div>
    </motion.div>
  )
})

// Main ChatPanel Component
const ChatPanel = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  currentUserId,
  theme,
  className = '',
  ...props
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const styles = getChatPanelStyles(theme)
  const responsiveStyles = getResponsiveStyles(theme)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return
    
    onSendMessage?.(inputValue.trim())
    setInputValue('')
    setIsTyping(false)
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }
  
  const isUserMessage = (message) => {
    return message.senderId === currentUserId
  }
  
  return (
    <motion.div
      style={{
        ...styles.container,
        ...responsiveStyles.container
      }}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {/* Message List */}
      <div
        style={{
          ...styles.messageListContainer,
          ...responsiveStyles.messageListContainer,
          ...styles.scrollbar
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div style={styles.loadingContainer}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              메시지를 불러오는 중...
            </Typography>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <Typography variant="h6">💬</Typography>
            <Typography variant="body1">
              아직 메시지가 없습니다
            </Typography>
            <Typography variant="body2">
              첫 번째 메시지를 보내보세요!
            </Typography>
          </div>
        ) : (
          <div style={styles.messagesContainer}>
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  style={styles.bubbleContainer(
                    isUserMessage(message),
                    message.type === 'system'
                  )}
                >
                  <MessageBubble
                    message={message}
                    isUser={isUserMessage(message)}
                    isSystem={message.type === 'system'}
                    theme={theme}
                  />
                </div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Section */}
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          style={styles.inputField}
        />
        
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          style={styles.sendButton}
          title="메시지 보내기"
        >
          <SendIcon size={20} />
        </button>
      </div>
    </motion.div>
  )
}

export default ChatPanel
