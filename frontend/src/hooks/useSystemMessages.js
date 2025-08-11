import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {MESSAGE_TYPES} from '../components/SystemNotifications'

const useSystemMessages = ({
  maxMessages = 50,
  autoCleanupInterval = 300000, // 5 minutes
  priorityRetentionTime = 600000, // 10 minutes for high priority
  enableAutoCleanup = true,
  gameStatus = 'WAITING'
}) => {
  const [messages, setMessages] = useState([])
  const [dismissedMessages, setDismissedMessages] = useState(new Set())
  const [messageQueue, setMessageQueue] = useState([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  
  const cleanupIntervalRef = useRef(null)
  const queueProcessorRef = useRef(null)

  const addMessage = useCallback((message) => {
    const standardizedMessage = {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: message.type || 'INFO',
      content: message.content || message.message || '',
      timestamp: message.timestamp || new Date().toISOString(),
      playerId: message.playerId,
      playerName: message.playerName || message.playerNickname || message.sender,
      gameStatus: gameStatus,
      priority: MESSAGE_TYPES[message.type]?.priority || 'low',
      data: message.data || {},
      persistent: message.persistent || false,
      autoRemove: message.autoRemove !== false, // Default to true unless explicitly false
      expiresAt: message.expiresAt || (
        MESSAGE_TYPES[message.type]?.priority === 'high' 
          ? new Date(Date.now() + priorityRetentionTime).toISOString()
          : new Date(Date.now() + autoCleanupInterval).toISOString()
      )
    }

    setMessages(prevMessages => {
      const updatedMessages = [standardizedMessage, ...prevMessages]
      
      if (updatedMessages.length > maxMessages) {
        return updatedMessages.slice(0, maxMessages)
      }
      
      return updatedMessages
    })

    return standardizedMessage.id
  }, [gameStatus, maxMessages, autoCleanupInterval, priorityRetentionTime])

  const addMessages = useCallback((messagesArray) => {
    const messageIds = messagesArray.map(msg => {
      setMessageQueue(prev => [...prev, msg])
      return `queued-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    })

    return messageIds
  }, [])

  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true)
      
      const processNextBatch = () => {
        setMessageQueue(prevQueue => {
          if (prevQueue.length === 0) {
            setIsProcessingQueue(false)
            return prevQueue
          }

          const batch = prevQueue.slice(0, 3)
          const remaining = prevQueue.slice(3)

          batch.forEach(msg => {
            addMessage(msg)
          })

          if (remaining.length > 0) {
            setTimeout(processNextBatch, 100)
          } else {
            setIsProcessingQueue(false)
          }

          return remaining
        })
      }

      queueProcessorRef.current = setTimeout(processNextBatch, 50)
    }

    return () => {
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current)
      }
    }
  }, [messageQueue.length, isProcessingQueue, addMessage])

  const removeMessage = useCallback((messageId) => {
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== messageId)
    )
  }, [])

  const dismissMessage = useCallback((messageId) => {
    setDismissedMessages(prevDismissed => 
      new Set([...prevDismissed, messageId])
    )
  }, [])

  const clearAllMessages = useCallback(() => {
    setMessages([])
    setDismissedMessages(new Set())
    setMessageQueue([])
  }, [])

  const clearMessagesByType = useCallback((type) => {
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.type !== type)
    )
  }, [])

  const getFilteredMessages = useCallback((filters = {}) => {
    return messages.filter(message => {
      if (filters.includeDismissed !== true && dismissedMessages.has(message.id)) {
        return false
      }

      if (filters.type && message.type !== filters.type) {
        return false
      }

      if (filters.priority && message.priority !== filters.priority) {
        return false
      }

      if (filters.gameStatus && message.gameStatus !== filters.gameStatus) {
        return false
      }

      if (filters.since) {
        const messageTime = new Date(message.timestamp)
        const sinceTime = new Date(filters.since)
        if (messageTime < sinceTime) {
          return false
        }
      }

      if (filters.playerId && message.playerId !== filters.playerId) {
        return false
      }

      return true
    })
  }, [messages, dismissedMessages])

  const getMessageStats = useCallback(() => {
    const stats = {
      total: messages.length,
      dismissed: dismissedMessages.size,
      visible: messages.length - dismissedMessages.size,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {},
      recent: 0, // Messages from last 5 minutes
      queueLength: messageQueue.length,
      isProcessing: isProcessingQueue
    }

    const fiveMinutesAgo = new Date(Date.now() - 300000)

    messages.forEach(message => {
      stats.byPriority[message.priority] = (stats.byPriority[message.priority] || 0) + 1
      
      stats.byType[message.type] = (stats.byType[message.type] || 0) + 1
      
      if (new Date(message.timestamp) > fiveMinutesAgo) {
        stats.recent += 1
      }
    })

    return stats
  }, [messages, dismissedMessages, messageQueue.length, isProcessingQueue])

  const performCleanup = useCallback(() => {
    const now = new Date()
    
    setMessages(prevMessages => 
      prevMessages.filter(message => {
        if (message.persistent) {
          return true
        }

        if (message.expiresAt && new Date(message.expiresAt) < now) {
          return false
        }

        if (!message.autoRemove) {
          return true
        }

        return true
      })
    )

    const oldestAllowedTime = new Date(now.getTime() - (autoCleanupInterval * 2))
    const messagesToKeep = messages.filter(msg => 
      new Date(msg.timestamp) > oldestAllowedTime
    )
    const validIds = new Set(messagesToKeep.map(msg => msg.id))
    
    setDismissedMessages(prevDismissed => 
      new Set([...prevDismissed].filter(id => validIds.has(id)))
    )
  }, [messages, autoCleanupInterval])

  useEffect(() => {
    if (enableAutoCleanup) {
      cleanupIntervalRef.current = setInterval(performCleanup, autoCleanupInterval)
      
      return () => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current)
        }
      }
    }
  }, [enableAutoCleanup, autoCleanupInterval, performCleanup])

  const generateGameEventMessage = useCallback((eventType, data = {}) => {
    const eventMessages = {
      GAME_START: {
        type: 'GAME_START',
        content: `게임이 시작되었습니다. 주제: ${data.subject || '미지정'}`,
        priority: 'high'
      },
      TURN_CHANGE: {
        type: 'TURN_CHANGE', 
        content: `${data.playerName || '플레이어'}님의 차례입니다.`,
        priority: 'medium'
      },
      VOTE_START: {
        type: 'VOTE_START',
        content: '투표가 시작되었습니다. 라이어로 의심되는 플레이어에게 투표하세요.',
        priority: 'high'
      },
      DEFENSE_TIME: {
        type: 'DEFENSE_TIME',
        content: `${data.accusedPlayer || '지목된 플레이어'}님의 변론 시간입니다.`,
        priority: 'high'
      },
      WORD_GUESS: {
        type: 'WORD_GUESS',
        content: '라이어가 실제 단어를 추리하고 있습니다.',
        priority: 'high'
      },
      GAME_END: {
        type: 'GAME_END',
        content: `게임이 종료되었습니다. 승리팀: ${data.winner || '미정'}`,
        priority: 'high'
      }
    }

    const eventMessage = eventMessages[eventType]
    if (eventMessage) {
      return addMessage({
        ...eventMessage,
        ...data,
        timestamp: new Date().toISOString()
      })
    }

    return null
  }, [addMessage])

  const activeMessages = useMemo(() => {
    return getFilteredMessages({ includeDismissed: false })
  }, [getFilteredMessages])

  const urgentMessages = useMemo(() => {
    return getFilteredMessages({ 
      priority: 'high', 
      includeDismissed: false 
    })
  }, [getFilteredMessages])

  return {
    messages: activeMessages,
    allMessages: messages,
    urgentMessages,
    
    queueLength: messageQueue.length,
    isProcessingQueue,
    
    addMessage,
    addMessages,
    removeMessage,
    dismissMessage,
    clearAllMessages,
    clearMessagesByType,
    generateGameEventMessage,
    
    getFilteredMessages,
    getMessageStats,
    
    performCleanup,
    dismissedCount: dismissedMessages.size
  }
}

export default useSystemMessages