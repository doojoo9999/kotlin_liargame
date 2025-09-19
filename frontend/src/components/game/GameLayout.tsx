import type {ReactNode} from 'react'
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
import {GameplayScoreboard} from '@/components/gameplay/GameplayScoreboard'
import type {GamePhase, ScoreboardEntry} from '@/types/backendTypes'
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
  if (isLoading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <div className="text-muted-foreground">게임을 불러오는 중...</div>
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

  const topicLabel = currentTopic ? `주제: ${currentTopic}` : '주제 준비 중'
  const wordLabel = currentWord ? `단어: ${currentWord}` : isLiar ? '라이어는 단어를 추측하세요' : '단어는 비공개입니다'
  const roundLabel = `${currentRound || 0} / ${totalRounds || 0}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {onReturnToLobby && (
              <Button variant="ghost" size="sm" onClick={onReturnToLobby} className="mt-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                나가기
              </Button>
            )}
            <div>
              <div className="text-sm uppercase text-muted-foreground">라이어 게임</div>
              <div className="text-lg font-semibold">게임 #{gameNumber ?? '—'}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>{topicLabel}</span>
                <span className="hidden md:inline" aria-hidden>•</span>
                <span>{wordLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <GamePhaseIndicator phase={currentPhase} timeRemaining={timer.timeRemaining} />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>라운드 {roundLabel}</span>
              <span className="hidden md:inline" aria-hidden>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {summary.alivePlayers}/{summary.totalPlayers} 생존
              </span>
              <span className="hidden lg:inline" aria-hidden>•</span>
              <span className="hidden lg:inline">준비 {summary.readyPlayers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
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

          <div className="grid gap-6 lg:grid-cols-[260px,minmax(0,1fr)] xl:grid-cols-[280px,minmax(0,1fr),320px] 2xl:grid-cols-[320px,minmax(0,1fr),360px]">
            <aside className="order-2 space-y-6 lg:order-1">
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
              <div className="xl:hidden">
                <ActivityFeed events={activities} maxEvents={40} />
              </div>
            </aside>

            <main className="order-1 flex flex-col gap-6 lg:order-2">
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

              {actionSlot}

              {currentRoundSummary && (
                <RoundSummaryPanel
                  summary={currentRoundSummary}
                  history={roundSummaries.filter((entry) => entry.concludedAt !== currentRoundSummary.concludedAt)}
                  players={players}
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
            </main>

            <aside className="order-3 hidden flex-col gap-6 xl:flex">
              <ActivityFeed events={activities} maxEvents={60} />
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
                className="flex-1"
              />
            </aside>
          </div>

          <div className="xl:hidden">
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
              className="h-[420px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
