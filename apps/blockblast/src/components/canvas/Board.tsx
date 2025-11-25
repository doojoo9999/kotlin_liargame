import { Grid } from '../../utils/grid';
import { PALETTE, GRID_SIZE } from '../../styles/theme';
import { Block } from './Block';
import type { GhostState } from '../../hooks/useGameLogic';
import { useMemo } from 'react';

interface BoardProps {
  grid: Grid;
  ghost: GhostState | null;
  showGhost?: boolean;
  onHover?: (cell: { x: number; y: number }) => void;
  onSelect?: (cell: { x: number; y: number }) => void;
  onLeave?: () => void;
}

const clampToGrid = (value: number) => Math.max(0, Math.min(GRID_SIZE - 1, value));

export const Board = ({ grid, ghost, showGhost = true, onHover, onSelect, onLeave }: BoardProps) => {
  const cells = useMemo(() => grid, [grid]);

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    if (!onHover) return;
    const { x, z } = e.point;
    const cx = clampToGrid(Math.floor(x + GRID_SIZE / 2));
    const cy = clampToGrid(Math.floor(z + GRID_SIZE / 2));
    onHover({ x: cx, y: cy });
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!onSelect) return;
    const { x, z } = e.point;
    const cx = clampToGrid(Math.floor(x + GRID_SIZE / 2));
    const cy = clampToGrid(Math.floor(z + GRID_SIZE / 2));
    onSelect({ x: cx, y: cy });
  };

  const handlePointerLeave = () => {
    onLeave?.();
  };

  const ghostBlocks = useMemo(() => {
    if (!ghost) return [] as Array<{ x: number; y: number; color: string }>;
    const offsets: Array<{ x: number; y: number; color: string }> = [];
    ghost.block.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const cellX = ghost.x + x;
        const cellY = ghost.y + y;
        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
          offsets.push({ x: cellX, y: cellY, color: ghost.valid ? '#63e6be' : '#f87171' });
        }
      });
    });
    return offsets;
  }, [ghost]);

  return (
    <group position={[-GRID_SIZE / 2, 0, -GRID_SIZE / 2]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[GRID_SIZE / 2, -0.4, GRID_SIZE / 2]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#0e162c" metalness={0.1} roughness={0.9} />
      </mesh>

      <gridHelper args={[GRID_SIZE, GRID_SIZE, '#1f2b4a', '#1f2b4a']} position={[GRID_SIZE / 2, -0.39, GRID_SIZE / 2]} />

      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <Block
              key={`cell-${x}-${y}`}
              position={[x + 0.5, 0.5, y + 0.5]}
              color={PALETTE[cell]}
              opacity={0.95}
            />
          ) : null
        )
      )}

      {showGhost
        ? ghostBlocks.map((cell) => (
            <Block
              key={`ghost-${cell.x}-${cell.y}`}
              position={[cell.x + 0.5, 0.45, cell.y + 0.5]}
              color={cell.color}
              opacity={0.35}
            />
          ))
        : null}
    </group>
  );
};
