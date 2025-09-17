import {create} from 'zustand'
import type {
    ActivityEvent,
    GamePhase,
    GameResults,
    GuessAttempt,
    Hint,
    Player,
    PlayerID,
    SurvivalVote,
    Vote
} from '@/types/game'

/**
 * GameStoreV2 - Comprehensive game state management for V2 components
 *
 * IMPORTANT: Usage Patterns to Prevent Infinite Loops
 *
 * ✅ CORRECT - Individual selectors with useCallback:
 * const players = useGameStoreV2(useCallback(s => s.players, []))
 * const phase = useGameStoreV2(useCallback(s => s.phase, []))
 *
 * ✅ CORRECT - Entire store for components needing many properties:
 * const s = useGameStoreV2() // OK for components like GameFlowManager
 *
 * ❌ INCORRECT - Object selectors without memoization:
 * const { players, phase } = useGameStoreV2(s => ({ players: s.players, phase: s.phase }))
 * // This creates new objects on every render causing infinite loops!
 *
 * ✅ CORRECT - If you need object selectors, use React.useMemo:
 * const gameState = useGameStoreV2(useCallback(s => s, []))
 * const data = React.useMemo(() => ({ players: gameState.players, phase: gameState.phase }), [gameState.players, gameState.phase])
 */

export interface GameStateV2 {
  // Basic game info
  gameId: string
  phase: GamePhase
  currentRound: number
  totalRounds: number
  timeRemaining: number
  currentPlayer?: PlayerID
  players: Player[]

  // Game data
  gameData: {
    topic: string
    secretWord?: string
    hints: Hint[]
    votes: Vote[]
    accusedPlayer?: PlayerID
    defenseStatement?: string
    survivalVotes: SurvivalVote[]
    guessAttempt?: GuessAttempt
    eliminatedPlayer?: PlayerID
    results?: GameResults
    victoryAchieved: boolean
  }

  // Scoring and activity
  scores: Record<PlayerID, number>
  activities: ActivityEvent[]

  // Actions
  initialize: (gameId: string, players: Player[], topic: string, totalRounds: number) => void
  startGame: () => void
  startPhase: (phase: GamePhase) => void
  tick: () => void
  nextPhase: () => void
  finalizeRound: () => void

  // Gameplay actions
  submitHint: (playerId: PlayerID, text: string) => void
  castVote: (voterId: PlayerID, targetId: PlayerID) => void
  submitDefense: (playerId: PlayerID, statement: string) => void
  castSurvivalVote: (voterId: PlayerID, targetId: PlayerID) => void
  submitGuess: (playerId: PlayerID, word: string) => void

  // Utility methods
  setTimeRemaining: (time: number) => void
  addActivity: (activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  reset: () => void

  // Score management
  setScore: (playerId: string, value: number) => void
  addScore: (playerId: string, delta: number) => void
}

const initialGameData = {
  topic: '',
  secretWord: undefined,
  hints: [],
  votes: [],
  accusedPlayer: undefined,
  defenseStatement: undefined,
  survivalVotes: [],
  guessAttempt: undefined,
  eliminatedPlayer: undefined,
  results: undefined,
  victoryAchieved: false
}

export const useGameStoreV2 = create<GameStateV2>((set, get) => ({
  // Initial state
  gameId: '',
  phase: 'WAITING_FOR_PLAYERS',
  currentRound: 1,
  totalRounds: 1,
  timeRemaining: 0,
  currentPlayer: undefined,
  players: [],
  gameData: { ...initialGameData },
  scores: {},
  activities: [],

  // Initialize game
  initialize: (gameId, players, topic, totalRounds) => {
    set({
      gameId,
      players,
      currentRound: 1,
      totalRounds,
      gameData: { ...initialGameData, topic },
      scores: {},
      activities: [],
      phase: 'WAITING_FOR_PLAYERS',
      currentPlayer: undefined,
      timeRemaining: 0
    })
  },

  // Start game
  startGame: () => {
    const { players } = get()
    if (players.length === 0) return

    set({
      phase: 'SPEECH',
      currentPlayer: players[0].id,
      timeRemaining: 30
    })

    get().addActivity({
      type: 'phase_change',
      content: '게임이 시작되었습니다!',
      phase: 'SPEECH'
    })
  },

  // Start specific phase
  startPhase: (phase) => {
    set({ phase, timeRemaining: getPhaseTime(phase) })
    get().addActivity({
      type: 'phase_change',
      content: getPhaseMessage(phase),
      phase
    })
  },

  // Timer tick
  tick: () => {
    const { timeRemaining, phase, currentPlayer, players } = get()

    if (timeRemaining <= 1) {
      // Handle phase timeout
      switch (phase) {
        case 'SPEECH': {
          // Auto-submit hint if none provided
          const currentHint = get().gameData.hints.find(h => h.playerId === currentPlayer)
          if (!currentHint && currentPlayer) {
            get().submitHint(currentPlayer, '자동 힌트 제출')
          }

          // Move to next player or next phase
          const currentIndex = players.findIndex(p => p.id === currentPlayer)
          const nextIndex = currentIndex + 1

          if (nextIndex < players.length) {
            set({
              currentPlayer: players[nextIndex].id,
              timeRemaining: 30
            })
          } else {
            get().nextPhase()
          }
          break
        }
        case 'GUESSING_WORD': {
          // Auto-fail guess if not submitted
          const { accusedPlayer } = get().gameData
          if (accusedPlayer && !get().gameData.guessAttempt) {
            get().submitGuess(accusedPlayer, '자동 실패')
          }
          get().nextPhase()
          break
        }
        default:
          get().nextPhase()
          break
      }
    } else {
      set({ timeRemaining: timeRemaining - 1 })
    }
  },

  // Move to next phase
  nextPhase: () => {
    const { phase } = get()

    switch (phase) {
      case 'SPEECH':
        get().startPhase('VOTING_FOR_LIAR')
        break
      case 'VOTING_FOR_LIAR':
        get().startPhase('DEFENDING')
        break
      case 'DEFENDING':
        get().startPhase('VOTING_FOR_SURVIVAL')
        break
      case 'VOTING_FOR_SURVIVAL':
        get().startPhase('GUESSING_WORD')
        break
      case 'GUESSING_WORD':
        get().startPhase('GAME_OVER')
        break
      case 'GAME_OVER': {
        get().finalizeRound()
        // Start next round or end game
        const { currentRound, totalRounds } = get()
        if (currentRound < totalRounds) {
          set({
            currentRound: currentRound + 1,
            gameData: { ...initialGameData, topic: get().gameData.topic }
          })
          get().startGame()
        }
        break
      }
    }
  },

  // Finalize round scoring
  finalizeRound: () => {
    const { gameData, players } = get()
    const { votes, accusedPlayer, guessAttempt } = gameData

    // Determine if liar was correctly identified
    const liar = players.find(p => p.role === 'LIAR')
    const liarEliminated = accusedPlayer === liar?.id

    // Apply scoring rules
    if (liarEliminated) {
      // LIAR_ELIMINATED: citizens get +3
      players.forEach(player => {
        if (player.role === 'CITIZEN') {
          get().addScore(player.id, 3)
        }
      })
    } else {
      // INNOCENT_ELIMINATED
      if (liar) {
        get().addScore(liar.id, 6) // LIAR_SURVIVED: +6

        // LIAR_GUESSED_TOPIC: +3 if guessed correctly
        if (guessAttempt?.correct) {
          get().addScore(liar.id, 3)
        }
      }

      // Mis-voters get -1
      const eliminators = votes.filter(v => v.targetId === accusedPlayer)
      eliminators.forEach(vote => {
        get().addScore(vote.voterId, -1)
      })
    }
  },

  // Gameplay actions
  submitHint: (playerId, text) => {
    set(state => ({
      gameData: {
        ...state.gameData,
        hints: [...state.gameData.hints, { playerId, text, timestamp: Date.now() }]
      }
    }))

    get().addActivity({
      type: 'hint',
      playerId,
      content: text,
      phase: get().phase
    })
  },

  castVote: (voterId, targetId) => {
    set(state => ({
      gameData: {
        ...state.gameData,
        votes: [...state.gameData.votes, { voterId, targetId, timestamp: Date.now() }]
      }
    }))

    get().addActivity({
      type: 'vote',
      playerId: voterId,
      targetId,
      content: `${get().players.find(p => p.id === targetId)?.nickname}님에게 투표`,
      phase: get().phase
    })
  },

  submitDefense: (playerId, statement) => {
    set(state => ({
      gameData: {
        ...state.gameData,
        defenseStatement: statement
      }
    }))

    get().addActivity({
      type: 'defense',
      playerId,
      content: statement,
      phase: get().phase
    })
  },

  castSurvivalVote: (voterId, targetId) => {
    set(state => ({
      gameData: {
        ...state.gameData,
        survivalVotes: [...state.gameData.survivalVotes, { voterId, targetId, timestamp: Date.now() }]
      }
    }))

    get().addActivity({
      type: 'survival_vote',
      playerId: voterId,
      targetId,
      content: `${get().players.find(p => p.id === targetId)?.nickname}님 생존 투표`,
      phase: get().phase
    })
  },

  submitGuess: (playerId, word) => {
    const correct = word.toLowerCase() === get().gameData.secretWord?.toLowerCase()

    set(state => ({
      gameData: {
        ...state.gameData,
        guessAttempt: { playerId, word, correct, timestamp: Date.now() }
      }
    }))

    get().addActivity({
      type: 'guess',
      playerId,
      content: `"${word}" ${correct ? '정답!' : '오답'}`,
      phase: get().phase,
      highlight: correct
    })
  },

  // Utility methods
  setTimeRemaining: (time) => set({ timeRemaining: time }),

  addActivity: (activity) => {
    const newActivity: ActivityEvent = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    set(state => ({
      activities: [...state.activities, newActivity].slice(-100) // Keep only last 100 activities to prevent memory issues
    }))
  },

  reset: () => set({
    gameId: '',
    phase: 'WAITING_FOR_PLAYERS',
    currentRound: 1,
    totalRounds: 1,
    timeRemaining: 0,
    currentPlayer: undefined,
    players: [],
    gameData: { ...initialGameData },
    scores: {},
    activities: []
  }),

  // Score management (legacy compatibility)
  setScore: (playerId, value) => set(s => ({ scores: { ...s.scores, [playerId]: value } })),
  addScore: (playerId, delta) => {
    const current = get().scores[playerId] ?? 0
    set(s => ({ scores: { ...s.scores, [playerId]: current + delta } }))
  }
}))

// Helper functions
function getPhaseTime(phase: GamePhase): number {
  switch (phase) {
    case 'SPEECH': return 30
    case 'VOTING_FOR_LIAR': return 20
    case 'DEFENDING': return 15
    case 'VOTING_FOR_SURVIVAL': return 20
    case 'GUESSING_WORD': return 30
    case 'GAME_OVER': return 10
    default: return 0
  }
}

function getPhaseMessage(phase: GamePhase): string {
  switch (phase) {
    case 'SPEECH': return '힌트 제공 단계 시작'
    case 'VOTING_FOR_LIAR': return '라이어 투표 단계 시작'
    case 'DEFENDING': return '변론 단계 시작'
    case 'VOTING_FOR_SURVIVAL': return '생존 투표 단계 시작'
    case 'GUESSING_WORD': return '단어 맞추기 단계 시작'
    case 'GAME_OVER': return '라운드 종료'
    default: return '알 수 없는 단계'
  }
}
