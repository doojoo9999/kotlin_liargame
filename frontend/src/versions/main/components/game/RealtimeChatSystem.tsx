import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {Send, Users, Wifi, WifiOff} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Input} from "@/versions/main/components/ui/input"
import {Button} from "@/versions/main/components/ui/button"
import {Badge} from "@/versions/main/components/ui/badge"
import {ScrollArea} from "@/versions/main/components/ui/scroll-area"
import {useChatSubscriber} from "@/versions/main/hooks/useChatSubscriber"
import {chatMessageSlide} from "@/versions/main/animations"
import type {ChatMessage, ChatMessageType, GamePhase} from "@/shared/types/api.types"

interface RealtimeChatSystemProps {
  gameNumber: number
  currentPlayerNickname: string
  gamePhase: GamePhase
  disabled?: boolean
  className?: string
  maxHeight?: string
}

const messageTypeStyles = {
  HINT: "bg-blue-50 border-l-4 border-blue-400 text-blue-800",
  DISCUSSION: "bg-gray-50 border-gray-200",
  DEFENSE: "bg-orange-50 border-l-4 border-orange-400 text-orange-800",
  POST_ROUND: "bg-green-50 border-l-4 border-green-400 text-green-800",
  SYSTEM: "bg-yellow-50 border-yellow-200 text-yellow-800 text-center"
}

const messageTypeLabels = {
  HINT: "💡 힌트",
  DISCUSSION: "💬 대화",
  DEFENSE: "🛡️ 변론",
  POST_ROUND: "📋 라운드 정리",
  SYSTEM: "🔔 시스템"
}

export function RealtimeChatSystem({
  gameNumber,
  currentPlayerNickname,
  gamePhase,
  disabled = false,
  className,
  maxHeight = "h-96"
}: RealtimeChatSystemProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>()

  const {
    messages,
    typingUsers,
    isConnected,
    sendMessage,
    sendTypingIndicator
  } = useChatSubscriber({
    gameNumber,
    currentPlayerNickname,
    onMessageReceived: (message) => {
      // 새 메시지 수신 시 스크롤을 아래로
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      }, 100)
    }
  })

  // 메시지 타입 결정 (게임 단계에 따라)
  const getMessageType = (): ChatMessageType => {
    switch (gamePhase) {
      case 'HINT_PROVIDING':
        return 'HINT'
      case 'DEFENSE':
        return 'DEFENSE'
      case 'RESULT':
        return 'POST_ROUND'
      default:
        return 'DISCUSSION'
    }
  }

  // 채팅 가능 여부 판단
  const canSendMessage = React.useMemo(() => {
    if (disabled || !isConnected) return false

    // 투표 시간에는 채팅 제한
    if (gamePhase === 'VOTING' || gamePhase === 'FINAL_VOTING') {
      return false
    }

    return true
  }, [disabled, isConnected, gamePhase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // 타이핑 인디케이터 관리
    if (value && !isTyping) {
      setIsTyping(true)
      sendTypingIndicator(true)
    }

    // 타이핑 정지 타이머
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingIndicator(false)
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !canSendMessage) return

    const messageType = getMessageType()
    const success = await sendMessage(inputValue.trim(), messageType)

    if (success) {
      setInputValue("")
      setIsTyping(false)
      sendTypingIndicator(false)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.playerNickname === currentPlayerNickname
    const isSystem = message.type === 'SYSTEM'

    return (
      <motion.div
        key={message.id}
        variants={chatMessageSlide}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "p-3 rounded-lg border mb-3 max-w-[85%]",
          messageTypeStyles[message.type],
          isOwnMessage && !isSystem && "ml-auto bg-blue-500 text-white border-blue-500",
          isSystem && "mx-auto max-w-full"
        )}
      >
        {!isSystem && message.playerNickname && (
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {message.playerNickname}
                {isOwnMessage && " (나)"}
              </span>
              <Badge variant="outline" className="text-xs">
                {messageTypeLabels[message.type]}
              </Badge>
            </div>
            <span className="text-xs opacity-70">
              {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        <div className={cn(
          "text-sm leading-relaxed",
          isSystem && "font-medium"
        )}>
          {message.content}
        </div>
      </motion.div>
    )
  }

  const getPhaseMessage = () => {
    switch (gamePhase) {
      case 'VOTING':
      case 'FINAL_VOTING':
        return "투표 시간에는 채팅할 수 없습니다"
      case 'HINT_PROVIDING':
        return "힌트를 공유해보세요"
      case 'DEFENSE':
        return "변론 시간입니다"
      case 'DISCUSSION':
        return "자유롭게 대화하세요"
      default:
        return "채팅을 시작하세요"
    }
  }

  return (
    <Card className={cn("flex flex-col", maxHeight, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            실시간 채팅
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                <Wifi className="w-3 h-3 mr-1" />
                연결됨
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                연결 끊김
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {messages.length}개
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1 px-4 pb-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <Users className="w-8 h-8 mb-2 opacity-50" />
              <p>아직 메시지가 없습니다</p>
              <p className="text-sm">{getPhaseMessage()}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {messages.map(renderMessage)}
              </AnimatePresence>
            </div>
          )}

          {/* 타이핑 인디케이터 */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-muted-foreground py-2"
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0]}님이 입력 중...`
                    : `${typingUsers.length}명이 입력 중...`
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* 메시지 입력 */}
        <div className="p-4 border-t">
          {!canSendMessage ? (
            <div className="text-center text-sm text-muted-foreground py-3 bg-muted/50 rounded-lg">
              {!isConnected ? "서버와 연결이 끊어졌습니다" : getPhaseMessage()}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={`${messageTypeLabels[getMessageType()]} 메시지를 입력하세요...`}
                  maxLength={200}
                  disabled={!canSendMessage}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || !canSendMessage}
                  variant="game-primary"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  타입: {messageTypeLabels[getMessageType()]}
                </span>
                <span>
                  {inputValue.length}/200
                </span>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
