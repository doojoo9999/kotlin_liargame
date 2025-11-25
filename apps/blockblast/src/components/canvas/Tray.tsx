import { getShapeCells, type BlockInstance } from '../../utils/grid';
import { GRID_SIZE, PALETTE } from '../../styles/theme';
import { Block } from './Block';

interface TrayProps {
  block: BlockInstance | null;
}

export const Tray = ({ block }: TrayProps) => {
  if (!block) return null;
  const cells = getShapeCells(block.shape);
  const width = Math.max(...cells.map(([x]) => x)) + 1;
  const height = Math.max(...cells.map(([, y]) => y)) + 1;

  const originX = GRID_SIZE / 2 + 2;
  const originZ = -3;

  return (
    <group position={[originX, 0, originZ]}>
      <group position={[-width / 2, 0.4, -height / 2]}>
        {cells.map(([x, y]) => (
          <Block key={`${block.id}-${x}-${y}`} position={[x + 0.5, 0.4, y + 0.5]} color={PALETTE[block.color]} />
        ))}
      </group>
    </group>
  );
};
