import {describe, expect, it} from 'vitest'
import {calculateScoreChanges} from '../scoreCalculations'

describe('scoreCalculations', () => {
  it('LIAR_ELIMINATED', () => {
    const res = calculateScoreChanges('LIAR_ELIMINATED', { liars: ['l1'], citizens: ['c1','c2'], correctVoters: ['c1','c2'] })
    expect(res).toContainEqual({ playerId: 'c1', delta: 3 })
    expect(res).toContainEqual({ playerId: 'c2', delta: 3 })
    // No direct liar penalty in updated spec
  })
  it('INNOCENT_ELIMINATED', () => {
    const res = calculateScoreChanges('INNOCENT_ELIMINATED', { liars: ['l1'], citizens: ['c1'], incorrectVoters: ['c1'] })
    expect(res).toContainEqual({ playerId: 'c1', delta: -1 })
    expect(res).toContainEqual({ playerId: 'l1', delta: 4 })
  })
  it('LIAR_SURVIVED', () => {
    const res = calculateScoreChanges('LIAR_SURVIVED', { liars: ['l1'], citizens: ['c1'] })
    expect(res).toEqual([{ playerId: 'l1', delta: 6 }])
  })
  it('LIAR_GUESSED_TOPIC', () => {
    const res = calculateScoreChanges('LIAR_GUESSED_TOPIC', { liars: ['l1'], citizens: ['c1'], guesser: 'l1' })
    expect(res).toEqual([{ playerId: 'l1', delta: 3 }])
  })
})
