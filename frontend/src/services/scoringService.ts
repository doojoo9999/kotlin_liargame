import {useGameStoreV2} from '@/stores/gameStoreV2'
import type {ScoreChange, ScoringScenario} from '@/utils/scoreCalculations'
import {calculateScoreChanges} from '@/utils/scoreCalculations'

export function applyScores(changes: ScoreChange[]) {
  const s = useGameStoreV2.getState()
  const next = { ...s.scores }
  changes.forEach(({ playerId, delta }) => {
    next[playerId] = (next[playerId] ?? 0) + delta
  })
  useGameStoreV2.setState({ scores: next })
}

export function scoreScenario(
  scenario: ScoringScenario,
  options: Parameters<typeof calculateScoreChanges>[1]
) {
  const changes = calculateScoreChanges(scenario, options)
  applyScores(changes)
  return changes
}

