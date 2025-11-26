import { useDrag } from '@use-gesture/react';
import { useCallback } from 'react';
import { GRID_SIZE } from '../styles/theme';

export interface DragHandlers {
  onMove?: (cell: { x: number; y: number }) => void;
  onRelease?: (cell: { x: number; y: number }) => void;
}

export type ControlMode = 'standard' | 'offset' | 'auto';

const clamp = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

export const useDragDrop = ({ onMove, onRelease, controlMode = 'standard' }: DragHandlers & { controlMode?: ControlMode }) => {
  const toCell = useCallback((clientX: number, clientY: number, target: HTMLElement, velocity = 0, pointerType?: string) => {
    const bounds = target.getBoundingClientRect();
    const normalizedX = ((clientX - bounds.left) / bounds.width) * GRID_SIZE;
    const normalizedY = ((clientY - bounds.top) / bounds.height) * GRID_SIZE;
    const offset = controlMode === 'offset' ? 1 : controlMode === 'auto' ? Math.min(2, Math.round(velocity * 1.2)) : 0;
    const touchLift = pointerType === 'touch' ? 0.6 : 0;
    return {
      x: clamp(Math.floor(normalizedX), GRID_SIZE),
      y: clamp(Math.floor(normalizedY - offset - touchLift), GRID_SIZE)
    };
  }, [controlMode]);

  return useDrag(
    ({ event, active, xy: [clientX, clientY], velocity: gestureVelocity }: any) => {
      if (!(event.target instanceof HTMLElement)) return;
      const speed = Array.isArray(gestureVelocity)
        ? Math.min(3, Math.hypot(gestureVelocity[0] ?? 0, gestureVelocity[1] ?? 0))
        : Math.min(3, gestureVelocity ?? 0);
      const cell = toCell(clientX, clientY, event.target, speed, (event as PointerEvent).pointerType);
      if (active) {
        onMove?.(cell);
      } else {
        onRelease?.(cell);
      }
    },
    { filterTaps: true }
  );
};
