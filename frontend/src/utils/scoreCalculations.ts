export type ScoringScenario = 'LIAR_ELIMINATED' | 'INNOCENT_ELIMINATED' | 'LIAR_SURVIVED' | 'LIAR_GUESSED_TOPIC'

export interface ScoreChange { playerId: string; delta: number }

interface BaseOptions { liars: string[]; citizens: string[] }
interface LiarEliminated extends BaseOptions { correctVoters: string[]; incorrectVoters?: string[] }
interface InnocentEliminated extends BaseOptions { correctVoters?: string[]; incorrectVoters: string[] }
type LiarSurvived = BaseOptions
interface LiarGuessedTopic extends BaseOptions { guesser: string }

type OptionMap = {
  LIAR_ELIMINATED: LiarEliminated
  INNOCENT_ELIMINATED: InnocentEliminated
  LIAR_SURVIVED: LiarSurvived
  LIAR_GUESSED_TOPIC: LiarGuessedTopic
}

export function calculateScoreChanges<S extends ScoringScenario>(scenario: S, options: OptionMap[S]): ScoreChange[] {
  const changes: ScoreChange[] = []
  switch (scenario) {
    case 'LIAR_ELIMINATED': {
      const { correctVoters } = options as LiarEliminated
      // Correct voters +3 points. No direct liar penalty in this phase per updated spec.
      correctVoters.forEach(p => changes.push({ playerId: p, delta: 3 }))
      break
    }
    case 'INNOCENT_ELIMINATED': {
      const { liars, incorrectVoters, correctVoters } = options as InnocentEliminated
      // Innocent eliminated: liars +4, incorrect voters (who pushed elimination) -1, correct voters (who defended) +1
      liars.forEach(p => changes.push({ playerId: p, delta: 4 }))
      incorrectVoters.forEach(p => changes.push({ playerId: p, delta: -1 }))
      correctVoters?.forEach(p => changes.push({ playerId: p, delta: 1 }))
      break
    }
    case 'LIAR_SURVIVED': {
      const { liars } = options as LiarSurvived
      // Liar survived final vote: liar +6
      liars.forEach(p => changes.push({ playerId: p, delta: 6 }))
      break
    }
    case 'LIAR_GUESSED_TOPIC': {
      const { guesser } = options as LiarGuessedTopic
      // Liar guessed the correct topic: +3
      changes.push({ playerId: guesser, delta: 3 })
      break
    }
  }
  return changes
}

