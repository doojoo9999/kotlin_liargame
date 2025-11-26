export const GRID_SIZE_OPTIONS = [8, 10] as const;
export const GRID_SIZE = GRID_SIZE_OPTIONS[1];
export const CELL_SIZE = 1;

export const PALETTE = {
  red: '#ff6b6b',
  orange: '#ff9f43',
  yellow: '#ffd166',
  green: '#63e6be',
  blue: '#74c0fc',
  purple: '#b197fc',
  pink: '#f783ac'
};

export const BOARD_BOUNDS = {
  width: GRID_SIZE * CELL_SIZE,
  height: GRID_SIZE * CELL_SIZE,
  depth: 0.5
};

export const CAMERA_CONFIG = {
  position: [0, 28, 0] as const,
  fov: 25
};

export const ENVIRONMENT = {
  ambientIntensity: 0.8,
  directionalIntensity: 0.7,
  rimIntensity: 0.35
};

export type ThemeColorKey = keyof typeof PALETTE;
