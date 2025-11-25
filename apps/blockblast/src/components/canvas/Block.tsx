import { RoundedBox } from '@react-three/drei';
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
  const physicalColor = new Color(color);
  const glow = emissive ? new Color(emissive) : physicalColor.clone().multiplyScalar(0.35);
  const texture: Texture | null = useMemo(() => {
    if (!usePattern || !colorKey) return null;
    const pattern = PATTERN_BY_COLOR[colorKey] ?? 'stripes';
    return buildPatternTexture(color, pattern);
  }, [color, colorKey, usePattern]);

  return (
    <group position={position}>
      <RoundedBox args={[0.92, 0.92, 0.92]} radius={0.2} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={physicalColor}
          metalness={0.1}
          roughness={0.1}
          clearcoat={1}
          transmission={0.2}
          transparent
          opacity={opacity}
          emissive={glow}
          emissiveIntensity={0.4}
          map={texture ?? undefined}
        />
      </RoundedBox>
    </group>
  );
};
