import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {Clock, MessageSquare, User} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {ScrollArea} from "@/versions/main/components/ui/scroll-area"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {chatMessageSlide, staggerContainer} from "@/versions/main/animations"

interface Hint {
  id: string
  playerId: number
  playerNickname: string
  content: string
  timestamp: string
  turnIndex: number
}

interface HintDisplayProps {
  hints: Hint[]
  currentPlayer?: string
  showTimestamp?: boolean
  compact?: boolean
  maxHeight?: string
  className?: string
}

export function HintDisplay({
  hints,
  currentPlayer,
  showTimestamp = true,
  compact = false,
  maxHeight = "h-96",
  className
}: HintDisplayProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [hints])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="w-4 h-4" />
          힌트 ({hints.length})
        </div>

        <ScrollArea className={maxHeight} ref={scrollAreaRef}>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2 pr-2"
          >
            <AnimatePresence>
              {hints.map((hint) => (
                <motion.div
                  key={hint.id}
                  variants={chatMessageSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={cn(
                    "p-2 rounded border text-sm",
                    hint.playerNickname === currentPlayer
                      ? "bg-blue-50 border-blue-200"
                      : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">
                      {hint.playerNickname}
                    </span>
                    {showTimestamp && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(hint.timestamp)}
                      </span>
                    )}
                  </div>
                  <div>{hint.content}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <Card className={cn("flex flex-col", maxHeight, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            힌트 히스토리
          </div>
          <Badge variant="secondary">{hints.length}개</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4" ref={scrollAreaRef}>
          {hints.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p>아직 제공된 힌트가 없습니다</p>
              <p className="text-sm">첫 번째 힌트를 기다리고 있어요!</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <AnimatePresence>
                {hints.map((hint, index) => (
                  <motion.div
                    key={hint.id}
                    variants={chatMessageSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      "relative p-4 rounded-lg border transition-all",
                      hint.playerNickname === currentPlayer
                        ? "bg-blue-50 border-blue-200 ml-4"
                        : "bg-card mr-4"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {hint.playerNickname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {hint.turnIndex + 1}
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {hint.playerNickname}
                          </span>
                          {showTimestamp && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTime(hint.timestamp)}
                            </div>
                          )}
                        </div>

                        <div className="text-sm leading-relaxed">
                          {hint.content}
                        </div>

                        {hint.playerNickname === currentPlayer && (
                          <Badge variant="outline" className="text-xs">
                            내 힌트
                          </Badge>
                        )}
                      </div>
                    </div>

                    {index < hints.length - 1 && (
                      <div className="absolute left-6 top-full w-px h-3 bg-border" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface HintInputProps {
  onSubmit: (hint: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
}

export function HintInput({
  onSubmit,
  disabled = false,
  placeholder = "힌트를 입력하세요...",
  maxLength = 100,
  className
}: HintInputProps) {
  const [hint, setHint] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hint.trim() && !disabled) {
      onSubmit(hint.trim())
      setHint("")
    }
  }

  return (
    <Card className={cn("p-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <User className="w-4 h-4" />
          힌트 제공
        </div>

        <div className="space-y-2">
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            rows={2}
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {hint.length}/{maxLength}
            </span>

            <button
              type="submit"
              disabled={!hint.trim() || disabled}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              힌트 제공
            </button>
          </div>
        </div>
      </form>
    </Card>
  )
}
