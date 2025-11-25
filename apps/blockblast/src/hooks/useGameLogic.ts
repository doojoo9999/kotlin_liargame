import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { canPlaceBlock } from '../utils/grid';
import type { BlockInstance } from '../utils/grid';

type GhostState = {
  block: BlockInstance;
  x: number;
  y: number;
  valid: boolean;
};

const clampToGrid = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

export const useGameLogic = () => {
  const grid = useGameStore((state) => state.grid);
  const tray = useGameStore((state) => state.tray);
  const activeBlockId = useGameStore((state) => state.activeBlockId);
  const placeBlock = useGameStore((state) => state.placeBlock);
  const pickBlock = useGameStore((state) => state.pickBlock);
  const refreshTray = useGameStore((state) => state.refreshTray);
  const rotateBlock = useGameStore((state) => state.rotateBlock);
  const reset = useGameStore((state) => state.reset);

  const [ghost, setGhost] = useState<GhostState | null>(null);

  const findBlock = useCallback(
    (blockId: string | null) => tray.find((b) => b.id === blockId) ?? null,
    [tray]
  );

  const previewPlacement = useCallback(
    (blockId: string, x: number, y: number) => {
      const block = findBlock(blockId);
      if (!block) return;
      const valid = canPlaceBlock(grid, block.shape, clampToGrid(x, grid.length), clampToGrid(y, grid.length));
      setGhost({ block, x: clampToGrid(x, grid.length), y: clampToGrid(y, grid.length), valid });
    },
    [findBlock, grid]
  );

  const attemptPlacement = useCallback(
    (blockId: string, x: number, y: number) => {
      const result = placeBlock(blockId, clampToGrid(x, grid.length), clampToGrid(y, grid.length));
      if (result.success) {
        setGhost(null);
      }
      return result;
    },
    [grid.length, placeBlock]
  );

  const clearGhost = useCallback(() => setGhost(null), []);

  useEffect(() => {
    setGhost(null);
  }, [grid]);

  return {
    grid,
    tray,
    activeBlockId,
    ghost,
    pickBlock,
    rotateBlock,
    refreshTray,
    reset,
    previewPlacement,
    attemptPlacement,
    clearGhost,
    findBlock
  };
};

export type { GhostState };
