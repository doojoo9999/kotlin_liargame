import { useDrag } from '@use-gesture/react';
import type { Handler } from '@use-gesture/core/types';
import { useCallback, type RefObject } from 'react';
import { GRID_SIZE } from '../styles/theme';
import {
  magnetizeToGrid,
  normalizePointerToCell,
  TOUCH_OFFSET_PX,
  type PointerKind
} from '../game/managers/input';

export interface DragHandlers {
  onStart?: (cell: { x: number; y: number; inside?: boolean }, args: unknown[]) => void;
  onMove?: (cell: { x: number; y: number; inside?: boolean }, args: unknown[]) => void;
  onRelease?: (cell: { x: number; y: number; inside?: boolean }, args: unknown[]) => void;
}

export type ControlMode = 'standard' | 'offset' | 'auto';

const clamp = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

const CAMERA_MARGIN = 3; // matches FixedTopDownCamera margin in GameScene

export const useDragDrop = ({
  onStart,
  onMove,
  onRelease,
  controlMode = 'standard',
  gridSize = GRID_SIZE,
  enabled = true,
  boundsRef,
  invertX = false,
  invertY = false
}: DragHandlers & {
  controlMode?: ControlMode;
  gridSize?: number;
  enabled?: boolean;
  boundsRef?: RefObject<HTMLElement | null>;
  invertX?: boolean;
  invertY?: boolean;
}) => {
  const toCell = useCallback(
    (
      clientX: number,
      clientY: number,
      target: HTMLElement,
      velocity: number | [number, number] = 0,
      pointerType?: PointerKind
    ) => {
      const bounds = boundsRef?.current?.getBoundingClientRect() ?? target.getBoundingClientRect();
      const speed = Array.isArray(velocity)
        ? Math.min(3, Math.hypot(velocity[0] ?? 0, velocity[1] ?? 0))
        : Math.min(3, velocity ?? 0);
      const wantsOffset = pointerType === 'touch' && (controlMode === 'offset' || controlMode === 'auto');
      const offsetPx = wantsOffset
        ? controlMode === 'auto'
          ? Math.min(TOUCH_OFFSET_PX * 1.4, TOUCH_OFFSET_PX * (0.6 + speed * 0.35))
          : TOUCH_OFFSET_PX
        : 0;

      // Board is smaller than the full orthographic view; shrink bounds to the visible board square.
      const aspect = bounds.width / (bounds.height || 1);
      const boardSpan = gridSize + CAMERA_MARGIN * 2;
      const viewWidth = aspect >= 1 ? boardSpan * aspect : boardSpan;
      const viewHeight = aspect >= 1 ? boardSpan : boardSpan / aspect;
      const boardFracX = gridSize / viewWidth;
      const boardFracY = gridSize / viewHeight;

      const effectiveWidth = bounds.width * boardFracX;
      const effectiveHeight = bounds.height * boardFracY;
      const insetX = (bounds.width - effectiveWidth) / 2;
      const insetY = (bounds.height - effectiveHeight) / 2;
      const adjustedBounds: DOMRectReadOnly = {
        width: effectiveWidth,
        height: effectiveHeight,
        left: bounds.left + insetX,
        top: bounds.top + insetY,
        right: bounds.left + insetX + effectiveWidth,
        bottom: bounds.top + insetY + effectiveHeight,
        x: bounds.left + insetX,
        y: bounds.top + insetY,
        toJSON: () => ({})
      };

      const inside =
        clientX >= adjustedBounds.left &&
        clientX <= adjustedBounds.right &&
        clientY >= adjustedBounds.top &&
        clientY <= adjustedBounds.bottom;

      const normalized = normalizePointerToCell({
        clientX,
        clientY,
        bounds: adjustedBounds,
        pointerType,
        gridSize,
        offsetPx
      });

      // Apply magnetic snap near cell centers.
      const snapped = magnetizeToGrid(normalized.fractional, gridSize);

      const mappedX = invertX ? gridSize - 1 - snapped.x : snapped.x;
      const mappedY = invertY ? gridSize - 1 - snapped.y : snapped.y;

      return {
        inside,
        x: clamp(mappedX, gridSize),
        y: clamp(mappedY, gridSize)
      };
    },
    [boundsRef, controlMode, gridSize, invertX, invertY]
  );

  const handleDrag: Handler<'drag', PointerEvent> = (state) => {
    const { event, active, first, last, args, xy: [clientX, clientY], velocity: gestureVelocity } = state;
    if (!(event.target instanceof HTMLElement)) return;
    const referenceTarget = boundsRef?.current ?? event.target;
    const cell = toCell(
      clientX,
      clientY,
      referenceTarget,
      gestureVelocity as [number, number],
      (event as PointerEvent).pointerType as PointerKind
    );
    const argList = (args as unknown[]) ?? [];
    if (first) {
      onStart?.(cell, argList);
    }
    if (active) {
      if (cell.inside) {
        onMove?.(cell, argList);
      }
    }
    if (!active || last) {
      if (cell.inside) {
        onRelease?.(cell, argList);
      }
    }
  };

  return useDrag(handleDrag, { filterTaps: true, enabled });
};
