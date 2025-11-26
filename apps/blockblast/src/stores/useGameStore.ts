import { create } from 'zustand';
import {
  BLOCK_LIBRARY,
  canPlaceBlock,
  checkGameOver,
  createEmptyGrid,
  generateTray,
  resolvePlacement,
  rotateShape,
  scorePlacement
} from '../utils/grid';
import type { BlockInstance, Grid } from '../utils/grid';
import { loadState, saveState, type PersistedGameState } from '../game/managers/persistence';

export type SoundTheme = 'classic' | 'jelly' | 'wood' | 'glass';
export type ControlMode = 'standard' | 'offset' | 'auto';

export type GameStatus = 'playing' | 'gameover';

interface GameState {
  grid: Grid;
  tray: BlockInstance[];
  activeBlockId: string | null;
  score: number;
  combo: number;
  comboMax: number;
  status: GameStatus;
  muted: boolean;
  lowSpec: boolean;
  showHints: boolean;
  soundTheme: SoundTheme;
  colorblindMode: boolean;
  controlMode: ControlMode;
  paused: boolean;
  history: Array<{ grid: Grid; score: number }>;
  pickBlock: (id: string | null) => void;
  rotateBlock: (id: string) => void;
  placeBlock: (id: string, x: number, y: number) => {
    success: boolean;
    cleared: { rows: number[]; cols: number[] };
    scoreGained: number;
    gameOver: boolean;
    combo: number;
    linesCleared: number;
  };
  refreshTray: () => void;
  reset: () => void;
  toggleMute: (value?: boolean) => void;
  toggleLowSpec: (value?: boolean) => void;
  toggleHints: (value?: boolean) => void;
  toggleColorblind: (value?: boolean) => void;
  setSoundTheme: (theme: SoundTheme) => void;
  setControlMode: (mode: ControlMode) => void;
  forceGameOver: () => void;
  setPaused: (value: boolean) => void;
}

const buildInitialState = (): Omit<
  GameState,
  | 'pickBlock'
  | 'rotateBlock'
  | 'placeBlock'
  | 'refreshTray'
  | 'reset'
  | 'toggleMute'
  | 'toggleLowSpec'
  | 'toggleHints'
  | 'toggleColorblind'
  | 'setSoundTheme'
  | 'setControlMode'
  | 'forceGameOver'
  | 'setPaused'
> => ({
  grid: createEmptyGrid(),
  tray: generateTray(),
  activeBlockId: null,
  score: 0,
  combo: 0,
  comboMax: 0,
  status: 'playing',
  muted: false,
  lowSpec: false,
  showHints: true,
  soundTheme: 'classic',
  colorblindMode: false,
  controlMode: 'standard',
  paused: false,
  history: []
});

const hydrateFromStorage = (): ReturnType<typeof buildInitialState> => {
  const base = buildInitialState();
  const persisted = loadState();
  if (!persisted) return base;
  const sizeMismatch = persisted.grid && persisted.grid.length !== base.grid.length;
  return {
    ...base,
    grid: sizeMismatch ? base.grid : persisted.grid ?? base.grid,
    tray: sizeMismatch ? base.tray : persisted.tray?.length ? persisted.tray : base.tray,
    score: persisted.score ?? base.score,
    combo: persisted.combo ?? base.combo,
    status: persisted.status ?? base.status
  };
};

const persistSnapshot = (state: PersistedGameState) => {
  saveState({
    grid: state.grid,
    tray: state.tray,
    score: state.score,
    combo: state.combo,
    status: state.status
  });
};

export const useGameStore = create<GameState>((set, get) => ({
  ...hydrateFromStorage(),
  pickBlock: (id) => set(() => ({ activeBlockId: id })),
  rotateBlock: (id) =>
    set((state) => {
      const updates: Partial<GameState> = {
        tray: state.tray.map((block) => (block.id === id ? { ...block, shape: rotateShape(block.shape) } : block))
      };
      persistSnapshot({
        grid: state.grid,
        tray: updates.tray ?? state.tray,
        score: state.score,
        combo: state.combo,
        status: state.status
      });
      return updates;
    }),
  placeBlock: (id, x, y) => {
    const state = get();
    const target = state.tray.find((block) => block.id === id);
    if (!target)
      return {
        success: false,
        cleared: { rows: [], cols: [] },
        scoreGained: 0,
        gameOver: false,
        combo: state.combo,
        linesCleared: 0
      };

    if (!canPlaceBlock(state.grid, target.shape, x, y)) {
      return {
        success: false,
        cleared: { rows: [], cols: [] },
        scoreGained: 0,
        gameOver: false,
        combo: state.combo,
        linesCleared: 0
      };
    }

    const placement = resolvePlacement(state.grid, target.shape, x, y, target.color);
    const clearedLines = placement.cleared.rows.length + placement.cleared.cols.length;
    const nextCombo = clearedLines > 0 ? state.combo + 1 : 0;
    const scoreGained = scorePlacement(placement.placedCells, placement.cleared, nextCombo || 1);

    const remainingTray = state.tray.filter((block) => block.id !== id);
    const replenishedTray = remainingTray.length ? remainingTray : generateTray();
    const nextStatus: GameStatus = checkGameOver(placement.grid, replenishedTray) ? 'gameover' : 'playing';

    set((prev) => {
      const nextScore = prev.score + scoreGained;
      const updates: Partial<GameState> = {
        grid: placement.grid,
        tray: replenishedTray,
        score: nextScore,
        combo: nextCombo,
        comboMax: Math.max(prev.comboMax, nextCombo),
        status: nextStatus,
        activeBlockId: null,
        history: [...prev.history.slice(-9), { grid: placement.grid, score: nextScore }]
      };
      persistSnapshot({
        grid: placement.grid,
        tray: replenishedTray,
        score: nextScore,
        combo: nextCombo,
        status: nextStatus
      });
      return updates;
    });

    return {
      success: true,
      cleared: placement.cleared,
      scoreGained,
      gameOver: nextStatus === 'gameover',
      combo: nextCombo,
      linesCleared: clearedLines
    };
  },
  refreshTray: () =>
    set((state) => {
      const updates: Partial<GameState> = { tray: generateTray(), activeBlockId: null, combo: 0 };
      persistSnapshot({
        grid: state.grid,
        tray: updates.tray ?? state.tray,
        score: state.score,
        combo: updates.combo ?? state.combo,
        status: state.status
      });
      return updates;
    }),
  reset: () =>
    set((state) => {
      const next: Partial<GameState> = {
        ...buildInitialState(),
        muted: state.muted,
        lowSpec: state.lowSpec,
        showHints: state.showHints,
        soundTheme: state.soundTheme,
        colorblindMode: state.colorblindMode,
        controlMode: state.controlMode,
        setPaused: state.setPaused
      };
      persistSnapshot({
        grid: next.grid ?? state.grid,
        tray: next.tray ?? state.tray,
        score: next.score ?? 0,
        combo: next.combo ?? 0,
        status: next.status ?? 'playing'
      });
      return next;
    }),
  toggleMute: (value) => set((state) => ({ muted: value ?? !state.muted })),
  toggleLowSpec: (value) => set((state) => ({ lowSpec: value ?? !state.lowSpec })),
  toggleHints: (value) => set((state) => ({ showHints: value ?? !state.showHints })),
  toggleColorblind: (value) => set((state) => ({ colorblindMode: value ?? !state.colorblindMode })),
  setSoundTheme: (theme) => set(() => ({ soundTheme: theme })),
  setControlMode: (mode) => set(() => ({ controlMode: mode })),
  forceGameOver: () =>
    set((state) => {
      if (state.status === 'gameover') return state;
      const updates: Partial<GameState> = { status: 'gameover', activeBlockId: null };
      persistSnapshot({
        grid: state.grid,
        tray: state.tray,
        score: state.score,
        combo: state.combo,
        status: 'gameover'
      });
      return updates;
    }),
  setPaused: (value) => set(() => ({ paused: value }))
}));

export const useBlocks = () => useGameStore((state) => state.tray);
export const useGrid = () => useGameStore((state) => state.grid);
export const useHUD = () =>
  useGameStore((state) => ({ score: state.score, combo: state.combo, comboMax: state.comboMax, status: state.status }));
export const useAudioPref = () =>
  useGameStore((state) => ({
    muted: state.muted,
    toggleMute: state.toggleMute,
    soundTheme: state.soundTheme,
    setSoundTheme: state.setSoundTheme
  }));
export const usePreferences = () =>
  useGameStore((state) => ({
    lowSpec: state.lowSpec,
    showHints: state.showHints,
    colorblindMode: state.colorblindMode,
    controlMode: state.controlMode,
    toggleLowSpec: state.toggleLowSpec,
    toggleHints: state.toggleHints,
    toggleColorblind: state.toggleColorblind,
    setControlMode: state.setControlMode
  }));
export const useBlockLibrary = () => BLOCK_LIBRARY;
