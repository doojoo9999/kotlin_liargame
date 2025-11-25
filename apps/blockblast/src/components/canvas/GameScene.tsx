import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import { Board } from './Board';
import { Effects } from './Effects';
import type { useGameLogic } from '../../hooks/useGameLogic';
import { CAMERA_CONFIG, ENVIRONMENT } from '../../styles/theme';
import { Tray } from './Tray';
import type { BlockInstance } from '../../utils/grid';

interface GameSceneProps {
  width?: number;
  logic: ReturnType<typeof useGameLogic>;
  showGhost?: boolean;
  lowSpec?: boolean;
  trayBlock?: BlockInstance | null;
}

export const GameScene = ({ width, logic, showGhost = true, lowSpec = false, trayBlock = null }: GameSceneProps) => {
  const { grid } = logic;

  return (
    <Canvas
      camera={{ position: [...CAMERA_CONFIG.position], fov: CAMERA_CONFIG.fov }}
      shadows
      gl={{ antialias: true }}
      style={{ width: '100%', height: width ? `${width}px` : '100%' }}
    >
      <color attach="background" args={["#0b1021"]} />
      <ambientLight intensity={ENVIRONMENT.ambientIntensity} />
      <directionalLight
        position={[10, 12, 8]}
        intensity={ENVIRONMENT.directionalIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Suspense fallback={null}>
        <Board
          grid={grid}
          ghost={logic.ghost}
          showGhost={showGhost}
          onHover={(cell) => logic.activeBlockId && logic.previewPlacement(logic.activeBlockId, cell.x, cell.y)}
          onSelect={(cell) => logic.activeBlockId && logic.attemptPlacement(logic.activeBlockId, cell.x, cell.y)}
          onLeave={() => logic.clearGhost()}
        />
        <Effects lowSpec={lowSpec} />
        {!lowSpec ? (
          <ContactShadows position={[0, 0, 0]} opacity={0.3} width={20} height={20} blur={1.6} far={10} />
        ) : null}
        {!lowSpec ? <Environment preset="city" /> : null}
        <Tray block={trayBlock} />
      </Suspense>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={26} />
    </Canvas>
  );
};
