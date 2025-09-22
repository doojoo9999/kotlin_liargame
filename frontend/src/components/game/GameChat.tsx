import React, {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {ArrowDown, Check, Flag, Loader2, MessageCircle, RefreshCw, Send, Users} from 'lucide-react'
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
const MAX_MESSAGE_LENGTH = 240

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

const messageToneMap: Record<ChatMessageType | 'DEFAULT', string> = {
  DISCUSSION: 'border-border/70 bg-background/95 text-foreground',
  GENERAL: 'border-border/70 bg-background/95 text-foreground',
  HINT: 'border-sky-500/50 bg-sky-50 text-sky-900 shadow-sm dark:bg-sky-500/15 dark:text-sky-100',
  DEFENSE: 'border-rose-500/60 bg-rose-50 text-rose-900 shadow-sm dark:bg-rose-500/15 dark:text-rose-100',
  SYSTEM: 'border-primary/60 bg-primary/10 text-primary-900 shadow-sm dark:bg-primary/25 dark:text-primary-50',
  POST_ROUND: 'border-amber-500/60 bg-amber-50 text-amber-900 shadow-sm dark:bg-amber-500/15 dark:text-amber-100',
  DEFAULT: 'border-border/70 bg-background/95 text-foreground',
}

const SENDABLE_MESSAGE_TYPES: ChatMessageType[] = ['DISCUSSION', 'HINT', 'DEFENSE']

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }
    updatePreference()
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
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

  const [isInputFocused, setIsInputFocused] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [justSent, setJustSent] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [hasUnread, setHasUnread] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const [composerHeight, setComposerHeight] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<ChatMessageType>('DISCUSSION')
  const prefersReducedMotion = usePrefersReducedMotion()
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRegularMessageIdRef = useRef<string | null>(null)
  const hasHydratedRef = useRef(false)

  const accessibilityId = useId()

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
    if (!autoScroll) {
      return
    }
    const container = scrollContainerRef.current
    if (!container) {
      return
    }
    container.scrollTo({ top: container.scrollHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }, [autoScroll, regularMessages, pinnedMessages, prefersReducedMotion])

  useEffect(() => {
    const latest = regularMessages[regularMessages.length - 1]
    if (!latest) {
      lastRegularMessageIdRef.current = null
      setHighlightedMessageId(null)
      return
    }
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true
      lastRegularMessageIdRef.current = latest.id
      return
    }
    if (latest.id === lastRegularMessageIdRef.current) {
      return
    }
    lastRegularMessageIdRef.current = latest.id
    setHighlightedMessageId(latest.id)
    if (!autoScroll) {
      setHasUnread(true)
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }
    highlightTimeoutRef.current = setTimeout(() => setHighlightedMessageId(null), 1800)
  }, [regularMessages, autoScroll])

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

  const messageTypeOptions = useMemo(() =>
    SENDABLE_MESSAGE_TYPES.map((type) => ({ value: type, label: typeLabelMap[type] ?? type })),
    [],
  )

  const composerStyle = useMemo(
    () => ({ '--composer-height': composerHeight != null ? `${composerHeight}px` : '6.5rem' }) as React.CSSProperties,
    [composerHeight],
  )

  const messageCount = messages.length
  const remainingCharacters = MAX_MESSAGE_LENGTH - draft.length
  const characterWarningThreshold = Math.round(MAX_MESSAGE_LENGTH * 0.4)
  const characterCriticalThreshold = Math.round(MAX_MESSAGE_LENGTH * 0.2)
  const characterCountTone =
    remainingCharacters <= characterCriticalThreshold
      ? 'text-destructive font-semibold'
      : remainingCharacters <= characterWarningThreshold
        ? 'text-amber-600 dark:text-amber-400 font-medium'
        : 'text-muted-foreground'
  const onlineCount = useMemo(
    () => players.filter((player) => (player.isOnline ?? player.isConnected)).length,
    [players],
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) {
      return
    }
    const node = composerRef.current
    if (!node) {
      return
    }
    const updateHeight = () => {
      setComposerHeight(node.offsetHeight)
    }
    updateHeight()
    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(node)
    return () => observer.disconnect()
  }, [isExpanded])

  const sendMessage = useCallback(
    async (override?: string) => {
      const source = override ?? draft
      const trimmed = source.trim()
      if (!trimmed || isSending) {
        return
      }
      setIsSending(true)
      setAutoScroll(true)
      setHasUnread(false)
      try {
        await onSendMessage(trimmed, selectedType)
        setDraft('')
        setSendError(null)
        const pulseDuration = prefersReducedMotion ? 200 : 700
        setJustSent(true)
        if (sendPulseTimeoutRef.current) {
          clearTimeout(sendPulseTimeoutRef.current)
        }
        sendPulseTimeoutRef.current = setTimeout(() => setJustSent(false), pulseDuration)
      } catch (err) {
        console.error('Failed to send chat message', err)
        setSendError('메시지 전송에 실패했습니다. 다시 시도해 주세요.')
        toast.error('메시지 전송에 실패했습니다. 다시 시도해 주세요.')
        setDraft(trimmed)
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [draft, isSending, onSendMessage, prefersReducedMotion, selectedType],
  )

  const handleSubmit = useCallback(() => {
    sendMessage().catch(() => {})
  }, [sendMessage])

  const handleRetry = useCallback(() => {
    if (!draft.trim()) {
      return
    }
    sendMessage(draft).catch(() => {})
  }, [draft, sendMessage])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
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

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const atBottom = distanceFromBottom <= 48
    setAutoScroll((prev) => (prev === atBottom ? prev : atBottom))
    if (atBottom) {
      setHasUnread(false)
    }
  }, [])

  const handleScrollToLatest = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    setAutoScroll(true)
    setHasUnread(false)
  }, [])

  const containerClasses = [
    'flex flex-1 flex-col overflow-hidden rounded-xl border border-border/70 shadow-lg motion-safe:transition-all motion-safe:duration-200',
    isExpanded
      ? 'fixed inset-4 z-50 bg-background/95 backdrop-blur-md'
      : 'relative h-full min-h-[26rem] sm:min-h-[28rem] xl:min-h-[32rem] 2xl:min-h-[36rem]',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const sendErrorId = sendError ? `${accessibilityId}-send-error` : undefined

  const unreadButtonClasses = [
    'absolute bottom-3 right-4 flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg',
    prefersReducedMotion
      ? hasUnread
        ? 'pointer-events-auto opacity-100'
        : 'pointer-events-none opacity-0'
      : hasUnread
        ? 'pointer-events-auto translate-y-0 opacity-100 motion-safe:transition-all motion-safe:duration-200'
        : 'pointer-events-none translate-y-2 opacity-0 motion-safe:transition-all motion-safe:duration-200',
  ]
    .filter(Boolean)
    .join(' ')

  const hasMessages = messageCount > 0
  const hasRegularMessages = regularMessages.length > 0

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      if (sendPulseTimeoutRef.current) {
        clearTimeout(sendPulseTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card className={containerClasses}>
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-3 pt-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold sm:text-lg">
          <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>게임 채팅</span>
            {messageCount > 0 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="h-7 px-2 text-xs"
              aria-pressed={isExpanded}
              aria-label="채팅창 크기 전환"
              title="채팅창 크기 전환"
            >
              {isExpanded ? '최소화' : '확대'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4" style={composerStyle}>
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="truncate">{error}</span>
            {onReloadHistory && (
              <Button variant="outline" size="xs" onClick={handleReloadHistory} className="h-7">
                <RefreshCw className="mr-1 h-3 w-3" /> 다시 시도
              </Button>
            )}
          </div>
        )}

        {pinnedMessages.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">공지</div>
            {pinnedMessages.map((message) => {
              const player = resolvePlayer(message)
              const isSystemMessage =
                message.type === 'SYSTEM' || message.playerNickname?.toUpperCase() === 'SYSTEM'
              const displayName = isSystemMessage ? '시스템' : player?.nickname ?? message.playerNickname ?? '플레이어'
              const accentLabel = isSystemMessage ? '시스템' : '방장'
              const accentVariant = isSystemMessage ? 'default' : 'secondary'
              const containerTone = isSystemMessage
                ? 'border border-primary/40 border-l-4 bg-primary/10 text-primary-900 shadow-sm dark:bg-primary/20 dark:text-primary-50'
                : 'border border-amber-400/50 border-l-4 bg-amber-50 text-amber-900 shadow-sm dark:bg-amber-500/15 dark:text-amber-100'
              const typeLabel = typeLabelMap[message.type]

              return (
                <div
                  key={message.id}
                  className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-xs ${containerTone}`}
                >
                  <div className="flex-1 whitespace-pre-wrap break-words text-left">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant={accentVariant} className="rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide">
                        {accentLabel}
                      </Badge>
                      {typeLabel && (
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide">
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

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          role="region"
          aria-label="채팅 메시지 영역"
          tabIndex={0}
          className={`relative flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-muted/40 px-4 py-4 shadow-inner transition-colors scroll-smooth chat-scroll-area ${isExpanded ? 'max-h-[calc(100vh-8rem)]' : 'max-h-[calc(100%-var(--composer-height,6.5rem))] min-h-[18rem]'}`}
        >
          {!hasMessages ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              아직 메시지가 없습니다
            </div>
          ) : !hasRegularMessages ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              현재 고정된 공지를 제외한 메시지가 없습니다
            </div>
          ) : (
            <div
              className="space-y-3 sm:space-y-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
            >
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
                const bubbleTone = isSelf
                  ? 'border-primary/70 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : messageToneMap[message.type] ?? messageToneMap.DEFAULT
                const justifyClass = isSelf ? 'justify-end' : 'justify-start'
                const alignmentClasses = isSelf ? 'items-end text-right' : 'items-start text-left'
                const contentTone = isSelf ? 'text-primary-foreground/95' : 'text-foreground/90'
                const typeBadgeTone = (() => {
                  switch (message.type) {
                    case 'HINT':
                      return 'border-sky-500 text-sky-700 dark:border-sky-400 dark:text-sky-200'
                    case 'DEFENSE':
                      return 'border-rose-500 text-rose-600 dark:border-rose-400 dark:text-rose-200'
                    case 'SYSTEM':
                      return 'border-primary text-primary-700 dark:border-primary/80 dark:text-primary-200'
                    case 'POST_ROUND':
                      return 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-200'
                    default:
                      return 'border-muted-foreground/40 text-muted-foreground'
                  }
                })()
                const isHighlighted = highlightedMessageId === message.id
                const highlightClasses = isHighlighted ? 'ring-2 ring-primary/50 shadow-[0_0_0_4px_rgba(59,130,246,0.18)]' : ''

                return (
                  <div key={message.id} className={`flex ${justifyClass}`}>
                    <div className={`flex max-w-[88%] flex-col gap-1.5 ${alignmentClasses} 2xl:max-w-[75%]`}>
                      <div
                        className={`rounded-2xl border px-4 py-3 transition-all duration-150 ${bubbleTone} ${highlightClasses}`}
                        data-message-type={message.type}
                        data-highlighted={isHighlighted}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shadow-sm ring-1 ring-border/40">
                              <AvatarFallback className="text-xs uppercase">{avatarInitial}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold leading-none tracking-tight">{displayName}</span>
                                {badgeConfigs.map(({ label, variant }) => (
                                  <Badge key={label} variant={variant} className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide">
                                    {label}
                                  </Badge>
                                ))}
                                {typeLabel && (
                                  <Badge
                                    variant="outline"
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${typeBadgeTone}`}
                                  >
                                    {typeLabel}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 text-[11px] text-muted-foreground">
                                {formatTimestamp(message.timestamp)}
                              </div>
                            </div>
                          </div>
                          {showReport && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() => handleReport(message)}
                              aria-label="신고"
                              title="메시지 신고"
                            >
                              <Flag className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className={`mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed ${contentTone}`}>
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

          <button
            type="button"
            className={unreadButtonClasses}
            onClick={handleScrollToLatest}
            aria-live="polite"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            새 메시지
          </button>
        </div>

        {typingNames.length > 0 && (
          <div className="mt-2 text-xs italic text-muted-foreground">
            {typingNames.join(', ')} 님이 입력 중...
          </div>
        )}

        <div className="mt-3" ref={composerRef}>
          <div
            className={`group flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-2 motion-safe:transition-all motion-safe:duration-200 ${isInputFocused ? 'border-primary/70 shadow-[0_0_0_3px_rgba(59,130,246,0.18)]' : ''} ${justSent ? 'border-emerald-500/60 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]' : ''}`}
          >
            <Input
              className="h-11 flex-1 border-none bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={
                canSendMessage ? '메시지를 입력해 주세요...' : '투표 중에는 채팅을 보낼 수 없어요'
              }
              value={draft}
              onChange={(event) => {
                const value = event.target.value
                setDraft(value)
                if (sendError) {
                  setSendError(null)
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              disabled={!canSendMessage || isSending}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-invalid={sendError ? true : undefined}
              aria-describedby={sendErrorId}
            />
            <Button
              onClick={handleSubmit}
              disabled={!canSendMessage || isSending || draft.trim().length === 0}
              size="sm"
              className={`relative h-11 px-4 motion-safe:transition-all motion-safe:duration-200 ${justSent ? 'bg-emerald-500 text-emerald-50 hover:bg-emerald-500' : ''}`}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : justSent ? (
                <Check className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">Shift+Enter로 줄바꿈</span>
              <span className={`whitespace-nowrap transition-colors ${characterCountTone}`} aria-live="polite">
                남은 글자 {Math.max(remainingCharacters, 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {messageTypeOptions.map(({ value, label }) => {
                const isSelected = selectedType === value
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isSelected ? 'secondary' : 'ghost'}
                    size="xs"
                    className="h-7 px-3"
                    onClick={() => setSelectedType(value)}
                    aria-pressed={isSelected}
                    disabled={isSending}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="mt-2 min-h-[1.5rem]" aria-live="assertive">
            {sendError && (
              <div id={sendErrorId} role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                <span className="truncate">{sendError}</span>
                <Button variant="outline" size="xs" onClick={handleRetry} disabled={isSending}>
                  다시 보내기
                </Button>
              </div>
            )}
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {justSent ? '메시지가 전송되었습니다.' : ''}
          </span>
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
