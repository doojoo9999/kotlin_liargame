import React, {memo, useEffect, useMemo, useRef} from 'react'
import {FixedSizeList as List} from 'react-window'
import {motion} from 'framer-motion'
import {cn} from "@/versions/main/lib/utils"
import {Badge} from "@/versions/main/components/ui/badge"
import type {ChatMessage} from '@/shared/types/api.types'

interface VirtualizedChatListProps {
  messages: ChatMessage[]
  currentPlayerNickname: string
  className?: string
}

interface ChatItemProps {
  index: number
  style: React.CSSProperties
  data: {
    messages: ChatMessage[]
    currentPlayerNickname: string
  }
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

const ChatItem = memo(({ index, style, data }: ChatItemProps) => {
  const { messages, currentPlayerNickname } = data
  const message = messages[index]

  const isOwnMessage = message.playerNickname === currentPlayerNickname
  const isSystem = message.type === 'SYSTEM'

  const memoizedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [message.timestamp])

  return (
    <div style={style}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-lg border mb-2 max-w-[85%]",
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
              {memoizedTime}
            </span>
          </div>
        )}

        <div className={cn(
          "text-sm leading-relaxed break-words",
          isSystem && "font-medium"
        )}>
          {message.content}
        </div>
      </motion.div>
    </div>
  )
})

ChatItem.displayName = 'ChatItem'

export const VirtualizedChatList = memo(({
  messages,
  currentPlayerNickname,
  className
}: VirtualizedChatListProps) => {
  const listRef = useRef<List>(null)

  const itemData = useMemo(() => ({
    messages,
    currentPlayerNickname
  }), [messages, currentPlayerNickname])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages.length])

  // For small message lists, render normally
  if (messages.length <= 20) {
    return (
      <div className={cn("space-y-2 px-2", className)}>
        {messages.map((message, index) => (
          <ChatItem
            key={`${message.id}-${index}`}
            index={index}
            style={{}}
            data={itemData}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("h-full", className)}>
      <List
        ref={listRef}
        height={400}
        itemCount={messages.length}
        itemSize={80} // Estimated height per message
        itemData={itemData}
        overscanCount={10}
      >
        {ChatItem}
      </List>
    </div>
  )
})

VirtualizedChatList.displayName = 'VirtualizedChatList'
