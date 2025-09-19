import {useMemo} from 'react'
import {shallow} from 'zustand/shallow'
import {useGameStore} from '@/stores'
import type {GamePhase, ScoreboardEntry} from '@/types/backendTypes'
import type {
    GameResults,
    GameTimer,
    Player,
    RoundSummaryEntry,
    RoundUxStage,
    VotingState
} from '@/stores/unifiedGameStore'
import type {ChatMessage} from '@/types/realtime'

type GameStoreSnapshot = ReturnType<typeof useGameStore.getState>

type StoreActions = Pick<GameStoreSnapshot, 'addHint' | 'castVote' | 'addDefense' | 'setUserVote' | 'sendChatMessage' | 'loadChatHistory'>

export interface GameLayoutViewModel extends StoreActions {
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
}

export function useGameLayoutViewModel(): GameLayoutViewModel {
  const state = useGameStore(
    (store) => ({
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
    }),
    shallow,
  )

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
