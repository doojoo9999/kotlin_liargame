import React, {createContext, useContext, useReducer} from 'react'
import type {GamePhase, Player} from '@/shared/types/api.types'

// 게임 결과 타입 정의
interface GameResult {
  winner: 'LIAR' | 'CITIZENS';
  liarId: number;
  liarNickname: string;
  votingResults: {
    playerId: number;
    votes: number;
  }[];
  gameEndReason: 'LIAR_FOUND' | 'LIAR_GUESSED_SUBJECT' | 'TIME_UP';
  finalSubject?: string;
  roundResults: {
    round: number;
    eliminatedPlayerId?: number;
    votingResults: Record<number, number>;
  }[];
}

interface GameState {
  gameNumber: number | null
  phase: GamePhase
  timeRemaining: number | null
  currentRound: number
  totalRounds: number
  players: Player[]
  currentPlayerId: number | null
  selectedVote: number | null
  subject: string | null
  isLiar: boolean
  gameResult: GameResult | null
}

type GameAction =
  | { type: 'SET_GAME'; payload: Partial<GameState> }
  | { type: 'UPDATE_PHASE'; payload: { phase: GamePhase; timeRemaining?: number } }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'SELECT_VOTE'; payload: number | null }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'RESET_GAME' }

const initialState: GameState = {
  gameNumber: null,
  phase: 'WAITING',
  timeRemaining: null,
  currentRound: 1,
  totalRounds: 3,
  players: [],
  currentPlayerId: null,
  selectedVote: null,
  subject: null,
  isLiar: false,
  gameResult: null
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, ...action.payload }
    case 'UPDATE_PHASE':
      return {
        ...state,
        phase: action.payload.phase,
        timeRemaining: action.payload.timeRemaining ?? state.timeRemaining
      }
    case 'UPDATE_PLAYERS':
      return { ...state, players: action.payload }
    case 'SELECT_VOTE':
      return { ...state, selectedVote: action.payload }
    case 'UPDATE_TIMER':
      return { ...state, timeRemaining: action.payload }
    case 'RESET_GAME':
      return initialState
    default:
      return state
  }
}

interface GameContextType {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  actions: {
    setGame: (game: Partial<GameState>) => void
    updatePhase: (phase: GamePhase, timeRemaining?: number) => void
    updatePlayers: (players: Player[]) => void
    selectVote: (playerId: number | null) => void
    updateTimer: (time: number) => void
    resetGame: () => void
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const actions = {
    setGame: (game: Partial<GameState>) =>
      dispatch({ type: 'SET_GAME', payload: game }),
    updatePhase: (phase: GamePhase, timeRemaining?: number) =>
      dispatch({ type: 'UPDATE_PHASE', payload: { phase, timeRemaining } }),
    updatePlayers: (players: Player[]) =>
      dispatch({ type: 'UPDATE_PLAYERS', payload: players }),
    selectVote: (playerId: number | null) =>
      dispatch({ type: 'SELECT_VOTE', payload: playerId }),
    updateTimer: (time: number) =>
      dispatch({ type: 'UPDATE_TIMER', payload: time }),
    resetGame: () =>
      dispatch({ type: 'RESET_GAME' })
  }

  return (
    <GameContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
