import {type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {ArrowLeft, LifeBuoy, ListTree, UserCheck, Users} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {GamePhaseIndicator} from './GamePhaseIndicator'
import {GameActionInterface} from './GameActionInterface'
import {GameResults} from './GameResults'
import {ActivityFeed} from './ActivityFeed'
import {GameChat} from './GameChat'
import {RoundSummaryPanel} from './RoundSummaryPanel'
import {ConnectionStatus} from './ConnectionStatus/ConnectionStatus'
import {GameHelpPanel} from './GameHelpPanel'
import {GameplayScoreboard} from '@/components/gameplay/GameplayScoreboard'
import {PlayerStatusPanel} from './PlayerStatusPanel'
import type {GamePhase, ScoreboardEntry} from '@/types/backendTypes'
import {toast} from 'sonner'
import type {GameTimer, Player, RoundSummaryEntry, RoundUxStage, VotingState} from '@/stores/unified/types'
import type {ChatMessage, ChatMessageType} from '@/types/realtime'
import type {ActivityEvent} from '@/types/game'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {ScrollArea} from '@/components/ui/scroll-area'

const stageOrder: RoundUxStage[] = ['waiting', 'speech', 'debate', 'vote', 'results']

const stageLabels: Record<RoundUxStage, string> = {
  waiting: '라운드 준비',
  speech: '힌트 제출',
  debate: '토론',
  vote: '투표',
  results: '결과 정리',
}

const stageDescriptions: Record<RoundUxStage, string> = {
  waiting: '플레이어들이 역할을 확인하고 준비 중입니다.',
  speech: '주제에 맞춰 짧고 명확한 힌트를 공유해 주세요.',
  debate: '의심되는 플레이어가 있다면 근거 있게 이야기해 보세요.',
  vote: '라이어 혹은 생존 여부를 신중하게 선택하세요.',
  results: '라운드 결과를 확인하고 다음 단계를 준비하세요.',
}

const nextStageHints: Record<RoundUxStage, string> = {
  waiting: '힌트를 제출하면 라운드가 본격적으로 시작돼요.',
  speech: '토론 단계로 넘어가며 서로의 힌트를 비교합니다.',
  debate: '이제 한 명을 지목해 투표할 차례예요.',
  vote: '라이어 색출 후 결과가 정리됩니다.',
  results: '다음 라운드가 곧 시작됩니다.',
}

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
  onReturnToLobby?: (options?: { skipServer?: boolean }) => void
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
  roundHasStarted: _roundHasStarted,
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
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(false)
  const [isPlayersDialogOpen, setIsPlayersDialogOpen] = useState(false)
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  const [isContextOverlayOpen, setIsContextOverlayOpen] = useState(false)
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
      toast.warning('남은 시간이 10초밖에 없어요!', {
        description: '필요한 액션을 빠르게 마무리해 주세요.',
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
      height: 'var(--game-body-height)',
      maxHeight: 'var(--game-body-height)',
    } as CSSProperties
  }, [])

  const summaryForPanel = useMemo(() => {
    if (currentRoundSummary) {
      return currentRoundSummary
    }
    return roundSummaries.length > 0 ? roundSummaries[0] : null
  }, [currentRoundSummary, roundSummaries])

  const roundSummaryHistory = useMemo(() => {
    if (!summaryForPanel) {
      return roundSummaries
    }
    return roundSummaries.filter((entry) => entry.concludedAt !== summaryForPanel.concludedAt)
  }, [roundSummaries, summaryForPanel])

  if (isLoading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <div className="text-muted-foreground">게임 상태를 불러오고 있어요...</div>
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

  const normalizedStage = stageOrder.includes(roundStage) ? roundStage : 'waiting'
  const stageIndex = stageOrder.indexOf(normalizedStage)
  const stageProgress = stageIndex <= 0 ? 0 : Math.round((stageIndex / (stageOrder.length - 1)) * 100)
  const stageLabel = stageLabels[normalizedStage]
  const stageDescription = stageDescriptions[normalizedStage]
  const nextStageHint = normalizedStage === 'results' ? '라운드가 곧 마무리됩니다.' : nextStageHints[normalizedStage]
  const roundLabel = `${currentRound || 0} / ${totalRounds || 0}`
  const preRoundNotice = normalizedStage === 'waiting' && !_roundHasStarted

  const topicSummary = currentTopic ?? '주제가 아직 공개되지 않았어요.'
  const wordSummary = currentWord
    ? `제시어: "${currentWord}"`
    : isLiar
      ? '라이어는 제시어를 볼 수 없습니다.'
      : '제시어가 곧 공개됩니다.'
  const showContextColumn = !isChatFocused && !isContextPanelCollapsed

  const gridTemplateClass = isChatFocused
    ? 'grid-cols-1'
    : 'grid-cols-1 lg:grid-cols-[minmax(0,1.8fr),minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr),minmax(0,1fr)]'

  const contextCards = (
    <div className="flex min-h-0 flex-col gap-4">
      <Card className="border-white/10 bg-[#181823]/90 shadow-[0_16px_36px_rgba(0,0,0,0.38)]">
        <CardContent className="space-y-4 px-5 py-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {stageLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">라운드 {roundLabel}</span>
            </div>
            <div className="text-sm font-medium text-foreground">{stageDescription}</div>
            {preRoundNotice && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">모든 플레이어가 준비를 누르면 게임이 바로 시작돼요.</p>
            )}
          </div>
          <div>
            <Progress value={stageProgress} className="h-2" aria-label="라운드 진행률" />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>다음 단계: {nextStageHint}</span>
              <span aria-hidden="true" className="hidden md:inline">•</span>
              <span>생존 {summary.alivePlayers}/{summary.totalPlayers}</span>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
            <div className="font-semibold text-foreground">주제</div>
            <div>{topicSummary}</div>
            <div className="mt-2 border-t border-border/40 pt-2 text-muted-foreground/80">{wordSummary}</div>
          </div>
        </CardContent>
      </Card>

      {actionSlot && (
        <Card className="border-white/10 bg-[#181823]/90 shadow-[0_12px_28px_rgba(0,0,0,0.32)]">
          <CardContent className="px-5 pb-5 pt-4">
            {actionSlot}
          </CardContent>
        </Card>
      )}

      {currentPhase !== 'WAITING_FOR_PLAYERS' && (
        <Card className="border-white/10 bg-[#181823]/90 shadow-[0_12px_28px_rgba(0,0,0,0.32)]">
          <CardContent className="space-y-4 px-5 pb-5 pt-4">
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
          </CardContent>
        </Card>
      )}

      {currentPhase === 'GAME_OVER' && (
        <Card className="border-white/10 bg-[#181823]/90 shadow-[0_12px_28px_rgba(0,0,0,0.32)]">
          <CardContent className="px-5 pb-5 pt-4">
            <GameResults
              currentRound={currentRound}
              totalRounds={totalRounds}
              onNextRound={onNextRound}
              onReturnToLobby={onReturnToLobby}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-x-hidden bg-background" style={layoutStyle}>
      <div ref={headerRef} className="sticky top-0 z-20 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {onReturnToLobby && (
              <Button variant="ghost" size="sm" onClick={() => onReturnToLobby?.()} className="h-8 px-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                로비로 돌아가기
              </Button>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="font-medium">게임 #{gameNumber ?? '?'}</span>
                <span aria-hidden="true" className="hidden sm:inline">•</span>
                <span className="text-muted-foreground/80">라운드 {roundLabel}</span>
              </div>
              <GamePhaseIndicator phase={currentPhase} timeRemaining={timer.timeRemaining} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground sm:text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">{summary.alivePlayers}/{summary.totalPlayers}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                <span>{summary.readyPlayers}</span>
              </div>
              <ConnectionStatus compact className="text-xs" />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#1b1b24]/85 px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between shadow-[0_18px_42px_rgba(0,0,0,0.38)]">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Badge variant="outline" className="rounded-full px-2 py-1 text-[11px] tracking-wide">
                {stageLabel}
              </Badge>
              <span>{stageDescription}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span>다음 단계: {nextStageHint}</span>
              {roundStageEnteredAt && (
                <span aria-hidden="true" className="hidden sm:inline">•</span>
              )}
              {roundStageEnteredAt && (
                <span>진입 시간 {new Date(roundStageEnteredAt).toLocaleTimeString()}</span>
              )}
            </div>
            <Progress value={stageProgress} className="h-1.5 sm:w-48" aria-label="라운드 진행률" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-col gap-6 px-4 py-6">
          <div className={`grid min-h-0 flex-1 overflow-hidden gap-6 transition-[grid-template-columns] motion-safe:duration-200 ${gridTemplateClass}`} style={gridContainerStyle}>
            <main className="order-1 flex min-h-0 h-full flex-col overflow-hidden" aria-label="게임 채팅 영역">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() => setIsContextPanelCollapsed((prev) => !prev)}
                    aria-pressed={!isContextPanelCollapsed}
                    className="hidden h-7 px-3 lg:inline-flex"
                  >
                    {isContextPanelCollapsed ? '컨텍스트 펼치기' : '컨텍스트 접기'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="xs"
                    className="h-7 px-3 lg:hidden"
                    onClick={() => setIsContextOverlayOpen(true)}
                  >
                    액션 보기
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="xs" className="h-7 px-3" onClick={() => setIsPlayersDialogOpen(true)}>
                    <Users className="mr-1 h-3.5 w-3.5" />
                    플레이어
                  </Button>
                  <Button variant="ghost" size="xs" className="h-7 px-3" onClick={() => setIsLogDialogOpen(true)}>
                    <ListTree className="mr-1 h-3.5 w-3.5" />
                    로그
                  </Button>
                  <Button variant="ghost" size="xs" className="h-7 px-3" onClick={() => setIsHelpDialogOpen(true)}>
                    <LifeBuoy className="mr-1 h-3.5 w-3.5" />
                    도움말
                  </Button>
                </div>
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
                className={`rounded-3xl border border-border/60 bg-card/70 shadow-sm ${isChatFocused ? 'lg:rounded-3xl' : ''}`}
              />
            </main>

            {showContextColumn && (
              <aside className="order-2 hidden min-h-0 flex-col gap-4 overflow-hidden lg:flex" aria-label="게임 컨텍스트">
                <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:[scrollbar-gutter:stable_both-edges] lg:pb-6">
                  {contextCards}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isPlayersDialogOpen} onOpenChange={setIsPlayersDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>플레이어 & 점수 현황</DialogTitle>
            <DialogDescription>현재 라운드 참여자와 점수판을 한눈에 확인하세요.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-2">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="pt-4">
                  <PlayerStatusPanel
                    players={players}
                    currentPhase={currentPhase}
                    currentPlayer={currentPlayer}
                    currentTurnPlayerId={currentTurnPlayerId}
                    votes={voting.votes}
                    isLiar={isLiar}
                    suspectedPlayer={suspectedPlayer?.id ?? undefined}
                  />
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="pt-4">
                  <GameplayScoreboard entries={scoreboardEntries} />
                </CardContent>
              </Card>
              {summaryForPanel && (
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="pt-4">
                    <RoundSummaryPanel summary={summaryForPanel} history={roundSummaryHistory} players={players} />
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>게임 로그</DialogTitle>
            <DialogDescription>중요 이벤트와 단계 변경을 차분하게 다시 살펴보세요.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ActivityFeed events={activities} maxEvents={80} className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm" />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>도움말 & 가이드</DialogTitle>
            <DialogDescription>필요한 순간에만 간단한 팁을 확인하세요.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <GameHelpPanel />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isContextOverlayOpen} onOpenChange={setIsContextOverlayOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>컨텍스트 & 액션</DialogTitle>
            <DialogDescription>모바일에서도 필요한 정보와 버튼을 빠르게 사용할 수 있어요.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 py-2">
              {contextCards}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}




