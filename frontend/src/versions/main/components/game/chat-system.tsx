import * as React from "react"
import {motion} from "framer-motion"
import {Clock, Send} from "lucide-react"
import {cn, formatTime} from "../../../lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card"
import {Input} from "../ui/input"
import {Button} from "../ui/button"
import {Badge} from "../ui/badge"
import {ScrollArea} from "../ui/scroll-area"
import {ChatMessage, ChatMessageType} from "../../../types/game"

interface ChatSystemProps {
  messages: ChatMessage[]
  onSendMessage: (content: string, type?: ChatMessageType) => void
  gameNumber: number
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  currentPhase?: string
  timeRemaining?: number
  className?: string
}

interface ChatMessageProps {
  message: ChatMessage
  animated?: boolean
}

const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.8 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}

const typeColors = {
  HINT: 'bg-blue-100 border-blue-300 text-blue-800',
  DISCUSSION: 'bg-gray-100 border-gray-300 text-gray-800',
  DEFENSE: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  POST_ROUND: 'bg-green-100 border-green-300 text-green-800',
  SYSTEM: 'bg-red-100 border-red-300 text-red-800'
}

function ChatMessageComponent({ message, animated = true }: ChatMessageProps) {
  const isSystem = message.type === 'SYSTEM'
  const isCurrentUser = false // TODO: 현재 사용자 체크 로직

  return (
    <motion.div
      variants={animated ? messageVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
      exit={animated ? "exit" : undefined}
      className={cn(
        "mb-3 p-3 rounded-lg border max-w-xs",
        typeColors[message.type],
        isCurrentUser ? "ml-auto" : "mr-auto",
        isSystem && "mx-auto max-w-full text-center"
      )}
    >
      {!isSystem && (
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">
            {message.playerNickname}
          </span>
          <span className="text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className={cn(
        "text-sm",
        isSystem && "font-medium"
      )}>
        {message.content}
      </div>

      {message.type !== 'DISCUSSION' && message.type !== 'SYSTEM' && (
        <Badge variant="outline" className="mt-1 text-xs">
          {message.type === 'HINT' && '힌트'}
          {message.type === 'DEFENSE' && '변론'}
          {message.type === 'POST_ROUND' && '라운드 종료'}
        </Badge>
      )}
    </motion.div>
  )
}

export function ChatSystem({
  messages,
  onSendMessage,
  gameNumber,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  maxLength = 500,
  currentPhase,
  timeRemaining,
  className
}: ChatSystemProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  // 새 메시지가 올 때마다 스크롤을 아래로
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || disabled) return

    onSendMessage(inputValue.trim())
    setInputValue("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)

    // 타이핑 인디케이터
    if (!isTyping) {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 1000)
    }
  }

  const canSendMessage = !disabled && inputValue.trim().length > 0

  return (
    <Card className={cn("flex flex-col h-96", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>채팅</span>
          <div className="flex items-center space-x-2">
            {timeRemaining !== undefined && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
            {currentPhase && (
              <Badge variant="secondary" className="text-xs">
                {currentPhase}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3 p-0">
        {/* 메시지 목록 */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>아직 메시지가 없습니다.</p>
                <p className="text-sm">채팅을 시작해보세요!</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  animated={true}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* 타이핑 인디케이터 */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 text-xs text-muted-foreground"
          >
            누군가 입력 중...
          </motion.div>
        )}

        {/* 메시지 입력 폼 */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder={disabled ? "채팅이 비활성화되었습니다" : placeholder}
              maxLength={maxLength}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              variant="game-primary"
              disabled={!canSendMessage}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* 글자 수 표시 */}
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>
              {inputValue.length}/{maxLength}
            </span>
            {disabled && (
              <span className="text-red-500">
                현재 단계에서는 채팅을 사용할 수 없습니다
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
