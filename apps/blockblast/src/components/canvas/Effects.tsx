import { FogExp2 } from 'three';
import { useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { useEffect } from 'react';

interface EffectsProps {
  lowSpec?: boolean;
  feverLevel?: number;
}

export const Effects = ({ lowSpec = false, feverLevel = 0 }: EffectsProps) => {
  const { scene } = useThree();
  const fever = Math.max(0, Math.min(1, feverLevel));

  useEffect(() => {
    if (lowSpec) {
      scene.fog = null;
      return () => {};
    }
    const fog = new FogExp2(fever > 0 ? '#0f1530' : '#0b1326', 0.025 + fever * 0.01);
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [fever, lowSpec, scene]);

  if (lowSpec) return null;

  return (
    <>
      <Sparkles
        count={fever > 0 ? 70 : 40}
        scale={[20, 6, 20]}
        size={fever > 0 ? 2.4 : 1.8}
        speed={0.3 + fever * 0.45}
        opacity={0.25 + fever * 0.18}
        color={fever > 0 ? '#ff9f43' : '#94b6ff'}
      />
      <pointLight position={[0, 6, 0]} intensity={0.26 + fever * 0.45} color={fever > 0 ? '#ff8ec7' : '#7dd3fc'} />
    </>
  );
};
