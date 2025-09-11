import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {useGameStoreV2} from '../gameStoreV2'
import {GamePhase} from '@/types/game'

function resetStore() {
  const { reset } = useGameStoreV2.getState()
  reset()
}

describe('gameStoreV2 state machine', () => {
  beforeEach(() => resetStore())
  afterEach(() => resetStore())

  it('initializes and starts SPEECH with per-player rotation', () => {
    const s = useGameStoreV2.getState()
    s.initialize('g1', [
      { id: 'p1', nickname: '철수' },
      { id: 'p2', nickname: '영희' },
    ], '과일', 2)

    s.startGame()
    expect(useGameStoreV2.getState().phase).toBe(GamePhase.SPEECH)
    expect(useGameStoreV2.getState().timeRemaining).toBeGreaterThan(0)

    // Force next speaker
    useGameStoreV2.getState().setTimeRemaining(1)
    s.tick()
    expect(useGameStoreV2.getState().phase).toBe(GamePhase.SPEECH)
    expect(useGameStoreV2.getState().currentPlayer).toBe('p2')

    // After last speaker, move to VOTING_FOR_LIAR
    useGameStoreV2.getState().setTimeRemaining(1)
    s.tick()
    expect(useGameStoreV2.getState().phase).toBe(GamePhase.VOTING_FOR_LIAR)
  })

  it('cycles phases and advances round after GAME_OVER', () => {
    const s = useGameStoreV2.getState()
    s.initialize('g1', [{ id: 'p1', nickname: '철수' }], '과일', 2)
    s.startPhase(GamePhase.GAME_OVER)
    expect(useGameStoreV2.getState().phase).toBe(GamePhase.GAME_OVER)

    // Timeout triggers nextPhase and round advance
    useGameStoreV2.getState().setTimeRemaining(1)
    s.tick()
    expect(useGameStoreV2.getState().currentRound).toBe(2)
    expect(useGameStoreV2.getState().phase).toBe(GamePhase.SPEECH)
  })
})

