import { GRID_SIZE, GRID_SIZE_OPTIONS } from '../../styles/theme';

export const LOGICAL_GRID_SIZES = GRID_SIZE_OPTIONS;
export const DEFAULT_GRID_SIZE: number = GRID_SIZE;
export const TRAY_SLOTS = 3;

// Touch offset when dragging so the finger never obscures the piece.
export const TOUCH_OFFSET_PX = 100;
// Distance (in cell units) where a release should auto-snap to the nearest slot.
export const MAGNETIC_SNAP_RADIUS = 0.4;

export type LogicalGridSize = (typeof LOGICAL_GRID_SIZES)[number];
