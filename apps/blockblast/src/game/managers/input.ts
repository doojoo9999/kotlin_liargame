import { DEFAULT_GRID_SIZE, MAGNETIC_SNAP_RADIUS, TOUCH_OFFSET_PX } from '../core/config';
export { TOUCH_OFFSET_PX } from '../core/config';

const clampToGrid = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

export type PointerKind = 'mouse' | 'touch' | 'pen' | undefined;

export interface PointerSnapshot {
  clientX: number;
  clientY: number;
  bounds: DOMRectReadOnly;
  pointerType?: PointerKind;
  gridSize?: number;
  offsetPx?: number;
}

export interface NormalizedPointer {
  fractional: { x: number; y: number };
  cell: { x: number; y: number };
}

// Normalizes mouse/touch input into fractional grid coordinates and a snapped cell.
export const normalizePointerToCell = ({
  clientX,
  clientY,
  bounds,
  pointerType,
  gridSize = DEFAULT_GRID_SIZE,
  offsetPx = TOUCH_OFFSET_PX
}: PointerSnapshot): NormalizedPointer => {
  const width = bounds.width || 1;
  const height = bounds.height || 1;
  const cellHeight = height / gridSize || 1;
  const offsetCells = pointerType === 'touch' ? offsetPx / cellHeight : 0;

  const fractionalX = ((clientX - bounds.left) / width) * gridSize;
  const fractionalY = ((clientY - bounds.top) / height) * gridSize - offsetCells;

  return {
    fractional: { x: fractionalX, y: fractionalY },
    cell: magnetizeToGrid({ x: fractionalX, y: fractionalY }, gridSize)
  };
};

// Applies a magnetic snap to the nearest integer cell when close enough.
export const magnetizeToGrid = (
  point: { x: number; y: number },
  gridSize: number = DEFAULT_GRID_SIZE,
  radius = MAGNETIC_SNAP_RADIUS
) => {
  const nearestX = Math.round(point.x);
  const nearestY = Math.round(point.y);
  const distance = Math.hypot(point.x - nearestX, point.y - nearestY);

  if (distance <= radius) {
    return {
      x: clampToGrid(nearestX, gridSize),
      y: clampToGrid(nearestY, gridSize)
    };
  }

  return {
    x: clampToGrid(Math.floor(point.x), gridSize),
    y: clampToGrid(Math.floor(point.y), gridSize)
  };
};
