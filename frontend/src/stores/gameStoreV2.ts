import {create} from 'zustand'

export interface SimpleScoreState {
  scores: Record<string, number>
  reset: () => void
  setScore: (playerId: string, value: number) => void
  addScore: (playerId: string, delta: number) => void
}

export const useGameStoreV2 = create<SimpleScoreState>((set, get) => ({
  scores: {},
  reset: () => set({ scores: {} }),
  setScore: (playerId, value) => set(s => ({ scores: { ...s.scores, [playerId]: value } })),
  addScore: (playerId, delta) => {
    const current = get().scores[playerId] ?? 0
    set(s => ({ scores: { ...s.scores, [playerId]: current + delta } }))
  }
}))
