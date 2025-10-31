import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type CellState = 'blank' | 'filled' | 'x';

type GridState = {
  id: string | null;
  width: number;
  height: number;
  cells: CellState[];
  history: CellState[][];
  future: CellState[][];
  lastUpdated: number | null;
};

export type GameMode = 'NORMAL' | 'TIME_ATTACK' | 'MULTIPLAYER';

type GameStore = {
  mode: GameMode;
  timerMs: number;
  combo: number;
  mistakes: number;
  grid: GridState;
  setMode: (mode: GameMode) => void;
  loadGrid: (payload: { id: string; width: number; height: number; cells: CellState[] }) => void;
  updateCell: (index: number, state: CellState) => void;
  undo: () => void;
  redo: () => void;
  recordMistake: () => void;
  reset: () => void;
};

const initialGrid: GridState = {
  id: null,
  width: 0,
  height: 0,
  cells: [],
  history: [],
  future: [],
  lastUpdated: null
};

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    mode: 'NORMAL',
    timerMs: 0,
    combo: 0,
    mistakes: 0,
    grid: initialGrid,
    setMode: (mode) => set({ mode }),
    loadGrid: ({ id, width, height, cells }) =>
      set(() => ({
        grid: {
          id,
          width,
          height,
          cells,
          history: [cells.slice()],
          future: [],
          lastUpdated: Date.now()
        },
        combo: 0,
        mistakes: 0,
        timerMs: 0
      })),
    updateCell: (index, state) =>
      set((draft) => {
        const { grid } = draft;
        if (!grid.cells[index] || grid.cells[index] === state) return;
        grid.history.push([...grid.cells]);
        grid.future = [];
        grid.cells[index] = state;
        grid.lastUpdated = Date.now();
        draft.combo = state === 'filled' ? draft.combo + 1 : 0;
      }),
    undo: () =>
      set((draft) => {
        const { grid } = draft;
        if (grid.history.length <= 1) return;
        const previous = grid.history.at(-2);
        if (!previous) return;
        grid.future.push([...grid.cells]);
        grid.history = grid.history.slice(0, -1);
        grid.cells = [...previous];
      }),
    redo: () =>
      set((draft) => {
        const { grid } = draft;
        const next = grid.future.pop();
        if (!next) return;
        grid.history.push([...next]);
        grid.cells = next;
      }),
    recordMistake: () =>
      set((draft) => {
        draft.mistakes += 1;
        draft.combo = 0;
      }),
    reset: () => set({ grid: initialGrid, combo: 0, mistakes: 0, timerMs: 0 })
  }))
);
