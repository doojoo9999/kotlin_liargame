import { FogExp2 } from 'three';
import { useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { useEffect } from 'react';

interface EffectsProps {
  lowSpec?: boolean;
}

export const Effects = ({ lowSpec = false }: EffectsProps) => {
  const { scene } = useThree();

  useEffect(() => {
    if (lowSpec) {
      scene.fog = null;
      return () => {};
    }
    const fog = new FogExp2('#0b1021', 0.05);
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [lowSpec, scene]);

  if (lowSpec) return null;

  return <Sparkles count={40} scale={[20, 6, 20]} size={2} speed={0.3} opacity={0.4} color="#94b6ff" />;
};
