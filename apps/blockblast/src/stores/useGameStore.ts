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
}

const buildInitialState = (): Omit<
  GameState,
  'pickBlock' | 'rotateBlock' | 'placeBlock' | 'refreshTray' | 'reset' | 'toggleMute' | 'toggleLowSpec' | 'toggleHints'
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
  history: []
});

export const useGameStore = create<GameState>((set, get) => ({
  ...buildInitialState(),
  pickBlock: (id) => set(() => ({ activeBlockId: id })),
  rotateBlock: (id) =>
    set((state) => ({
      tray: state.tray.map((block) => (block.id === id ? { ...block, shape: rotateShape(block.shape) } : block))
    })),
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
    const nextStatus = checkGameOver(placement.grid, replenishedTray) ? 'gameover' : 'playing';

    set((prev) => ({
      grid: placement.grid,
      tray: replenishedTray,
      score: prev.score + scoreGained,
      combo: nextCombo,
      comboMax: Math.max(prev.comboMax, nextCombo),
      status: nextStatus,
      activeBlockId: null,
      history: [...prev.history.slice(-9), { grid: placement.grid, score: prev.score + scoreGained }]
    }));

    return {
      success: true,
      cleared: placement.cleared,
      scoreGained,
      gameOver: nextStatus === 'gameover',
      combo: nextCombo,
      linesCleared: clearedLines
    };
  },
  refreshTray: () => set(() => ({ tray: generateTray(), activeBlockId: null, combo: 0 })),
  reset: () =>
    set((state) => ({
      ...buildInitialState(),
      muted: state.muted,
      lowSpec: state.lowSpec,
      showHints: state.showHints
    })),
  toggleMute: (value) => set((state) => ({ muted: value ?? !state.muted })),
  toggleLowSpec: (value) => set((state) => ({ lowSpec: value ?? !state.lowSpec })),
  toggleHints: (value) => set((state) => ({ showHints: value ?? !state.showHints }))
}));

export const useBlocks = () => useGameStore((state) => state.tray);
export const useGrid = () => useGameStore((state) => state.grid);
export const useHUD = () =>
  useGameStore((state) => ({ score: state.score, combo: state.combo, comboMax: state.comboMax, status: state.status }));
export const useAudioPref = () => useGameStore((state) => ({ muted: state.muted, toggleMute: state.toggleMute }));
export const usePreferences = () =>
  useGameStore((state) => ({
    lowSpec: state.lowSpec,
    showHints: state.showHints,
    toggleLowSpec: state.toggleLowSpec,
    toggleHints: state.toggleHints
  }));
export const useBlockLibrary = () => BLOCK_LIBRARY;
