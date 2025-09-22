import {type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {ArrowLeft, Users} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {GamePhaseIndicator} from './GamePhaseIndicator'
import {ModeratorCommentary} from './ModeratorCommentary'
import {PlayerStatusPanel} from './PlayerStatusPanel'
import {GameActionInterface} from './GameActionInterface'
import {GameResults} from './GameResults'
import {ActivityFeed} from './ActivityFeed'
import {GameChat} from './GameChat'
import {RoundStageTimeline} from './RoundStageTimeline'
import {RoundSummaryPanel} from './RoundSummaryPanel'
import {ConnectionStatus} from './ConnectionStatus/ConnectionStatus'
import {GameHelpPanel} from './GameHelpPanel'
import {GameplayScoreboard} from '@/components/gameplay/GameplayScoreboard'
import type {GamePhase, ScoreboardEntry} from '@/types/backendTypes'
import {toast} from 'sonner'
import type {GameTimer, Player, RoundSummaryEntry, RoundUxStage, VotingState} from '@/stores/unifiedGameStore'
import type {ChatMessage, ChatMessageType} from '@/types/realtime'
import type {ActivityEvent} from '@/types/game'

export interface GameLayoutProps {
  gameNumber: number | null
  currentRound: number
  totalRounds: number
  currentTopic: string | null
  currentWord: string | null
  isLiar: boolean
  currentPhase: GamePhase
  timer: GameTimer
  players: Player[]
  currentPlayer: Player | null
  currentTurnPlayerId: string | null
  voting: VotingState
  suspectedPlayer: Player | null
  activities: ActivityEvent[]
  summary: {
    totalPlayers: number
    alivePlayers: number
    readyPlayers: number
  }
  isLoading: boolean
  error: string | null
  chatMessages: ChatMessage[]
  chatLoading: boolean
  chatError: string | null
  typingPlayers: Set<string>
  actionSlot?: ReactNode
  roundStage: RoundUxStage
  roundStageEnteredAt: number | null
  roundHasStarted: boolean
  roundSummaries: RoundSummaryEntry[]
  currentRoundSummary: RoundSummaryEntry | null
  scoreboardEntries: ScoreboardEntry[]
  onSendChatMessage: (message: string, type?: ChatMessageType) => Promise<void>
  onReportChatMessage?: (message: ChatMessage) => void
  onReloadChat?: () => Promise<void>
  onReturnToLobby?: () => void
  onNextRound?: () => void
  onSubmitHint: (hint: string) => Promise<void>
  onVotePlayer: (playerId: string) => Promise<void>
  onSubmitDefense: (defense: string) => Promise<void>
  onGuessWord: (guess: string) => Promise<void>
  onCastFinalVote: (execute: boolean) => Promise<void>
}

export function GameLayout({
  gameNumber,
  currentRound,
  totalRounds,
  currentTopic,
  currentWord,
  isLiar,
  currentPhase,
  timer,
  players,
  currentPlayer,
  currentTurnPlayerId,
  voting,
  suspectedPlayer,
  activities,
  summary,
  isLoading,
  error,
  chatMessages,
  chatLoading,
  chatError,
  typingPlayers,
  actionSlot,
  roundStage,
  roundStageEnteredAt,
  roundHasStarted,
  roundSummaries,
  currentRoundSummary,
  scoreboardEntries,
  onSendChatMessage,
  onReportChatMessage,
  onReloadChat,
  onReturnToLobby,
  onNextRound,
  onSubmitHint,
  onVotePlayer,
  onSubmitDefense,
  onGuessWord,
  onCastFinalVote,
}: GameLayoutProps) {
  const lastCriticalToast = useRef<number | null>(null)
  const [isChatFocused, setIsChatFocused] = useState(false)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  useEffect(() => {
    if (chatError) {
      toast.error(`채팅 오류: ${chatError}`)
    }
  }, [chatError])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateHeight = () => {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0)
    }

    updateHeight()

    const handleResize = () => updateHeight()
    window.addEventListener('resize', handleResize)

    let resizeObserver: ResizeObserver | null = null
    if (headerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateHeight())
      resizeObserver.observe(headerRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (timer.timeRemaining === 10 && lastCriticalToast.current !== 10) {
      toast.warning('라운드 종료까지 10초 남았어요!', {
        description: '마지막 발언을 서둘러 주세요.',
        duration: 3000,
      })
      lastCriticalToast.current = 10
      return
    }
    if (timer.timeRemaining > 10) {
      lastCriticalToast.current = null
    }
  }, [timer.timeRemaining])

  const layoutStyle = useMemo(() => {
    const headerValue = headerHeight > 0 ? `${Math.round(headerHeight)}px` : '112px'
    return {
      '--game-header-height': headerValue,
      '--game-body-height': 'calc(100vh - var(--game-header-height) - 3.5rem)',
      '--game-safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      paddingBottom: 'var(--game-safe-bottom)',
    } as CSSProperties
  }, [headerHeight])

  const gridContainerStyle = useMemo(() => {
    return {
      maxHeight: 'var(--game-body-height)',
    } as CSSProperties
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <div className="text-muted-foreground">게임 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    )
  }

  const topicLabel = currentTopic ? `주제: ${currentTopic}` : '주제가 아직 준비되지 않았습니다'
  const wordLabel = currentWord ? `제시어: ${currentWord}` : isLiar ? '라이어는 제시어를 확인할 수 없어요' : '제시어가 아직 공개되지 않았습니다'
  const roundLabel = `${currentRound || 0} / ${totalRounds || 0}`

  const showLeftRail = !isChatFocused
  const showRightRail = !isChatFocused && !isRightPanelCollapsed

  const gridTemplateClass = isChatFocused
    ? 'grid-cols-1'
    : isRightPanelCollapsed
      ? 'grid-cols-1 lg:grid-cols-[minmax(260px,300px),minmax(0,1fr)] xl:grid-cols-[minmax(280px,340px),minmax(0,1.75fr)]'
      : 'grid-cols-1 lg:grid-cols-[minmax(240px,280px),minmax(0,1fr)] xl:grid-cols-[minmax(260px,320px),minmax(0,2.1fr),minmax(240px,0.9fr)] 2xl:grid-cols-[minmax(280px,340px),minmax(0,2.25fr),minmax(260px,1fr)]'

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background" style={layoutStyle}>
      <div ref={headerRef} className="sticky top-0 z-20 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {onReturnToLobby && (
              <Button variant="ghost" size="sm" onClick={onReturnToLobby} className="h-8 px-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                로비로 돌아가기
              </Button>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>라이어 게임</span>
                <span className="hidden sm:inline" aria-hidden="true">|</span>
                <span>게임 #{gameNumber ?? '?'} </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                <span className="truncate">{topicLabel}</span>
                <span className="hidden sm:inline" aria-hidden="true">|</span>
                <span className="truncate">{wordLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm" aria-live="polite">
            <GamePhaseIndicator phase={currentPhase} timeRemaining={timer.timeRemaining} />
            <ConnectionStatus compact className="text-xs" />
            <div className="flex items-center gap-1">
              <span>라운드 {roundLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              <span>
                생존 {summary.alivePlayers}/{summary.totalPlayers}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span>준비 완료 {summary.readyPlayers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-col gap-6 px-4 py-6">
          <div className={`grid min-h-0 flex-1 gap-6 transition-[grid-template-columns] motion-safe:duration-200 ${gridTemplateClass}`} style={gridContainerStyle}>
            {showLeftRail && (
              <aside className="order-1 flex min-h-0 flex-col" aria-label="라운드 정보 패널">
                <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(var(--game-body-height)-1rem)] lg:overflow-y-auto lg:[scrollbar-gutter:stable_both-edges] lg:pr-3 lg:pb-6">
                  <RoundStageTimeline
                    round={currentRound}
                    totalRounds={totalRounds}
                    stage={roundStage}
                    hasRoundStarted={roundHasStarted}
                    currentPhase={currentPhase}
                    currentTopic={currentTopic}
                    timer={timer}
                    stageEnteredAt={roundStageEnteredAt}
                  />

                  <ModeratorCommentary
                    gamePhase={currentPhase}
                    currentTopic={currentTopic}
                    currentWord={currentWord}
                    timeRemaining={timer.timeRemaining}
                    isLiar={isLiar}
                    playerCount={summary.totalPlayers}
                    suspectedPlayer={suspectedPlayer?.nickname}
                  />

                  {actionSlot}

                  {currentPhase !== 'WAITING_FOR_PLAYERS' && (
                    <GameActionInterface
                      gamePhase={currentPhase}
                      currentPlayer={currentPlayer}
                      isMyTurn={currentTurnPlayerId === currentPlayer?.id}
                      isLiar={isLiar}
                      canVote={Boolean(currentPlayer && !voting.votes[currentPlayer.id])}
                      timeRemaining={timer.timeRemaining}
                      onSubmitHint={onSubmitHint}
                      onVotePlayer={onVotePlayer}
                      onSubmitDefense={onSubmitDefense}
                      onGuessWord={onGuessWord}
                      onCastFinalVote={onCastFinalVote}
                      players={players}
                      suspectedPlayer={suspectedPlayer ?? undefined}
                      currentTopic={currentTopic ?? undefined}
                      currentWord={currentWord ?? undefined}
                    />
                  )}

                  {currentPhase === 'GAME_OVER' && (
                    <GameResults
                      currentRound={currentRound}
                      totalRounds={totalRounds}
                      onNextRound={onNextRound}
                      onReturnToLobby={onReturnToLobby}
                    />
                  )}
                </div>
              </aside>
            )}

            <main className="order-2 flex min-h-0 flex-col overflow-hidden" aria-label="게임 채팅 영역">
              <div className="mb-3 flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsChatFocused((prev) => !prev)}
                  aria-pressed={isChatFocused}
                  className="h-7 px-3"
                >
                  {isChatFocused ? '레이아웃 복원' : '채팅만 보기'}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsRightPanelCollapsed((prev) => !prev)}
                  aria-pressed={!isRightPanelCollapsed}
                  className="h-7 px-3"
                >
                  {isRightPanelCollapsed ? '상세 패널 펼치기' : '상세 패널 접기'}
                </Button>
              </div>

              <GameChat
                messages={chatMessages}
                players={players}
                currentPlayer={currentPlayer}
                typingPlayers={typingPlayers}
                gamePhase={currentPhase}
                isLoading={chatLoading}
                error={chatError}
                onSendMessage={onSendChatMessage}
                onReportMessage={onReportChatMessage}
                onReloadHistory={onReloadChat}
                className={`flex h-full min-h-[28rem] flex-col ${isChatFocused ? 'rounded-3xl' : 'lg:rounded-3xl'}`}
              />
            </main>

            {showRightRail && (
              <aside className="order-3 flex min-h-0 flex-col gap-4 lg:col-span-2 lg:pl-2 xl:col-span-1" aria-label="플레이어 정보 패널">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>플레이어 & 로그</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsRightPanelCollapsed(true)}
                    className="h-7 px-2"
                  >
                    접기
                  </Button>
                </div>
                <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:max-h-[calc(var(--game-body-height)-1rem)] lg:[scrollbar-gutter:stable_both-edges] lg:pb-6">
                  <PlayerStatusPanel
                    players={players}
                    currentPhase={currentPhase}
                    currentPlayer={currentPlayer}
                    currentTurnPlayerId={currentTurnPlayerId}
                    votes={voting.votes}
                    isLiar={isLiar}
                    suspectedPlayer={suspectedPlayer?.id ?? undefined}
                  />

                  <GameplayScoreboard entries={scoreboardEntries} />

                  {currentRoundSummary && (
                    <RoundSummaryPanel
                      summary={currentRoundSummary}
                      history={roundSummaries.filter((entry) => entry.concludedAt !== currentRoundSummary.concludedAt)}
                      players={players}
                    />
                  )}

                  <GameHelpPanel />

                  <ActivityFeed
                    events={activities}
                    maxEvents={60}
                    className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
                  />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
