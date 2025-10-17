import {useMemo} from 'react'
import {useGameStore} from '@/stores'
import type {Player} from '@/types/game'

export interface ScoredPlayer extends Player { score: number }

export function useScores(): ScoredPlayer[] {
  const { players, scores } = useGameStore()

  return useMemo(
    () =>
      players.map((player) => ({
        ...player,
        score: scores[player.id] ?? (typeof (player as { score?: number }).score === 'number' ? (player as { score?: number }).score ?? 0 : 0),
      })),
    [players, scores],
  )
}
