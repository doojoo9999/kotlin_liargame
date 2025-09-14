import {beforeEach, describe, expect, it} from 'vitest'
import {useGameStoreV2} from '../../stores/gameStoreV2'

/**
 * Helper: reset store state completely for isolation.
 */
function resetStore() {
  useGameStoreV2.setState(state => ({ ...state, gameId: '', players: [], scores: {}, gameData: { ...state.gameData, hints: [], votes: [], accusedPlayer: undefined, defenseStatement: undefined, survivalVotes: [], guessAttempt: undefined, eliminatedPlayer: undefined, results: undefined, victoryAchieved: false }, activities: [] }))
}

describe('gameStoreV2 scoring & phase logic', () => {
  beforeEach(() => {
    resetStore()
    useGameStoreV2.getState().initialize('G1', [
      { id: 'L1', nickname: '라이어', role: 'LIAR' },
      { id: 'C1', nickname: '시민1', role: 'CITIZEN' },
      { id: 'C2', nickname: '시민2', role: 'CITIZEN' }
    ], '과일', 1)
  })

  it('LIAR_ELIMINATED: citizens voting correctly +3', () => {
    const s = useGameStoreV2.getState()
    // Accuse liar L1
    useGameStoreV2.setState(st => ({ gameData: { ...st.gameData, votes: [
      { voterId: 'C1', targetId: 'L1', timestamp: Date.now() },
      { voterId: 'C2', targetId: 'L1', timestamp: Date.now() }
    ], accusedPlayer: 'L1' }, phase: 'GAME_OVER' }))
    s.finalizeRound()
    const scores = useGameStoreV2.getState().scores
    expect(scores['C1']).toBe(3)
    expect(scores['C2']).toBe(3)
    expect(scores['L1'] ?? 0).toBe(0)
  })

  it('INNOCENT_ELIMINATED + LIAR_SURVIVED: liar +6, mis-voters -1', () => {
    const s = useGameStoreV2.getState()
    // Accuse innocent C1
    useGameStoreV2.setState(st => ({ gameData: { ...st.gameData, votes: [
      { voterId: 'L1', targetId: 'C1', timestamp: Date.now() },
      { voterId: 'C2', targetId: 'C1', timestamp: Date.now() }
    ], accusedPlayer: 'C1' }, phase: 'GAME_OVER' }))
    s.finalizeRound()
    const scores = useGameStoreV2.getState().scores
    // Liar survived +6
    expect(scores['L1']).toBe(6)
    // Mis voters -1 each (INNOCENT_ELIMINATED rule gives -1 to eliminators & +1 to savers; we have no savers array so only -1)
    expect(scores['C2']).toBe(-1)
    // Accused innocent typically gets no direct points here by current logic
    expect(scores['C1'] ?? 0).toBe(0)
  })

  it('LIAR_GUESSED_TOPIC bonus +3', () => {
    const s = useGameStoreV2.getState()
    // Liar survives & guesses correctly
    useGameStoreV2.setState(st => ({ gameData: { ...st.gameData, secretWord: '사과', accusedPlayer: 'C1', guessAttempt: { playerId: 'L1', word: '사과', correct: true, timestamp: Date.now() }, votes: [] }, phase: 'GAME_OVER' }))
    s.finalizeRound()
    const scores = useGameStoreV2.getState().scores
    // Liar survives (accused is C1) +6 plus guess bonus +3 => 9
    // INNOCENT_ELIMINATED also applies: mis voters list empty so no -1; but our logic adds LIAR_SURVIVED (+6) + guess (+3)
    expect(scores['L1']).toBe(9)
  })

  it('guess auto-fail when not submitted by GUESSING_WORD timeout', () => {
    const s = useGameStoreV2.getState()
    // move to guessing word phase and simulate timeout
    useGameStoreV2.setState(st => ({ phase: 'GUESSING_WORD', gameData: { ...st.gameData, accusedPlayer: 'L1' }, timeRemaining: 1 }))
    s.tick() // timeRemaining -> 0 and auto guess attempt inserted
    // Should transition to GAME_OVER and finalizeRound soon after
    expect(useGameStoreV2.getState().gameData.guessAttempt).toBeTruthy()
  })

  it('speech auto-hint inserted when player gives none', () => {
    const s = useGameStoreV2.getState()
    s.startGame() // enters SPEECH first player L1
    // Force timeRemaining 1 to trigger auto submission
    useGameStoreV2.setState(st => ({ timeRemaining: 1 }))
    s.tick()
    const hints = useGameStoreV2.getState().gameData.hints
    expect(hints.length).toBe(1)
    expect(hints[0].text).toContain('자동 힌트')
  })
})

