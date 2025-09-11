import type {Player} from '@/types/game'

export interface ScoredPlayer extends Player { score: number }

export function useScores(): ScoredPlayer[] {
