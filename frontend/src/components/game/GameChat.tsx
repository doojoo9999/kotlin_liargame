import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Flag, Loader2, MessageCircle, RefreshCw, Send, Users} from 'lucide-react'
import {toast} from 'sonner'
import type {ChatMessage, ChatMessageType} from '@/types/realtime'
import type {Player} from '@/stores'

interface GameChatProps {
  messages: ChatMessage[]
  players: Player[]
  currentPlayer: Player | null
  typingPlayers?: Iterable<string>
  gamePhase: string
  isLoading?: boolean
  error?: string | null
  onSendMessage: (message: string, type?: ChatMessageType) => Promise<void>
  onReportMessage?: (message: ChatMessage) => void
  onReloadHistory?: () => Promise<void>
  className?: string
}

const restrictedPhases = new Set<string>(['VOTING_FOR_LIAR', 'VOTING_FOR_SURVIVAL'])
const MAX_PINNED = 5

const typeLabelMap: Record<ChatMessageType, string> = {
  DISCUSSION: '일반',
  GENERAL: '일반',
  HINT: '힌트',
  DEFENSE: '변론',
  SYSTEM: '공지',
  POST_ROUND: '라운드 요약',
}

const formatTimestamp = (timestamp: number) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

export const GameChat: React.FC<GameChatProps> = ({
  messages,
  players,
  currentPlayer,
  typingPlayers,
  gamePhase,
  isLoading = false,
  error = null,
  onSendMessage,
  onReportMessage,
  onReloadHistory,
  className = '',
}) => {
  const [draft, setDraft] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  const playersByKey = useMemo(() => {
    const map = new Map<string, Player>()
    players.forEach((player) => {
      map.set(player.id, player)
      if (player.userId != null) {
        map.set(player.userId.toString(), player)
      }
      if (player.nickname) {
        map.set(player.nickname, player)
      }
    })
    return map
  }, [players])

  const resolvePlayer = useCallback(
    (message: ChatMessage): Player | undefined => {
      if (message.playerId && playersByKey.has(message.playerId)) {
        return playersByKey.get(message.playerId)
      }
      if (message.userId != null) {
        const key = message.userId.toString()
        if (playersByKey.has(key)) {
          return playersByKey.get(key)
        }
      }
      if (message.playerNickname && playersByKey.has(message.playerNickname)) {
        return playersByKey.get(message.playerNickname)
      }
      if (message.nickname && playersByKey.has(message.nickname)) {
        return playersByKey.get(message.nickname)
      }
      return undefined
    },
    [playersByKey],
  )

  const pinnedMessages = useMemo(() => {
    const pinned = messages
      .filter((message) => {
        if (message.type === 'SYSTEM') {
          return true
        }
        const player = resolvePlayer(message)
        return player?.isHost === true
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    if (pinned.length > MAX_PINNED) {
      return pinned.slice(-MAX_PINNED)
    }
    return pinned
  }, [messages, resolvePlayer])

  const pinnedIds = useMemo(() => new Set(pinnedMessages.map((message) => message.id)), [pinnedMessages])

  const regularMessages = useMemo(
    () => messages.filter((message) => !pinnedIds.has(message.id)),
    [messages, pinnedIds],
  )

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [regularMessages, pinnedMessages])

  const typingNames = useMemo(() => {
    if (!typingPlayers) {
      return [] as string[]
    }
    return Array.from(typingPlayers)
      .map((identifier) => {
        const player = playersByKey.get(identifier) || playersByKey.get(identifier.toString())
        return player?.nickname ?? identifier
      })
      .filter((name, index, self) => name && self.indexOf(name) === index)
  }, [typingPlayers, playersByKey])

  const canSendMessage = useMemo(() => !restrictedPhases.has(gamePhase), [gamePhase])

  const messageCount = messages.length
  const onlineCount = useMemo(
    () => players.filter((player) => (player.isOnline ?? player.isConnected)).length,
    [players],
  )

  const handleSendMessage = useCallback(async () => {
    const trimmed = draft.trim()
    if (!trimmed || isSending) {
      return
    }
    setIsSending(true)
    try {
      await onSendMessage(trimmed)
      setDraft('')
    } catch (err) {
      console.error('Failed to send chat message', err)
      toast.error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSending(false)
    }
  }, [draft, isSending, onSendMessage])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSendMessage().catch(() => {})
      }
    },
    [handleSendMessage],
  )

  const handleReport = useCallback(
    (message: ChatMessage) => {
      if (onReportMessage) {
        onReportMessage(message)
        return
      }
      toast.info('신고가 접수되었습니다.', {
        description: `${message.playerNickname ?? '알 수 없음'}: ${message.content}`,
      })
    },
    [onReportMessage],
  )

  const handleReloadHistory = useCallback(() => {
    if (!onReloadHistory) {
      return
    }
    onReloadHistory().catch((err) => {
      console.error('Failed to reload chat history', err)
      toast.error('채팅 기록을 다시 불러오지 못했습니다.')
    })
  }, [onReloadHistory])

  const containerClasses = `${className} ${isExpanded ? 'fixed inset-4 z-50' : 'h-96'} flex flex-col`

  const hasMessages = messageCount > 0
  const hasRegularMessages = regularMessages.length > 0

  return (
    <Card className={containerClasses}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-5 w-5" />
            <span>게임 채팅</span>
            {messageCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {messageCount}
              </Badge>
            )}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {onlineCount}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? '최소화' : '확대'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex h-full flex-col">
        {error && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="truncate">{error}</span>
            {onReloadHistory && (
              <Button variant="outline" size="xs" onClick={handleReloadHistory} className="h-7">
                <RefreshCw className="mr-1 h-3 w-3" /> 다시 시도
              </Button>
            )}
          </div>
        )}

        {pinnedMessages.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">공지</div>
            {pinnedMessages.map((message) => {
              const player = resolvePlayer(message)
              const isSystemMessage =
                message.type === 'SYSTEM' || message.playerNickname?.toUpperCase() === 'SYSTEM'
              const displayName = isSystemMessage ? '시스템' : player?.nickname ?? message.playerNickname ?? '플레이어'
              const accentLabel = isSystemMessage ? '시스템' : '방장'
              const accentVariant = isSystemMessage ? 'default' : 'secondary'
              const containerTone = isSystemMessage
                ? 'border border-primary/50 bg-primary/10 text-primary'
                : 'border border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100'
              const typeLabel = typeLabelMap[message.type]

              return (
                <div
                  key={message.id}
                  className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-xs ${containerTone}`}
                >
                  <div className="flex-1 whitespace-pre-wrap break-words text-left">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant={accentVariant} className="text-[11px] uppercase tracking-wide">
                        {accentLabel}
                      </Badge>
                      {typeLabel && (
                        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
                          {typeLabel}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold leading-none">{displayName}</span>
                    </div>
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[11px] opacity-80">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto rounded-md border border-border/60 bg-muted/40 px-3 py-3 ${isExpanded ? 'max-h-[calc(100vh-220px)]' : 'max-h-60'}`}>
          {!hasMessages ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              아직 메시지가 없습니다
            </div>
          ) : !hasRegularMessages ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              현재 고정된 공지를 제외한 메시지가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {regularMessages.map((message) => {
                const player = resolvePlayer(message)
                const isSelf =
                  !!currentPlayer &&
                  (message.playerId === currentPlayer.id ||
                    (message.userId != null && currentPlayer.userId === message.userId) ||
                    message.playerNickname === currentPlayer.nickname)
                const displayName = player?.nickname ?? message.playerNickname ?? '플레이어'
                const badgeConfigs: Array<{ label: string; variant: 'default' | 'secondary' | 'outline' }> = []
                if (player?.isHost) {
                  badgeConfigs.push({ label: '방장', variant: 'default' })
                }
                const isViewerSamePlayer = currentPlayer?.id === player?.id
                if (isViewerSamePlayer && player?.role === 'LIAR') {
                  badgeConfigs.push({ label: '라이어', variant: 'outline' })
                }
                if (isViewerSamePlayer && player?.role === 'CITIZEN') {
                  badgeConfigs.push({ label: '시민', variant: 'outline' })
                }
                if (isSelf) {
                  badgeConfigs.push({ label: '나', variant: 'secondary' })
                }
                const typeLabel =
                  message.type === 'DISCUSSION' || message.type === 'GENERAL'
                    ? null
                    : typeLabelMap[message.type]
                const showReport = !isSelf && message.type !== 'SYSTEM'
                const avatarInitial = displayName.charAt(0).toUpperCase()

                return (
                  <div key={message.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] ${isSelf ? 'items-end text-right' : 'items-start text-left'} flex flex-col gap-2`}>
                      <div className={`rounded-lg border px-3 py-2 ${isSelf ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background/80 text-foreground'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs uppercase">{avatarInitial}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold leading-none">{displayName}</span>
                                {badgeConfigs.map(({ label, variant }) => (
                                  <Badge key={label} variant={variant} className="text-[10px]">
                                    {label}
                                  </Badge>
                                ))}
                                {typeLabel && (
                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                    {typeLabel}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{formatTimestamp(message.timestamp)}</div>
                            </div>
                          </div>
                          {showReport && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleReport(message)}
                              aria-label="신고"
                              title="메시지 신고"
                            >
                              <Flag className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={listEndRef} />
            </div>
          )}
        </div>

        {typingNames.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {typingNames.join(', ')} 님이 입력 중...
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Input
            placeholder={
              canSendMessage ? '메시지를 입력하세요...' : '투표 중에는 채팅할 수 없습니다'
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canSendMessage || isSending}
            maxLength={240}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!canSendMessage || isSending || draft.trim().length === 0}
            size="sm"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {!canSendMessage && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            투표 단계에서는 채팅이 제한됩니다
          </div>
        )}
      </CardContent>
    </Card>
  )
}
