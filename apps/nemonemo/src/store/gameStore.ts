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

type SessionState = {
  playId: string | null;
  stateToken: string | null;
  expiresAt: string | null;
};

type GameStore = {
  mode: GameMode;
  timerMs: number;
  combo: number;
  mistakes: number;
  hintsUsed: number;
  grid: GridState;
  session: SessionState;
  setMode: (mode: GameMode) => void;
  loadGrid: (payload: { id: string; width: number; height: number; cells: CellState[] }) => void;
  updateCell: (index: number, state: CellState) => void;
  undo: () => void;
  redo: () => void;
  recordMistake: () => void;
  recordHint: () => void;
  setSession: (payload: { playId: string; stateToken: string; expiresAt: string }) => void;
  clearSession: () => void;
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

const createInitialSession = (): SessionState => ({
  playId: null,
  stateToken: null,
  expiresAt: null
});

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    mode: 'NORMAL',
    timerMs: 0,
    combo: 0,
    mistakes: 0,
    hintsUsed: 0,
    grid: initialGrid,
    session: createInitialSession(),
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
        hintsUsed: 0,
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
        grid.lastUpdated = Date.now();
      }),
    redo: () =>
      set((draft) => {
        const { grid } = draft;
        const next = grid.future.pop();
        if (!next) return;
        grid.history.push([...next]);
        grid.cells = [...next];
        grid.lastUpdated = Date.now();
      }),
    recordMistake: () =>
      set((draft) => {
        draft.mistakes += 1;
        draft.combo = 0;
      }),
    recordHint: () =>
      set((draft) => {
        draft.hintsUsed += 1;
      }),
    setSession: ({ playId, stateToken, expiresAt }) =>
      set((draft) => {
        draft.session.playId = playId;
        draft.session.stateToken = stateToken;
        draft.session.expiresAt = expiresAt;
      }),
    clearSession: () =>
      set((draft) => {
        draft.session = createInitialSession();
      }),
    reset: () =>
      set(() => ({
        grid: initialGrid,
        combo: 0,
        mistakes: 0,
        hintsUsed: 0,
        timerMs: 0,
        session: createInitialSession()
      }))
  }))
);
