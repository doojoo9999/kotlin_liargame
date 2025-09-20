import {describe, expect, it, vi} from 'vitest'
import {applyServerTimeRemaining, estimateClockOffset} from '../timeSync.ts'
import {calculateScoreChanges, type ScoreCalculationOptions} from '../scoreCalculations'

describe('timeSync', () => {
  it('estimateClockOffset returns server-now minus client-now', () => {
    const fakeNow = 1700000000000
    vi.setSystemTime(new Date(fakeNow))
    const offset = estimateClockOffset(fakeNow + 500)
    expect(offset).toBe(500)
  })

  it('applyServerTimeRemaining compensates offset', () => {
    const remaining = applyServerTimeRemaining(20, 1000)
    expect(remaining).toBe(19)
  })
})

const liars = ['L1']
const citizens = ['C1', 'C2', 'C3']

describe('scoreCalculations', () => {
  it('LIAR_ELIMINATED awards +3 to correct voters', () => {
    const options: ScoreCalculationOptions<'LIAR_ELIMINATED'> = { liars, citizens, correctVoters: ['C1'], incorrectVoters: [] }
    const res = calculateScoreChanges('LIAR_ELIMINATED', options)
    expect(res).toEqual([{ playerId: 'C1', delta: 3 }])
  })

  it('INNOCENT_ELIMINATED: liars +4, eliminate voters -1, savers +1', () => {
    const options: ScoreCalculationOptions<'INNOCENT_ELIMINATED'> = { liars, citizens, correctVoters: ['C2'], incorrectVoters: ['C1'] }
    const res = calculateScoreChanges('INNOCENT_ELIMINATED', options)
    expect(res).toContainEqual({ playerId: 'L1', delta: 4 })
    expect(res).toContainEqual({ playerId: 'C1', delta: -1 })
    expect(res).toContainEqual({ playerId: 'C2', delta: +1 })
  })

  it('LIAR_SURVIVED: liar +6', () => {
    const options: ScoreCalculationOptions<'LIAR_SURVIVED'> = { liars, citizens }
    const res = calculateScoreChanges('LIAR_SURVIVED', options)
    expect(res).toContainEqual({ playerId: 'L1', delta: 6 })
  })

  it('LIAR_GUESSED_TOPIC: guesser +3', () => {
    const options: ScoreCalculationOptions<'LIAR_GUESSED_TOPIC'> = { liars, citizens, guesser: 'L1' }
    const res = calculateScoreChanges('LIAR_GUESSED_TOPIC', options)
    expect(res).toEqual([{ playerId: 'L1', delta: 3 }])
  })
})

