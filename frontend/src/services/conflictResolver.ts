// Basic conflict resolution strategies (stub)
import type {GameStateResponse} from '@/types/game';

export type ConflictType = 'FIELD' | 'VERSION' | 'OUT_OF_ORDER';
export interface GameAction { type: string; payload?: any; timestamp?: number }
export interface Resolution { accepted: boolean; mergedState?: any; reason?: string }

export class ConflictResolver {
  resolveConflict(localState: any, serverState: any, conflictType: ConflictType): any {
    switch (conflictType) {
      case 'FIELD':
        return { ...localState, ...serverState }; // server wins field-level
      case 'VERSION':
        return serverState.version >= localState.version ? serverState : localState;
      case 'OUT_OF_ORDER':
        return serverState; // prefer authoritative ordering
      default:
        return serverState;
    }
  }

  handleConcurrentActions(localAction: GameAction, serverAction: GameAction): Resolution {
    if ((serverAction.timestamp || 0) >= (localAction.timestamp || 0)) {
      return { accepted: false, reason: 'Server action newer' };
    }
    return { accepted: true };
  }

  mergeStates(states: any[]): any {
    return states.reduce((acc, s) => ({ ...acc, ...s }), {});
  }

  validateTransition(from: GameStateResponse | null, to: GameStateResponse | null): boolean {
    if (!from || !to) {
      return true;
    }

    if (from.gameNumber !== to.gameNumber) {
      return false;
    }

    if (to.gameCurrentRound < from.gameCurrentRound) {
      return false;
    }

    if (to.gameCurrentRound === from.gameCurrentRound) {
      return to.currentTurnIndex >= from.currentTurnIndex;
    }

    return true;
  }
}

export const conflictResolver = new ConflictResolver();
