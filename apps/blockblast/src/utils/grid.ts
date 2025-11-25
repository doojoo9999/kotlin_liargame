import { GRID_SIZE, PALETTE } from '../styles/theme';
import type { ThemeColorKey } from '../styles/theme';

export type GridCell = ThemeColorKey | null;
export type Grid = GridCell[][];
export type Shape = number[][];

export interface BlockTemplate {
  name: string;
  shape: Shape;
}

export interface BlockInstance {
  id: string;
  shape: Shape;
  color: ThemeColorKey;
}

export interface PlacementResult {
  grid: Grid;
  cleared: {
    rows: number[];
    cols: number[];
  };
  placedCells: number;
}

const paletteKeys = Object.keys(PALETTE) as ThemeColorKey[];

const SHAPES: BlockTemplate[] = [
  { name: 'single', shape: [[1]] },
  { name: 'domino', shape: [[1, 1]] },
  { name: 'triplet', shape: [[1, 1, 1]] },
  { name: 'quad', shape: [[1, 1, 1, 1]] },
  { name: 'L', shape: [[1, 0], [1, 0], [1, 1]] },
  { name: 'reverse-L', shape: [[0, 1], [0, 1], [1, 1]] },
  { name: 'T', shape: [[1, 1, 1], [0, 1, 0]] },
  { name: 'square', shape: [[1, 1], [1, 1]] },
  { name: 'zig', shape: [[1, 1, 0], [0, 1, 1]] },
  { name: 'zag', shape: [[0, 1, 1], [1, 1, 0]] },
  { name: 'pillar', shape: [[1], [1], [1], [1]] },
  { name: 'plus', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] }
];

const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

export const createEmptyGrid = (size = GRID_SIZE): Grid =>
  Array.from({ length: size }, () => Array<GridCell>(size).fill(null));

export const trimShape = (shape: Shape): Shape => {
  const rows = shape.length;
  const cols = shape[0]?.length ?? 0;

  let top = 0;
  while (top < rows && shape[top].every((v) => v === 0)) top += 1;

  let bottom = rows - 1;
  while (bottom >= top && shape[bottom].every((v) => v === 0)) bottom -= 1;

  let left = 0;
  while (left < cols && shape.every((row) => row[left] === 0)) left += 1;

  let right = cols - 1;
  while (right >= left && shape.every((row) => row[right] === 0)) right -= 1;

  const trimmed: Shape = [];
  for (let y = top; y <= bottom; y += 1) {
    trimmed.push(shape[y].slice(left, right + 1));
  }
  return trimmed;
};

export const rotateShape = (shape: Shape): Shape => {
  if (!shape.length) return shape;
  const rows = shape.length;
  const cols = shape[0].length;

  const rotated: Shape = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      rotated[x][rows - 1 - y] = shape[y][x];
    }
  }
  return trimShape(rotated);
};

export const getShapeCells = (shape: Shape) => {
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (shape[y][x]) cells.push([x, y]);
    }
  }
  return cells;
};

export const canPlaceBlock = (grid: Grid, shape: Shape, originX: number, originY: number): boolean => {
  const cells = getShapeCells(shape);
  const size = grid.length;

  return cells.every(([dx, dy]) => {
    const x = originX + dx;
    const y = originY + dy;
    return x >= 0 && x < size && y >= 0 && y < size && !grid[y][x];
  });
};

export const applyPlacement = (
  grid: Grid,
  shape: Shape,
  originX: number,
  originY: number,
  color: ThemeColorKey
): Grid => {
  const next = cloneGrid(grid);
  const cells = getShapeCells(shape);

  cells.forEach(([dx, dy]) => {
    const x = originX + dx;
    const y = originY + dy;
    if (next[y]?.[x] !== undefined) {
      next[y][x] = color;
    }
  });
  return next;
};

export const findCompletedLines = (grid: Grid) => {
  const size = grid.length;
  const rows: number[] = [];
  const cols: number[] = [];

  for (let y = 0; y < size; y += 1) {
    if (grid[y].every((cell) => Boolean(cell))) rows.push(y);
  }

  for (let x = 0; x < size; x += 1) {
    let filled = true;
    for (let y = 0; y < size; y += 1) {
      if (!grid[y][x]) {
        filled = false;
        break;
      }
    }
    if (filled) cols.push(x);
  }

  return { rows, cols };
};

export const clearLines = (grid: Grid, lines: { rows: number[]; cols: number[] }): Grid => {
  const next = cloneGrid(grid);

  lines.rows.forEach((row) => {
    next[row] = next[row].map(() => null);
  });

  lines.cols.forEach((col) => {
    for (let y = 0; y < next.length; y += 1) {
      next[y][col] = null;
    }
  });

  return next;
};

export const resolvePlacement = (
  grid: Grid,
  shape: Shape,
  originX: number,
  originY: number,
  color: ThemeColorKey
): PlacementResult => {
  const withBlock = applyPlacement(grid, shape, originX, originY, color);
  const cleared = findCompletedLines(withBlock);
  const cleaned = clearLines(withBlock, cleared);
  return {
    grid: cleaned,
    cleared,
    placedCells: getShapeCells(shape).length
  };
};

export const generateBlock = (): BlockInstance => {
  const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    shape: trimShape(template.shape),
    color
  };
};

export const generateTray = (count = 3): BlockInstance[] =>
  Array.from({ length: count }, () => generateBlock());

export const checkGameOver = (grid: Grid, tray: BlockInstance[]): boolean => {
  const size = grid.length;
  for (const block of tray) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (canPlaceBlock(grid, block.shape, x, y)) return false;
      }
    }
  }
  return true;
};

export const scorePlacement = (placedCells: number, cleared: { rows: number[]; cols: number[] }, combo: number) => {
  const linesCleared = cleared.rows.length + cleared.cols.length;
  const base = placedCells * 10;
  const clearBonus = linesCleared * 120;
  const comboBonus = combo > 1 ? Math.floor(clearBonus * 0.25 * (combo - 1)) : 0;
  return base + clearBonus + comboBonus;
};

export const BLOCK_LIBRARY = SHAPES;

export const countAvailablePlacements = (grid: Grid, tray: BlockInstance[], stopAfter = Infinity): number => {
  let count = 0;
  const size = grid.length;
  for (const block of tray) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (canPlaceBlock(grid, block.shape, x, y)) {
          count += 1;
          if (count >= stopAfter) return count;
        }
      }
    }
  }
  return count;
};

export const countFilledCells = (grid: Grid): number =>
  grid.reduce((rowAcc, row) => rowAcc + row.reduce((acc, cell) => acc + (cell ? 1 : 0), 0), 0);
