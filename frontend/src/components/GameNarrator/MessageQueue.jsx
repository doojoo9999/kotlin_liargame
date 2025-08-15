import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Fade} from '@mui/material'
import NarratorBubble from './NarratorBubble.jsx'

const MAX_QUEUE_SIZE = 5
const MAX_DISPLAYED_MESSAGES = 10
const MESSAGE_DISPLAY_DURATION = 8000 // 8 seconds

const PRIORITY_LEVELS = {
  LOW: 1,
  NORMAL: 2, 
  HIGH: 3,
  CRITICAL: 4
}

const MessageQueue = React.memo(function MessageQueue({
  isMobile = false,
  position = 'left',
  autoCleanup = true,
  sx = {}
}) {
  const [messageQueue, setMessageQueue] = useState([])
  const [displayedMessages, setDisplayedMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const processingRef = useRef(false)
  const messageIdCounter = useRef(0)

  // Add message to queue with priority
  const addMessage = useCallback((messageData) => {
    const message = {
      id: ++messageIdCounter.current,
      timestamp: Date.now(),
      priority: messageData.priority || PRIORITY_LEVELS.NORMAL,
      ...messageData
    }

    setMessageQueue(prevQueue => {
      // Add new message and sort by priority (higher first) and timestamp
      const newQueue = [...prevQueue, message].sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority // Higher priority first
        }
        return a.timestamp - b.timestamp // Earlier timestamp first for same priority
      })
      
      // Limit queue size
      return newQueue.slice(0, MAX_QUEUE_SIZE)
    })
  }, [])

  // Remove message from queue
  const removeMessage = useCallback((messageId) => {
    setMessageQueue(prevQueue => 
      prevQueue.filter(msg => msg.id !== messageId)
    )
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessageQueue([])
    setDisplayedMessages([])
  }, [])

  // Process next message in queue
  const processNextMessage = useCallback(() => {
    if (processingRef.current || messageQueue.length === 0) {
      setIsProcessing(false)
      return
    }

    processingRef.current = true
    setIsProcessing(true)

    const nextMessage = messageQueue[0]
    
    // Move message from queue to displayed
    setMessageQueue(prevQueue => prevQueue.slice(1))
    setDisplayedMessages(prevDisplayed => {
      const newDisplayed = [...prevDisplayed, {
        ...nextMessage,
        startTime: Date.now()
      }]
      
      // Limit displayed messages
      return newDisplayed.slice(-MAX_DISPLAYED_MESSAGES)
    })

    // Set timeout for next processing
    setTimeout(() => {
      processingRef.current = false
      setIsProcessing(false)
    }, 1000) // Wait 1 second between messages
  }, [messageQueue])

  // Auto-cleanup old messages
  useEffect(() => {
    if (!autoCleanup) return

    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setDisplayedMessages(prevDisplayed => 
        prevDisplayed.filter(msg => 
          now - msg.startTime < MESSAGE_DISPLAY_DURATION
        )
      )
    }, 2000) // Check every 2 seconds

    return () => clearInterval(cleanupInterval)
  }, [autoCleanup])

  // Process queue when new messages arrive
  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessing) {
      const timer = setTimeout(processNextMessage, 100)
      return () => clearTimeout(timer)
    }
  }, [messageQueue, isProcessing, processNextMessage])

  // Handle message completion
  const handleMessageComplete = useCallback((messageId) => {
    // Message typing completed - can trigger next message sooner
    if (!isProcessing && messageQueue.length > 0) {
      setTimeout(processNextMessage, 500)
    }
  }, [isProcessing, messageQueue.length, processNextMessage])

  const handleMessageSkip = useCallback((messageId) => {
    // Message was skipped - process next immediately
    if (!isProcessing && messageQueue.length > 0) {
      setTimeout(processNextMessage, 200)
    }
  }, [isProcessing, messageQueue.length, processNextMessage])

  // Expose methods for external use
  React.useImperativeHandle(React.forwardRef().ref, () => ({
    addMessage,
    removeMessage,
    clearMessages,
    getQueueLength: () => messageQueue.length,
    getDisplayedCount: () => displayedMessages.length
  }), [addMessage, removeMessage, clearMessages, messageQueue.length, displayedMessages.length])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '60px',
        ...sx
      }}
    >
      {/* Displayed Messages */}
      {displayedMessages.map((message, index) => (
        <Fade
          key={message.id}
          in={true}
          timeout={500}
          style={{
            transitionDelay: `${index * 100}ms`
          }}
        >
          <Box sx={{ mb: 1 }}>
            <NarratorBubble
              message={message.text}
              category={message.category}
              icon={message.icon}
              effects={message.effects}
              position={position}
              isMobile={isMobile}
              onComplete={() => handleMessageComplete(message.id)}
              onSkip={() => handleMessageSkip(message.id)}
              variant={message.variant}
              clickToSkip={message.clickToSkip !== false}
            />
          </Box>
        </Fade>
      ))}

      {/* Queue Status (Debug - can be removed) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            zIndex: 9999
          }}
        >
          Queue: {messageQueue.length} | Displayed: {displayedMessages.length}
        </Box>
      )}
    </Box>
  )
})

// Create a global message queue instance
let globalMessageQueue = null

// Hook for using the message queue
export const useMessageQueue = () => {
  const messageQueueRef = useRef(null)

  const addMessage = useCallback((messageData) => {
    if (messageQueueRef.current) {
      messageQueueRef.current.addMessage(messageData)
    }
  }, [])

  const clearMessages = useCallback(() => {
    if (messageQueueRef.current) {
      messageQueueRef.current.clearMessages()
    }
  }, [])

  return {
    messageQueueRef,
    addMessage,
    clearMessages,
    PRIORITY_LEVELS
  }
}

MessageQueue.displayName = 'MessageQueue'
export default MessageQueue