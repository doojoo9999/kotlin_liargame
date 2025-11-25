import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { CAMERA_CONFIG } from '../../styles/theme';

interface ParallaxRigProps {
  intensity?: number;
}

export const ParallaxRig = ({ intensity = 0.5 }: ParallaxRigProps) => {
  const { camera } = useThree();
  const basePosition = useRef(new Vector3(...CAMERA_CONFIG.position));
  const tilt = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      tilt.current = {
        x: (event.gamma / 45) * 0.6,
        y: (event.beta / 90) * 0.6
      };
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  useFrame(({ mouse }) => {
    const pointer = { x: mouse.x || 0, y: mouse.y || 0 };
    const offsetX = (pointer.x + tilt.current.x) * intensity;
    const offsetY = (pointer.y + tilt.current.y) * intensity;
    const target = basePosition.current.clone().add(new Vector3(offsetX, -offsetY * 0.6, offsetY));
    camera.position.lerp(target, 0.08);
    camera.lookAt(0, 0, 0);
  });

  return null;
};
