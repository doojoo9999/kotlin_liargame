import { getShapeCells, type BlockInstance } from '../../utils/grid';
import { GRID_SIZE, PALETTE } from '../../styles/theme';
import { Block } from './Block';

interface TrayProps {
  block: BlockInstance | null;
  usePatterns?: boolean;
  blocked?: boolean;
}

export const Tray = ({ block, usePatterns = false, blocked = false }: TrayProps) => {
  if (!block) return null;
  const cells = getShapeCells(block.shape);
  const width = Math.max(...cells.map(([x]) => x)) + 1;
  const height = Math.max(...cells.map(([, y]) => y)) + 1;

  const SLOT_SIZE = 2.8;
  const PADDED_SIZE = SLOT_SIZE - 0.4;
  const maxDim = Math.max(width, height, 1);
  const scale = PADDED_SIZE / maxDim;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = (SLOT_SIZE - scaledWidth) / 2;
  const offsetZ = (SLOT_SIZE - scaledHeight) / 2;

  const originX = GRID_SIZE / 2 - 1.5;
  const originZ = GRID_SIZE / 2 + 1.1;

  return (
    <group position={[originX, 0, originZ]} raycast={() => null}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <planeGeometry args={[SLOT_SIZE + 0.2, SLOT_SIZE + 0.2]} />
        <meshStandardMaterial color="#0c1327" roughness={0.8} metalness={0.1} />
      </mesh>
      <group position={[-SLOT_SIZE / 2, 0, -SLOT_SIZE / 2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SLOT_SIZE / 2, -0.4, SLOT_SIZE / 2]}>
          <planeGeometry args={[SLOT_SIZE, SLOT_SIZE]} />
          <meshStandardMaterial color="#0f1c36" roughness={0.9} metalness={0.05} />
        </mesh>
        <group position={[offsetX, 0.35, offsetZ]} scale={[scale, scale, scale]}>
          {cells.map(([x, y]) => (
            <Block
              key={`${block.id}-${x}-${y}`}
              position={[x + 0.5, 0.4, y + 0.5]}
              color={blocked ? '#1f2937' : PALETTE[block.color]}
              colorKey={block.color}
              usePattern={usePatterns}
              opacity={blocked ? 0.45 : 1}
            />
          ))}
        </group>
      </group>
    </group>
  );
};
