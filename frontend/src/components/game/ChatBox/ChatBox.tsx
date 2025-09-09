import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {Maximize2, MessageCircle, Minimize2, Send, Users, WifiOff} from "lucide-react"
import {Avatar, AvatarFallback} from "@radix-ui/react-avatar"

import {cn} from "@/lib/utils"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {GameButton} from "@/components/ui/game-button"
import {Badge} from "@/components/ui/badge"
import {type Player, useGameStore} from "@/store/gameStore"
import {useWebSocketActions} from "@/hooks/useWebSocketConnection"
import {type ChatMessage} from "@/api/websocket"

export interface ChatBoxProps {
  className?: string
  compact?: boolean
  showPlayerList?: boolean
  maxMessages?: number
}

const MessageComponent: React.FC<{
  message: ChatMessage
  currentPlayer: Player
  isLatest?: boolean
}> = ({ message, currentPlayer }) => {
  const isOwn = message.playerId === currentPlayer.id
  const isSystem = message.type === 'SYSTEM'

  const messageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageTypeStyles = () => {
    switch (message.type) {
      case 'SYSTEM':
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center"
      case 'HINT':
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
      case 'DEFENSE':
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
      case 'DISCUSSION':
      default:
        return ""
    }
  }

  if (isSystem) {
    return (
      <motion.div
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "px-3 py-2 rounded-lg text-sm mx-4 mb-2",
          getMessageTypeStyles()
        )}
      >
        <div className="flex items-center justify-center space-x-1">
          <MessageCircle className="w-3 h-3" />
          <span>{message.content}</span>
          <span className="text-xs opacity-70 ml-2">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex mb-3 px-4",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex items-start space-x-2 max-w-[80%]",
        isOwn && "flex-row-reverse space-x-reverse"
      )}>
        {/* Avatar */}
        {!isOwn && (
          <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
              {message.playerNickname.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2 shadow-sm",
          isOwn 
            ? "bg-blue-600 text-white rounded-tr-sm" 
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm",
          getMessageTypeStyles()
        )}>
          {/* Player name for received messages */}
          {!isOwn && (
            <div className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400">
              {message.playerNickname}
            </div>
          )}
          
          {/* Message type indicator */}
          {message.type !== 'DISCUSSION' && (
            <Badge 
              variant="secondary" 
              className="text-xs mb-1"
            >
              {message.type.toLowerCase()}
            </Badge>
          )}
          
          {/* Message text */}
          <div className="text-sm leading-relaxed break-words">
            {message.content}
          </div>
          
          {/* Timestamp */}
          <div className={cn(
            "text-xs mt-1 opacity-70",
            isOwn ? "text-right" : "text-left"
          )}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const TypingIndicator: React.FC<{
  typingPlayerIds: Set<string>
  players: Player[]
}> = ({ typingPlayerIds, players }) => {
  if (typingPlayerIds.size === 0) return null

  const typingPlayers = players.filter(p => typingPlayerIds.has(p.id))

  const getTypingText = () => {
    if (typingPlayers.length === 1) {
      return `${typingPlayers[0].nickname} is typing...`
    } else if (typingPlayers.length === 2) {
      return `${typingPlayers[0].nickname} and ${typingPlayers[1].nickname} are typing...`
    } else {
      return `${typingPlayers.length} people are typing...`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-4 pb-2"
    >
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex space-x-1">
          <motion.div
            className="w-1 h-1 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-1 h-1 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1 h-1 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
        <span>{getTypingText()}</span>
      </div>
    </motion.div>
  )
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  className,
  compact = false,
  showPlayerList = false,
  maxMessages = 100,
}) => {
  // Get data from store
  const {
    chatMessages,
    players,
    currentPlayer,
    typingPlayers,
    gamePhase,
    connectionState
  } = useGameStore()

  // WebSocket actions
  const { 
    sendChat, 
    startTyping, 
    stopTyping, 
    isConnected 
  } = useWebSocketActions()
  const [message, setMessage] = React.useState("")
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [typingTimeout, setTypingTimeout] = React.useState<NodeJS.Timeout | null>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const displayMessages = chatMessages.slice(-maxMessages)
  
  // Determine chat restrictions based on game phase
  const isChatRestricted = () => {
    switch (gamePhase) {
      case 'VOTING_FOR_LIAR':
      case 'VOTING_FOR_SURVIVAL':
        return true // No chat during voting
      case 'DEFENDING':
        // Only the targeted player can defend (this would need additional logic)
        return false
      case 'SPEECH':
        // During speech phase, only current turn player can give hints
        return false
      default:
        return false
    }
  }

  const getChatPlaceholder = () => {
    if (!isConnected) return "Connecting to chat..."
    if (isChatRestricted()) {
      switch (gamePhase) {
        case 'VOTING_FOR_LIAR':
        case 'VOTING_FOR_SURVIVAL':
          return "Chat disabled during voting"
        default:
          return "Chat restricted in this phase"
      }
    }
    return "Type a message..."
  }

  const getChatType = (): 'DISCUSSION' | 'HINT' | 'DEFENSE' => {
    switch (gamePhase) {
      case 'SPEECH':
        return 'HINT'
      case 'DEFENDING':
        return 'DEFENSE'
      default:
        return 'DISCUSSION'
    }
  }

  // Auto scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendMessage = () => {
    if (!message.trim() || isChatRestricted() || !isConnected) return
    
    const success = sendChat(message.trim(), getChatType())
    if (success) {
      setMessage("")
      // Stop typing indicator
      stopTyping()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    
    // Typing indicator logic
    if (!typingTimeout && isConnected) {
      startTyping()
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    const timeout = setTimeout(() => {
      stopTyping()
      setTypingTimeout(null)
    }, 2000)
    
    setTypingTimeout(timeout)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  React.useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [typingTimeout])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col",
        compact ? "h-64" : "h-96",
        className
      )}
    >
      <Card className="flex-1 flex flex-col h-full border-2 border-blue-200 dark:border-blue-800">
        {/* Header */}
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                Game Chat
              </h3>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                {players.filter(p => p.isOnline).length} online
              </div>
              
              {/* Connection Status Indicator */}
              {connectionState !== 'connected' && (
                <div className="flex items-center space-x-1">
                  {connectionState === 'connecting' || connectionState === 'reconnecting' ? (
                    <WifiOff className="w-4 h-4 text-yellow-500 animate-pulse" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500 capitalize">
                    {connectionState}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showPlayerList && (
                <GameButton
                  variant="ghost"
                  size="icon-sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Users className="w-4 h-4" />
                </GameButton>
              )}
              
              <GameButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </GameButton>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div 
                  ref={scrollAreaRef}
                  className="flex-1 overflow-y-auto"
                  style={{ minHeight: 0 }}
                >
                  <div className="py-2">
                    <AnimatePresence mode="popLayout">
                      {displayMessages.map((msg, index) => (
                        <MessageComponent
                          key={msg.id}
                          message={msg}
                          currentPlayer={currentPlayer!}
                          isLatest={index === displayMessages.length - 1}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing Indicator */}
                    <AnimatePresence>
                      <TypingIndicator typingPlayerIds={typingPlayers} players={players} />
                    </AnimatePresence>
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="border-t p-3">
                  <div className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder={getChatPlaceholder()}
                      disabled={isChatRestricted() || !isConnected}
                      className="flex-1"
                      maxLength={500}
                    />
                    
                    <GameButton
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isChatRestricted() || !isConnected}
                      size="icon"
                      variant="primary"
                    >
                      <Send className="w-4 h-4" />
                    </GameButton>
                  </div>
                  
                  {/* Character count */}
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>
                      {message.length}/500
                    </span>
                    <span>
                      Press Enter to send
                    </span>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}