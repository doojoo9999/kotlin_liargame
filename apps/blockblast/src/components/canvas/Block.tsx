import { RoundedBox } from '@react-three/drei';
import { Color } from 'three';

interface BlockProps {
  position: [number, number, number];
  color: string;
  opacity?: number;
  emissive?: string;
}

export const Block = ({ position, color, opacity = 1, emissive }: BlockProps) => {
  const physicalColor = new Color(color);
  const glow = emissive ? new Color(emissive) : physicalColor.clone().multiplyScalar(0.35);

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
        />
      </RoundedBox>
    </group>
  );
};
