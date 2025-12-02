import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { canPlaceBlock, getShapeCells, hasPlacementForShape, resolvePlacement } from '../utils/grid';
import type { BlockInstance } from '../utils/grid';

type GhostBlockedCell = {
  x: number;
  y: number;
  reason: 'occupied' | 'out-of-bounds';
};

type GhostState = {
  block: BlockInstance;
  x: number;
  y: number;
  valid: boolean;
  blockedCells: GhostBlockedCell[];
  cleared: { rows: number[]; cols: number[] };
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
  const forceGameOver = useGameStore((state) => state.forceGameOver);

  const [ghost, setGhost] = useState<GhostState | null>(null);

  const findBlock = useCallback(
    (blockId: string | null) => tray.find((b) => b.id === blockId) ?? null,
    [tray]
  );

  const placeableBlocks = useMemo(() => {
    const playable = new Set<string>();
    tray.forEach((block) => {
      if (hasPlacementForShape(grid, block.shape)) {
        playable.add(block.id);
      }
    });
    return playable;
  }, [grid, tray]);

  const previewPlacement = useCallback(
    (blockId: string, x: number, y: number) => {
      const block = findBlock(blockId);
      if (!block) return;
      const gx = clampToGrid(x, grid.length);
      const gy = clampToGrid(y, grid.length);
      const blockedCells: GhostBlockedCell[] = [];

      getShapeCells(block.shape).forEach(([dx, dy]) => {
        const cellX = gx + dx;
        const cellY = gy + dy;
        const outOfBounds = cellX < 0 || cellX >= grid.length || cellY < 0 || cellY >= grid.length;
        if (outOfBounds) {
          blockedCells.push({ x: cellX, y: cellY, reason: 'out-of-bounds' });
        } else if (grid[cellY]?.[cellX]) {
          blockedCells.push({ x: cellX, y: cellY, reason: 'occupied' });
        }
      });

      const valid = blockedCells.length === 0 && canPlaceBlock(grid, block.shape, gx, gy);
      const cleared = valid ? resolvePlacement(grid, block.shape, gx, gy, block.color).cleared : { rows: [], cols: [] };
      setGhost({ block, x: gx, y: gy, valid, blockedCells, cleared });
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

  useEffect(() => {
    if (!tray.length) return;
    if (placeableBlocks.size === 0) {
      forceGameOver();
    }
  }, [forceGameOver, placeableBlocks.size, tray.length]);

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
    findBlock,
    placeableBlocks
  };
};

export type { GhostState, GhostBlockedCell };
