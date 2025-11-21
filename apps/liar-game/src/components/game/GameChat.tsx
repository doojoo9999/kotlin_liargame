import React, {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {ArrowDown, Check, Crown, Flag, Loader2, MessageCircle, RefreshCw, Send, Users} from 'lucide-react'
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
const MAX_MESSAGE_LENGTH = 240

const typeLabelMap: Record<ChatMessageType, string> = {
  DISCUSSION: '일반',
  GENERAL: '일반',
  HINT: '힌트',
  DEFENSE: '변론',
  SYSTEM: '공지',
  POST_ROUND: '라운드 요약',
  WAITING_ROOM: '대기실',
}

const formatTimestamp = (timestamp: number) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
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
  const inputRef = useRef<HTMLInputElement>(null)

  const [isInputFocused, setIsInputFocused] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [justSent, setJustSent] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [hasUnread, setHasUnread] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [selectedType, setSelectedType] = useState<ChatMessageType>('DISCUSSION')
  const prefersReducedMotion = usePrefersReducedMotion()
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const inputFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  useEffect(() => {
    if (!autoScroll) {
      return
    }
    const container = scrollContainerRef.current
    if (!container) {
      return
    }
    container.scrollTo({ top: container.scrollHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }, [autoScroll, messages, prefersReducedMotion])

  useEffect(() => {
    const latest = messages[messages.length - 1]
    if (!latest) {
      lastMessageIdRef.current = null
      setHighlightedMessageId(null)
      return
    }
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true
      lastMessageIdRef.current = latest.id
      return
    }
    if (latest.id === lastMessageIdRef.current) {
      return
    }
    lastMessageIdRef.current = latest.id
    setHighlightedMessageId(latest.id)
    if (!autoScroll) {
      setHasUnread(true)
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }
    highlightTimeoutRef.current = setTimeout(() => setHighlightedMessageId(null), 1800)
  }, [messages, autoScroll])

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
      setDraft('')
      inputRef.current?.focus({ preventScroll: true })

      try {
        await onSendMessage(trimmed, selectedType)
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
        inputRef.current?.focus({ preventScroll: true })
        throw err
      } finally {
        setIsSending(false)
        if (inputFocusTimeoutRef.current) {
          clearTimeout(inputFocusTimeoutRef.current)
        }
        inputFocusTimeoutRef.current = setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true })
          inputFocusTimeoutRef.current = null
        }, 0)
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
        const nativeEvent = event.nativeEvent as KeyboardEvent & { isComposing?: boolean }
        if (nativeEvent.isComposing) {
          return
        }
        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleComposerSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      handleSubmit()
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
    'flex w-full max-w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141421]/95 shadow-[0_22px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl motion-safe:transition-all motion-safe:duration-200',
    isExpanded
      ? 'fixed left-1/2 top-1/2 z-50 w-[min(1100px,95vw)] h-[78vh] -translate-x-1/2 -translate-y-1/2 bg-[#0f0f17]/98 p-5'
      : 'relative mx-auto w-full max-w-[1100px] h-[42vh] min-h-[16rem] sm:h-[48vh] sm:min-h-[19rem]',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const sendErrorId = sendError ? `${accessibilityId}-send-error` : undefined

  const unreadButtonClasses = [
    'absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/95 px-3 py-1 text-xs font-medium text-primary shadow-xl shadow-primary/10 backdrop-blur',
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
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      if (sendPulseTimeoutRef.current) {
        clearTimeout(sendPulseTimeoutRef.current)
      }
      if (inputFocusTimeoutRef.current) {
        clearTimeout(inputFocusTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card className={containerClasses}>
      <CardHeader className="space-y-0 border-b border-white/10 bg-transparent px-5 py-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold sm:text-lg">
          <div className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>게임 채팅</span>
            {messageCount > 0 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                {messageCount}
              </Badge>
            )}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {onlineCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="h-7 rounded-full px-2 text-xs"
              aria-pressed={isExpanded}
              aria-label="채팅창 크기 전환"
              title="채팅창 크기 전환"
            >
              {isExpanded ? '최소화' : '확대'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex h-full min-h-0 flex-1 flex-col gap-2.5 px-5 py-4">
        <div className="flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[13px] leading-tight text-destructive">
              <span className="truncate">{error}</span>
              {onReloadHistory && (
                <Button variant="outline" size="xs" onClick={handleReloadHistory} className="h-7 px-2 text-[12px]">
                  <RefreshCw className="mr-1 h-3 w-3" /> 다시 시도
                </Button>
              )}
            </div>
          )}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            role="region"
            aria-label="채팅 메시지 영역"
            tabIndex={0}
            className={`chat-scroll-area relative flex h-full flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1119]/70 px-3 py-3 shadow-inner transition-colors sm:px-4 sm:py-4 ${
              isExpanded ? 'max-h-[70vh]' : ''
            }`}
          >
            {!hasMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                아직 메시지가 없습니다
              </div>
            ) : (
              <div
                className="space-y-1.5 sm:space-y-2"
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
              >
                {messages.map((message) => {
                  const player = resolvePlayer(message)
                  const isSelf =
                    !!currentPlayer &&
                    (message.playerId === currentPlayer.id ||
                      (message.userId != null && currentPlayer.userId === message.userId) ||
                      message.playerNickname === currentPlayer.nickname)
                  const isSystemMessage =
                    message.type === 'SYSTEM' || message.playerNickname?.toUpperCase() === 'SYSTEM'
                  const isHostMessage = !isSystemMessage && player?.isHost === true
                  const displayName = isSystemMessage
                    ? '시스템'
                    : player?.nickname ?? message.playerNickname ?? '플레이어'
                  const messageBody = message.content ?? message.message ?? ''
                  const typeLabel =
                    message.type === 'DISCUSSION' || message.type === 'GENERAL' || message.type === 'WAITING_ROOM'
                      ? null
                      : typeLabelMap[message.type]
                  const showReport = !isSelf && message.type !== 'SYSTEM'
                  const avatarInitial = displayName.charAt(0).toUpperCase()
                  const justifyClass = isSelf ? 'justify-end' : 'justify-start'
                  const alignmentClasses = isSelf ? 'items-end text-right' : 'items-start text-left'
                  const isHighlighted = highlightedMessageId === message.id
                  const bubbleWidthClass = isSystemMessage
                    ? 'w-full'
                    : 'w-fit max-w-full sm:max-w-[82%] lg:max-w-[70%]'
                  const bubblePadding = isSystemMessage
                    ? 'px-4 py-2.5 sm:px-5 sm:py-3'
                    : 'px-4 py-3 sm:px-5 sm:py-3.5'
                  const bubbleTone = (() => {
                    if (isSystemMessage) {
                      return 'border border-amber-400/50 bg-[#2a1f1f] text-amber-50 shadow-[0_10px_30px_rgba(255,164,94,0.18)]'
                    }
                    if (isSelf) {
                      return 'border border-[#a78bfa]/70 bg-gradient-to-br from-[#7c3aed] via-[#6b4cff] to-[#4c1d95] text-white shadow-[0_18px_40px_rgba(124,58,237,0.32)]'
                    }
                    return 'border border-white/10 bg-[#1b1c24]/95 text-foreground shadow-[0_16px_38px_rgba(0,0,0,0.32)]'
                  })()
                  const contentTone = isSelf ? 'text-white' : 'text-foreground/90'
                  const typeBadgeTone = (() => {
                    switch (message.type) {
                      case 'HINT':
                        return 'border-sky-400/60 bg-sky-500/15 text-sky-100'
                      case 'DEFENSE':
                        return 'border-rose-400/60 bg-rose-500/15 text-rose-100'
                      case 'POST_ROUND':
                        return 'border-amber-400/60 bg-amber-500/15 text-amber-100'
                      default:
                        return 'border-white/15 bg-white/5 text-muted-foreground'
                    }
                  })()
                  const highlightClasses = isHighlighted ? 'ring-2 ring-primary/50 shadow-[0_0_0_4px_rgba(124,77,255,0.25)]' : ''

                  if (isSystemMessage) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div
                          className={`w-full max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm font-medium text-amber-50 shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${highlightClasses}`}
                        >
                          {messageBody}
                          <div className="mt-1 text-[11px] font-normal text-amber-100/80">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={message.id} className={`flex ${justifyClass}`}>
                      <div className={`flex w-full flex-col gap-1.5 ${alignmentClasses}`}>
                        <div
                          className={`flex items-center gap-2 px-1 text-[12px] text-muted-foreground/80 ${
                            isSelf ? 'justify-end' : ''
                          }`}
                        >
                          {!isSelf && (
                            <Avatar className="h-7 w-7 shrink-0 border border-white/10 bg-[#1f1f2b] text-foreground/80 shadow-sm">
                              <AvatarFallback className="text-xs uppercase">{avatarInitial}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex items-center gap-1 text-[13px] font-semibold tracking-wide text-foreground">
                            <span>{displayName}</span>
                            {isHostMessage && <Crown className="h-3.5 w-3.5 text-amber-400" aria-label="방장" />}
                            {typeLabel && (
                              <span
                                className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-semibold uppercase leading-none ${typeBadgeTone}`}
                              >
                                {typeLabel}
                              </span>
                            )}
                          </div>
                          {showReport && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="ml-1 h-6 w-6 text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() => handleReport(message)}
                              aria-label="신고"
                              title="메시지 신고"
                            >
                              <Flag className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className={`relative ${bubbleWidthClass}`}>
                          <div
                            className={`rounded-2xl text-sm leading-relaxed transition-all duration-150 ${bubbleTone} ${bubblePadding} ${highlightClasses}`}
                            data-message-type={message.type}
                            data-highlighted={isHighlighted}
                          >
                            <p className={`min-w-0 whitespace-pre-wrap break-words text-[13px] leading-snug ${contentTone}`}>
                              {messageBody}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`px-1 text-[11px] text-muted-foreground/70 ${
                            isSelf ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatTimestamp(message.timestamp)}
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
        </div>

        {typingNames.length > 0 && (
          <div className="text-[12px] italic text-muted-foreground/90">
            {typingNames.join(', ')} 님이 입력 중...
          </div>
        )}

        <form className="flex flex-col gap-1.5" onSubmit={handleComposerSubmit} noValidate>
          <div
            className={`group flex items-center gap-2 rounded-2xl border border-border/50 bg-background/95 px-3 py-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all ${
              isInputFocused ? 'border-primary/60 ring-1 ring-primary/20' : ''
            } ${justSent ? 'border-emerald-500/60 ring-emerald-400/30' : ''}`}
          >
            <Input
              ref={inputRef}
              className="h-10 flex-1 border-none bg-transparent text-[14px] leading-tight shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
              disabled={!canSendMessage}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-invalid={sendError ? true : undefined}
              aria-describedby={sendErrorId}
            />
            <Button
              type="submit"
              disabled={!canSendMessage || isSending || draft.trim().length === 0}
              size="sm"
              className={`relative h-10 rounded-xl px-4 text-sm transition-colors ${
                justSent ? 'bg-emerald-500 text-emerald-50 hover:bg-emerald-500' : ''
              }`}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : justSent ? (
                <Check className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
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
                    className={`h-7 rounded-full px-3 text-[12px] ${
                      isSelected ? 'bg-primary/15 text-primary shadow-inner' : 'text-muted-foreground'
                    }`}
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
          <div className="min-h-[1.25rem]" aria-live="assertive">
            {sendError && (
              <div id={sendErrorId} role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[12px] text-destructive">
                <span className="truncate">{sendError}</span>
                <Button variant="outline" size="xs" onClick={handleRetry} disabled={isSending}>
                  다시 보내기
                </Button>
              </div>
            )}
          </div>
        </form>
        <span className="sr-only" role="status" aria-live="polite">
          {justSent ? '메시지가 전송되었습니다.' : ''}
        </span>

        {!canSendMessage && (
          <div className="text-center text-[12px] text-muted-foreground">
            투표 단계에서는 채팅을 보낼 수 없어요
          </div>
        )}
      </CardContent>
    </Card>
  )
}
