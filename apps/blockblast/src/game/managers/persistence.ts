import type { BlockInstance, Grid } from '../../utils/grid';
import type { GameStatus } from '../../stores/useGameStore';

const STORAGE_KEY = 'blockblast:v1';

export interface PersistedGameState {
  grid: Grid;
  tray: BlockInstance[];
  score: number;
  combo: number;
  status: GameStatus;
}

export const saveState = (state: PersistedGameState, key = STORAGE_KEY) => {
  if (typeof localStorage === 'undefined') return;
  const payload = JSON.stringify(state);
  localStorage.setItem(key, payload);
};

export const loadState = (key = STORAGE_KEY): PersistedGameState | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedGameState;
  } catch {
    // Corrupt storage, clear and continue.
    localStorage.removeItem(key);
    return null;
  }
};

export const clearState = (key = STORAGE_KEY) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
};
