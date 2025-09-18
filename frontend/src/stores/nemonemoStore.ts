import { create } from 'zustand'
import { nemonemoApi } from '../api/nemonemoApi'
import type {
  LeaderboardEntry,
  PuzzleDetail,
  PuzzleSummary,
  SessionResponse
} from '../types'

interface NemonemoState {
  puzzles: PuzzleSummary[]
  puzzleDetail?: PuzzleDetail
  session?: SessionResponse
  leaderboard: LeaderboardEntry[]
  isLoading: boolean
  error?: string
  fetchPuzzles: (args?: { page?: number; size?: number; difficulty?: PuzzleSummary['difficulty'] }) => Promise<void>
  fetchPuzzleDetail: (puzzleId: number) => Promise<void>
  startSession: (puzzleId: number) => Promise<void>
  fetchLeaderboard: (releasePack: string, scope?: 'GLOBAL' | 'FRIENDS') => Promise<void>
  resetError: () => void
}

export const useNemonemoStore = create<NemonemoState>((set) => ({
  puzzles: [],
  leaderboard: [],
  isLoading: false,
  async fetchPuzzles(args = {}) {
    set({ isLoading: true, error: undefined })
    try {
      const response = await nemonemoApi.listPuzzles(args)
      set({ puzzles: response.items, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
    }
  },
  async fetchPuzzleDetail(puzzleId) {
    set({ isLoading: true, error: undefined })
    try {
      const detail = await nemonemoApi.getPuzzle(puzzleId)
      set({ puzzleDetail: detail, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
    }
  },
  async startSession(puzzleId) {
    set({ isLoading: true, error: undefined })
    try {
      const session = await nemonemoApi.startSession({ puzzleId })
      set({ session, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
    }
  },
  async fetchLeaderboard(releasePack, scope = 'GLOBAL') {
    set({ isLoading: true, error: undefined })
    try {
      const response = await nemonemoApi.listWeeklyLeaderboard(releasePack, scope)
      set({ leaderboard: response.entries, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
    }
  },
  resetError() {
    set({ error: undefined })
  }
}))
