import { describe, expect, it } from 'vitest';
import { applyPlacement, canPlaceBlock, createEmptyGrid, resolvePlacement, rotateShape } from './grid';
import { GRID_SIZE } from '../styles/theme';

describe('grid helpers', () => {
  it(`creates an empty ${GRID_SIZE}x${GRID_SIZE} grid by default`, () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(GRID_SIZE);
    expect(grid.every((row) => row.every((cell) => cell === null))).toBe(true);
  });

  it('validates placement and collision', () => {
    const grid = createEmptyGrid(4);
    const shape = [
      [1, 1],
      [1, 0]
    ];

    expect(canPlaceBlock(grid, shape, 0, 0)).toBe(true);
    const withBlock = applyPlacement(grid, shape, 0, 0, 'red');
    expect(canPlaceBlock(withBlock, shape, 0, 0)).toBe(false);
    expect(canPlaceBlock(withBlock, shape, 3, 3)).toBe(false); // out of bounds
  });

  it('rotates shapes clockwise', () => {
    const shape = [
      [1, 0],
      [1, 0],
      [1, 1]
    ];
    const rotated = rotateShape(shape);
    expect(rotated).toEqual([
      [1, 1, 1],
      [1, 0, 0]
    ]);
  });

  it('clears completed rows and columns when placing', () => {
    const grid = createEmptyGrid(4);
    const lineShape = [[1, 1, 1, 1]];
    const placement = resolvePlacement(grid, lineShape, 0, 1, 'blue');

    expect(placement.cleared.rows).toContain(1);
    expect(placement.grid[1].every((cell) => cell === null)).toBe(true);
  });
});
