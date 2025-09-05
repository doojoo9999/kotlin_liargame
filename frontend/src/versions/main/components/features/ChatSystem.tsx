import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Input} from "@/versions/main/components/ui/input"
import {Button} from "@/versions/main/components/ui/button"
import {Badge} from "@/versions/main/components/ui/badge"
import {MessageSquare, Send, Volume2, VolumeX} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"

export interface ChatMessage {
  id: string
  player: string
  message: string
  timestamp: string
  type: 'DISCUSSION' | 'SYSTEM' | 'HINT' | 'DEFENSE' // NORMAL → DISCUSSION 변경
  isOwnMessage?: boolean
}

export interface ChatSystemProps {
  messages: ChatMessage[]
  currentPlayer: string
  gamePhase?: 'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING'
  disabled?: boolean
  onSendMessage?: (message: string) => void
  className?: string
  maxHeight?: string
}

export function ChatSystem({
  messages,
  currentPlayer,
  gamePhase = 'WAITING',
  disabled = false,
  onSendMessage,
  className,
  maxHeight = "h-96"
}: ChatSystemProps) {
  const [newMessage, setNewMessage] = React.useState("")
  const [isMuted, setIsMuted] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // 메시지 목록 자동 스크롤
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage && !disabled) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageStyle = (message: ChatMessage) => {
    if (message.type === 'SYSTEM') {
      return "bg-gray-100 text-gray-600 text-center text-sm"
    }
    if (message.type === 'HINT') {
      return "bg-blue-50 border-l-4 border-blue-400 text-blue-800"
    }
    if (message.type === 'DEFENSE') {
      return "bg-orange-50 border-l-4 border-orange-400 text-orange-800"
    }
    if (message.isOwnMessage) {
      return "bg-blue-500 text-white ml-auto max-w-[80%]"
    }
    return "bg-white border max-w-[80%]"
  }

  const getPhaseStatus = () => {
    switch (gamePhase) {
      case 'DISCUSSING':
        return { text: "토론 시간", color: "game-primary" }
      case 'VOTING':
        return { text: "투표 시간", color: "game-danger" }
      case 'REVEALING':
        return { text: "결과 발표", color: "game-warning" }
      default:
        return { text: "대기 중", color: "default" }
    }
  }

  const phaseStatus = getPhaseStatus()
  const canSendMessage = gamePhase === 'DISCUSSING' && !disabled

  return (
    <Card className={cn("flex flex-col", maxHeight, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            게임 채팅
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={phaseStatus.color as any}>
              {phaseStatus.text}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn("p-3 rounded-lg", getMessageStyle(message))}
              >
                {message.type !== 'SYSTEM' && (
                  <div className="text-xs opacity-70 mb-1">
                    {message.player} · {message.timestamp}
                    {message.type === 'HINT' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        힌트
                      </Badge>
                    )}
                    {message.type === 'DEFENSE' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        방어
                      </Badge>
                    )}
                  </div>
                )}
                <div className="break-words">{message.message}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        <div className="space-y-2">
          {!canSendMessage && (
            <div className="text-center text-sm text-gray-500 py-2">
              {gamePhase === 'VOTING' ? "투표 시간에는 채팅할 수 없습니다" :
               gamePhase === 'REVEALING' ? "결과 발표 중입니다" :
               disabled ? "채팅이 비활성화되었습니다" : "대기 중입니다"}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder={canSendMessage ? "메시지를 입력하세요..." : "채팅 불가"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!canSendMessage}
              className="flex-1"
              maxLength={200}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !canSendMessage}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {newMessage.length > 150 && (
            <div className="text-xs text-orange-600 text-right">
              {newMessage.length}/200
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
