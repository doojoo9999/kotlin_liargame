// Optimistic update manager (simplified implementation)
import type {OptimisticUpdate} from '@/types/store';

const genId = () => (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));

export class OptimisticUpdateManager<StateShape = any> {
  private pending = new Map<string, OptimisticUpdate<StateShape>>();

  applyUpdate(action: string, optimisticState: Partial<StateShape>, originalState: Partial<StateShape>): string {
    const id = genId();
    this.pending.set(id, {
      id,
      action,
      optimisticState,
      originalState,
      timestamp: Date.now(),
      confirmed: false,
      rolledBack: false,
    });
    return id;
  }

  confirmUpdate(id: string, serverState?: Partial<StateShape>): OptimisticUpdate<StateShape> | undefined {
    const upd = this.pending.get(id);
    if (upd) {
      upd.confirmed = true;
      if (serverState) {
        // merge server state over optimistic
        upd.optimisticState = { ...upd.optimisticState, ...serverState };
      }
      this.pending.delete(id);
    }
    return upd;
  }

  rollbackUpdate(id: string): OptimisticUpdate<StateShape> | undefined {
    const upd = this.pending.get(id);
    if (upd) {
      upd.rolledBack = true;
      this.pending.delete(id);
    }
    return upd;
  }

  mergeServerState(serverState: StateShape): StateShape {
    // Simple strategy: apply pending optimistic diffs over server snapshot
    let merged: any = { ...serverState };
    for (const [, upd] of this.pending) {
      merged = { ...merged, ...upd.optimisticState };
    }
    return merged;
  }

  listPending(): OptimisticUpdate<StateShape>[] {
    return [...this.pending.values()];
  }
}

export const optimisticUpdateManager = new OptimisticUpdateManager();
