import {useGameStoreV2} from '@/stores/gameStoreV2'
import type {GamePhase, PlayerID} from '@/types/game'

export function useGameState() {
  const state = useGameStoreV2(s => s)
  return state
}

export function useIsMyTurn(myId: PlayerID | undefined) {
  const current = useGameStoreV2(s => s.currentPlayer)
  return !!myId && current === myId
}

export type { GamePhase }

