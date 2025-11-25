import { useDrag } from '@use-gesture/react';
import { useCallback } from 'react';
import { GRID_SIZE } from '../styles/theme';

export interface DragHandlers {
  onMove?: (cell: { x: number; y: number }) => void;
  onRelease?: (cell: { x: number; y: number }) => void;
}

const clamp = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

export const useDragDrop = ({ onMove, onRelease }: DragHandlers) => {
  const toCell = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
    const bounds = target.getBoundingClientRect();
    const normalizedX = ((clientX - bounds.left) / bounds.width) * GRID_SIZE;
    const normalizedY = ((clientY - bounds.top) / bounds.height) * GRID_SIZE;
    return {
      x: clamp(Math.floor(normalizedX), GRID_SIZE),
      y: clamp(Math.floor(normalizedY), GRID_SIZE)
    };
  }, []);

  return useDrag(
    ({ event, active, xy: [clientX, clientY] }) => {
      if (!(event.target instanceof HTMLElement)) return;
      const cell = toCell(clientX, clientY, event.target);
      if (active) {
        onMove?.(cell);
      } else {
        onRelease?.(cell);
      }
    },
    { filterTaps: true }
  );
};
