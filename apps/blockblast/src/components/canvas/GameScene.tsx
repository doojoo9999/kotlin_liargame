import { Canvas, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrthographicCamera } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Board } from './Board';
import { Effects } from './Effects';
import type { useGameLogic } from '../../hooks/useGameLogic';
import { ENVIRONMENT, GRID_SIZE } from '../../styles/theme';
import { Tray } from './Tray';
import type { BlockInstance } from '../../utils/grid';

const FixedTopDownCamera = () => {
  const ref = useRef<THREE.OrthographicCamera>(null);
  const { size } = useThree();

  useEffect(() => {
    const cam = ref.current;
    if (!cam) return;
    const aspect = size.width / size.height;
    const margin = 3;
    const halfBoard = GRID_SIZE / 2 + margin;
    const halfHeight = aspect >= 1 ? halfBoard : halfBoard / aspect;
    const halfWidth = aspect >= 1 ? halfBoard * aspect : halfBoard;

    cam.left = -halfWidth;
    cam.right = halfWidth;
    cam.top = halfHeight;
    cam.bottom = -halfHeight;
    cam.position.set(0, 28, 0);
    cam.up.set(0, 0, 1);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [size.height, size.width]);

  return <OrthographicCamera ref={ref} makeDefault near={0.1} far={100} />;
};

interface GameSceneProps {
  width?: number;
  logic: ReturnType<typeof useGameLogic>;
  showGhost?: boolean;
  lowSpec?: boolean;
  trayBlock?: BlockInstance | null;
  usePatterns?: boolean;
  feverLevel?: number;
  paused?: boolean;
}

export const GameScene = ({
  width,
  logic,
  showGhost = true,
  lowSpec = false,
  trayBlock = null,
  usePatterns = false,
  feverLevel = 0,
  paused = false
}: GameSceneProps) => {
  const { grid } = logic;
  const allowInput = !paused;

  return (
    <Canvas
      orthographic
      shadows
      gl={{ antialias: true }}
      style={{ width: '100%', height: width ? `${width}px` : '100%' }}
    >
      <FixedTopDownCamera />
      <color attach="background" args={["#0a1229"]} />
      <ambientLight intensity={ENVIRONMENT.ambientIntensity + 0.1} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={ENVIRONMENT.directionalIntensity + 0.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Suspense fallback={null}>
        <Board
          grid={grid}
          ghost={logic.ghost}
          showGhost={showGhost}
          usePatterns={usePatterns}
          onHover={
            allowInput
              ? (cell) => logic.activeBlockId && logic.previewPlacement(logic.activeBlockId, cell.x, cell.y)
              : undefined
          }
          onSelect={
            allowInput
              ? (cell) => logic.activeBlockId && logic.attemptPlacement(logic.activeBlockId, cell.x, cell.y)
              : undefined
          }
          onLeave={allowInput ? () => logic.clearGhost() : undefined}
        />
        <Effects lowSpec={lowSpec} feverLevel={feverLevel} />
        {!lowSpec ? (
          <ContactShadows position={[0, 0, 0]} opacity={0.3} width={20} height={20} blur={1.6} far={10} />
        ) : null}
        {!lowSpec ? <Environment preset="city" /> : null}
        <Tray
          block={trayBlock}
          usePatterns={usePatterns}
          blocked={trayBlock ? !logic.placeableBlocks.has(trayBlock.id) : false}
        />
      </Suspense>
    </Canvas>
  );
};
