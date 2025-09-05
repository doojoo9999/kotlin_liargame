import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';

interface VoteParticleEffectProps {
  targetPosition: { x: number; y: number };
  particleCount?: number;
  color?: string;
  isActive?: boolean;
}

export const VoteParticleEffect: React.FC<VoteParticleEffectProps> = ({
  targetPosition,
  particleCount = 10,
  color = '#3b82f6',
  isActive = false
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1
              }}
              animate={{
                x: targetPosition.x + (Math.random() - 0.5) * 40,
                y: targetPosition.y + (Math.random() - 0.5) * 40,
                opacity: 0,
                scale: 0
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: i * 0.05
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

interface VictoryAnimationProps {
  winningTeam: 'CITIZEN' | 'LIAR';
  isActive?: boolean;
}

export const VictoryAnimation: React.FC<VictoryAnimationProps> = ({
  winningTeam,
  isActive = false
}) => {
  const confettiCount = 50;
  const colors = winningTeam === 'CITIZEN'
    ? ['#3b82f6', '#1d4ed8', '#60a5fa']
    : ['#dc2626', '#b91c1c', '#f87171'];

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(confettiCount)].map((_, i) => {
            const color = colors[i % colors.length];
            const delay = Math.random() * 2;
            const duration = 3 + Math.random() * 2;
            const startX = Math.random() * window.innerWidth;

            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3"
                style={{
                  backgroundColor: color,
                  left: startX,
                  top: -20
                }}
                initial={{
                  y: -100,
                  opacity: 1,
                  rotate: 0,
                  scale: 1
                }}
                animate={{
                  y: window.innerHeight + 100,
                  opacity: [1, 1, 0],
                  rotate: 360 * (2 + Math.random()),
                  scale: [1, 1.2, 0.8],
                  x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200]
                }}
                transition={{
                  duration,
                  delay,
                  ease: "easeIn"
                }}
              />
            );
          })}

          {/* 승리 메시지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className={`text-6xl font-bold text-center ${
              winningTeam === 'CITIZEN' ? 'text-blue-600' : 'text-red-600'
            }`}>
              {winningTeam === 'CITIZEN' ? '시민 승리!' : '라이어 승리!'}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  intensity = 'medium',
  className
}) => {
  const getFloatAnimation = () => {
    const baseAnimation = {
      y: [-2, 2, -2],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    };

    switch (intensity) {
      case 'low':
        return { ...baseAnimation, y: [-1, 1, -1] };
      case 'high':
        return { ...baseAnimation, y: [-4, 4, -4], transition: { ...baseAnimation.transition, duration: 1.5 } };
      default:
        return baseAnimation;
    }
  };

  return (
    <motion.div
      animate={getFloatAnimation()}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default {
  VoteParticleEffect,
  VictoryAnimation,
  FloatingElement
};
