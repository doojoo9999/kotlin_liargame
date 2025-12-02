import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { PALETTE, GRID_SIZE } from '../../styles/theme';
import { Block } from './Block';
import type { GhostState } from '../../hooks/useGameLogic';
import type { Grid } from '../../utils/grid';

interface BoardProps {
  grid: Grid;
  ghost: GhostState | null;
  showGhost?: boolean;
  onHover?: (cell: { x: number; y: number }) => void;
  onSelect?: (cell: { x: number; y: number }) => void;
  onLeave?: () => void;
  usePatterns?: boolean;
}

const clampToGrid = (value: number) => Math.max(0, Math.min(GRID_SIZE - 1, value));

export const Board = ({ grid, ghost, showGhost = true, onHover, onSelect, onLeave, usePatterns = false }: BoardProps) => {
  const cells = useMemo(() => grid, [grid]);
  const checkerboard = useMemo(() => {
    const result: Array<{ x: number; y: number; color: string }> = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const even = (x + y) % 2 === 0;
        result.push({ x, y, color: even ? '#12243f' : '#0f1c34' });
      }
    }
    return result;
  }, []);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!onHover) return;
    const { x, z } = e.point;
    const cx = clampToGrid(Math.floor(x + GRID_SIZE / 2));
    const cy = clampToGrid(Math.floor(z + GRID_SIZE / 2));
    onHover({ x: cx, y: cy });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
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
    if (!ghost)
      return [] as Array<{ x: number; y: number; color: string; blocked: boolean; opacity: number }>;
    const blockedKeys = new Set(
      ghost.blockedCells
        .filter((cell) => cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE)
        .map((cell) => `${cell.x}-${cell.y}`)
    );

    const offsets: Array<{ x: number; y: number; color: string; blocked: boolean; opacity: number }> = [];
    ghost.block.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const cellX = ghost.x + x;
        const cellY = ghost.y + y;
        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
          const key = `${cellX}-${cellY}`;
          const blocked = blockedKeys.has(key);
          const color = ghost.valid ? '#7cf4e2' : blocked ? '#f87171' : '#fbbf24';
          const opacity = ghost.valid ? 0.35 : blocked ? 0.9 : 0.55;
          offsets.push({ x: cellX, y: cellY, color, blocked, opacity });
        }
      });
    });
    return offsets;
  }, [ghost]);

  const clearedRows = ghost && ghost.valid ? ghost.cleared.rows : [];
  const clearedCols = ghost && ghost.valid ? ghost.cleared.cols : [];
  const ghostElevated = Boolean(ghost && !ghost.valid);
  const ghostHeight = ghostElevated ? 0.9 : 0.45;

  return (
    <group position={[-GRID_SIZE / 2, 0, -GRID_SIZE / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRID_SIZE / 2, -0.55, GRID_SIZE / 2]}>
        <planeGeometry args={[GRID_SIZE + 1.5, GRID_SIZE + 1.5]} />
        <meshStandardMaterial color="#0e1933" metalness={0.12} roughness={0.9} />
      </mesh>

      {checkerboard.map((cell) => (
        <mesh
          key={`bg-${cell.x}-${cell.y}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[cell.x + 0.5, -0.45, cell.y + 0.5]}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color={cell.color} roughness={0.95} metalness={0.05} />
        </mesh>
      ))}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[GRID_SIZE / 2, -0.4, GRID_SIZE / 2]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#152544" metalness={0.08} roughness={0.92} />
      </mesh>

      <gridHelper
        args={[GRID_SIZE, GRID_SIZE, '#3b4f7a', '#2c3f66']}
        position={[GRID_SIZE / 2, -0.39, GRID_SIZE / 2]}
      />

      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <Block
              key={`cell-${x}-${y}`}
              position={[x + 0.5, 0.5, y + 0.5]}
              color={PALETTE[cell]}
              opacity={0.95}
              colorKey={cell}
              usePattern={usePatterns}
            />
          ) : null
        )
      )}

      {showGhost
        ? ghostBlocks.map((cell) => (
            <Block
              key={`ghost-${cell.x}-${cell.y}`}
              position={[cell.x + 0.5, ghostHeight, cell.y + 0.5]}
              color={cell.color}
              opacity={cell.opacity}
              alwaysOnTop={ghostElevated}
            />
          ))
        : null}

      {showGhost && ghost?.valid ? (
        <group>
          {clearedRows.map((row) => (
            <mesh
              key={`row-clear-${row}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[GRID_SIZE / 2, 0.02, row + 0.5]}
              raycast={() => null}
            >
              <planeGeometry args={[GRID_SIZE, 1]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
            </mesh>
          ))}
          {clearedCols.map((col) => (
            <mesh
              key={`col-clear-${col}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[col + 0.5, 0.03, GRID_SIZE / 2]}
              raycast={() => null}
            >
              <planeGeometry args={[1, GRID_SIZE]} />
              <meshBasicMaterial color="#fb923c" transparent opacity={0.45} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
};
