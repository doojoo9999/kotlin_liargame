import { Edges, RoundedBox } from '@react-three/drei';
import { Color, Texture } from 'three';
import { useMemo } from 'react';
import { PATTERN_BY_COLOR, buildPatternTexture } from '../../utils/patternTexture';
import type { ThemeColorKey } from '../../styles/theme';

interface BlockProps {
  position: [number, number, number];
  color: string;
  opacity?: number;
  emissive?: string;
  colorKey?: ThemeColorKey;
  usePattern?: boolean;
}

export const Block = ({ position, color, opacity = 1, emissive, colorKey, usePattern = false }: BlockProps) => {
  const physicalColor = useMemo(() => new Color(color), [color]);
  const glow = emissive ? new Color(emissive) : physicalColor.clone().multiplyScalar(0.35);
  const edgeColor = useMemo(() => physicalColor.clone().multiplyScalar(0.6).getStyle(), [physicalColor]);
  const texture: Texture | null = useMemo(() => {
    if (!usePattern || !colorKey) return null;
    const pattern = PATTERN_BY_COLOR[colorKey] ?? 'stripes';
    return buildPatternTexture(color, pattern);
  }, [color, colorKey, usePattern]);

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.2 * opacity} />
      </mesh>
      <RoundedBox args={[0.92, 0.92, 0.92]} radius={0.2} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={physicalColor}
          metalness={0.04}
          roughness={0.3}
          clearcoat={0.45}
          clearcoatRoughness={0.55}
          transmission={0}
          thickness={0.25}
          transparent={false}
          opacity={opacity}
          emissive={glow}
          emissiveIntensity={0.55}
          envMapIntensity={0.35}
          map={texture ?? undefined}
        />
        <Edges scale={1.02} threshold={15} color={edgeColor} />
      </RoundedBox>
    </group>
  );
};
