import {useMemo} from 'react'
import {useGameStore} from '@/stores'
import {useShallow} from 'zustand/react/shallow'
import type {GamePhase, ScoreboardEntry} from '@/types/backendTypes'
import type {
    GameResults,
    GameTimer,
    Player,
    RoundSummaryEntry,
    RoundUxStage,
    VotingState
} from '@/stores/unified/types'
import type {ChatMessage} from '@/types/realtime'

export interface GameLayoutViewModel {
  gameId: string | null
  gameNumber: number | null
  sessionCode: string | null
  gamePhase: GamePhase
  currentRound: number
  totalRounds: number
  currentTopic: string | null
  currentWord: string | null
  currentLiar: string | null
  isLiar: boolean
  timer: GameTimer
  voting: VotingState
  scores: Record<string, number>
  players: Player[]
  currentPlayer: Player | null
  currentTurnPlayerId: string | null
  chatMessages: ChatMessage[]
  chatLoading: boolean
  chatError: string | null
  typingPlayers: Set<string>
  gameResults: GameResults[] | null
  isLoading: boolean
  error: string | null
  summary: {
    totalPlayers: number
    alivePlayers: number
    readyPlayers: number
  }
  roundStage: RoundUxStage
  roundStageEnteredAt: number | null
  roundHasStarted: boolean
  roundSummaries: RoundSummaryEntry[]
  currentRoundSummary: RoundSummaryEntry | null
  scoreboardEntries: ScoreboardEntry[]
  addHint: ReturnType<typeof useGameStore.getState>['addHint']
  castVote: ReturnType<typeof useGameStore.getState>['castVote']
  addDefense: ReturnType<typeof useGameStore.getState>['addDefense']
  setUserVote: ReturnType<typeof useGameStore.getState>['setUserVote']
  sendChatMessage: ReturnType<typeof useGameStore.getState>['sendChatMessage']
  loadChatHistory: ReturnType<typeof useGameStore.getState>['loadChatHistory']
  startGame: ReturnType<typeof useGameStore.getState>['startGame']
  toggleReady: ReturnType<typeof useGameStore.getState>['toggleReady']
}

export function useGameLayoutViewModel(): GameLayoutViewModel {
  const selectGameLayout = useShallow((store: ReturnType<typeof useGameStore.getState>) => ({
    gameId: store.gameId,
    gameNumber: store.gameNumber,
    sessionCode: store.sessionCode,
    gamePhase: store.gamePhase,
    currentRound: store.currentRound,
    totalRounds: store.totalRounds,
    currentTopic: store.currentTopic,
    currentWord: store.currentWord,
    currentLiar: store.currentLiar,
    isLiar: store.isLiar,
    timer: store.timer,
    voting: store.voting,
    scores: store.scores,
    players: store.players,
    currentPlayer: store.currentPlayer,
    currentTurnPlayerId: store.currentTurnPlayerId ?? null,
    chatMessages: store.chatMessages,
    chatLoading: store.chatLoading,
    chatError: store.chatError,
    typingPlayers: store.typingPlayers,
    gameResults: store.gameResults,
    isLoading: store.isLoading,
    error: store.error,
    roundStage: store.roundStage,
    roundStageEnteredAt: store.roundStageEnteredAt,
    roundHasStarted: store.roundHasStarted,
    roundSummaries: store.roundSummaries,
    currentRoundSummary: store.currentRoundSummary,
    addHint: store.addHint,
    castVote: store.castVote,
    addDefense: store.addDefense,
    setUserVote: store.setUserVote,
    sendChatMessage: store.sendChatMessage,
    loadChatHistory: store.loadChatHistory,
    startGame: store.startGame,
    toggleReady: store.toggleReady,
  }));

  const state = useGameStore(selectGameLayout)

  const summary = useMemo(() => {
    const totalPlayers = state.players.length
    const alivePlayers = state.players.filter((player) => player.isAlive !== false).length
    const readyPlayers = state.players.filter((player) => player.isReady).length

    return {
      totalPlayers,
      alivePlayers,
      readyPlayers,
    }
  }, [state.players])

  const scoreboardEntries = useMemo<ScoreboardEntry[]>(() => {
    return state.players.map((player) => {
      const numericUserId = Number.isFinite(player.userId)
        ? Number(player.userId)
        : Number.parseInt(player.id, 10) || 0

      return {
        userId: numericUserId,
        nickname: player.nickname,
        isAlive: player.isAlive !== false,
        score: state.scores[player.id] ?? player.score ?? 0,
      }
    })
  }, [state.players, state.scores])

  return {
    ...state,
    summary,
    scoreboardEntries,
  }
}
