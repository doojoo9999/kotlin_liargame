import {useEffect, useMemo, useState} from 'react';
import {AnimationConfig, AnimationContext} from '@/shared/types/game';

// 게임 단계별 애니메이션 설정
const getAnimationConfig = (gamePhase: string): AnimationConfig => {
  const configs: Record<string, AnimationConfig> = {
    WAITING: {
      duration: 0.5,
      ease: 'easeInOut',
      complexity: 'simple'
    },
    ROLE_ASSIGNMENT: {
      duration: 0.8,
      ease: 'backOut',
      complexity: 'medium'
    },
    HINT_PROVIDING: {
      duration: 0.6,
      ease: 'easeInOut',
      complexity: 'medium'
    },
    DISCUSSION: {
      duration: 0.4,
      ease: 'easeInOut',
      complexity: 'simple'
    },
    VOTING: {
      duration: 0.7,
      ease: 'backOut',
      complexity: 'complex'
    },
    DEFENSE: {
      duration: 0.5,
      ease: 'easeInOut',
      complexity: 'medium'
    },
    FINAL_VOTING: {
      duration: 0.8,
      ease: 'backOut',
      complexity: 'complex'
    },
    RESULT: {
      duration: 1.2,
      ease: 'backOut',
      complexity: 'complex'
    },
    FINISHED: {
      duration: 1.5,
      ease: 'easeInOut',
      complexity: 'complex'
    }
  };

  return configs[gamePhase] || configs.WAITING;
};

// 맥락 인식 애니메이션 훅
export const useContextualAnimation = (context: AnimationContext) => {
  return useMemo(() => {
    const baseConfig = getAnimationConfig(context.gamePhase);

    // 성능 수준에 따른 조정
    if (context.performanceLevel === 'low') {
      baseConfig.duration *= 0.5;
      baseConfig.complexity = 'simple';
    } else if (context.performanceLevel === 'medium') {
      baseConfig.duration *= 0.75;
      if (baseConfig.complexity === 'complex') {
        baseConfig.complexity = 'medium';
      }
    }

    // 사용자 설정 반영
    if (context.userPreferences.reduceMotion) {
      return {
        duration: 0,
        ease: 'linear',
        complexity: 'simple'
      };
    }

    baseConfig.duration *= context.userPreferences.preferredSpeed;

    // 디바이스 타입에 따른 조정
    if (context.deviceType === 'mobile') {
      baseConfig.duration *= 0.8; // 모바일에서는 약간 빠르게
    }

    // 플레이어 수에 따른 조정
    if (context.playerCount > 6 && baseConfig.complexity === 'complex') {
      baseConfig.complexity = 'medium';
    }

    return baseConfig;
  }, [context]);
};

// 적응형 성능 모니터링 훅
export const useAdaptiveAnimation = () => {
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [frameTimeHistory, setFrameTimeHistory] = useState<number[]>([]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measurePerformance = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      lastTime = currentTime;

      frameCount++;

      // 10프레임마다 성능 평가
      if (frameCount % 10 === 0) {
        setFrameTimeHistory(prev => {
          const newHistory = [...prev, frameTime].slice(-50); // 최근 50개 프레임 유지

          const avgFrameTime = newHistory.reduce((sum, time) => sum + time, 0) / newHistory.length;

          // 성능 수준 결정
          if (avgFrameTime > 32) { // 30fps 이하
            setPerformanceLevel('low');
          } else if (avgFrameTime > 20) { // 50fps 이하
            setPerformanceLevel('medium');
          } else {
            setPerformanceLevel('high');
          }

          return newHistory;
        });
      }

      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return performanceLevel;
};

// 접근성 고려 애니메이션 훅
export const useAccessibleAnimation = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const respectMotionPreference = (animation: any) => {
    if (prefersReducedMotion) {
      return {
        ...animation,
        transition: { duration: 0 }
      };
    }
    return animation;
  };

  return { prefersReducedMotion, respectMotionPreference };
};

// 디바이스 타입 감지 훅
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
};

// 종합 애니메이션 컨텍스트 훅
export const useGameAnimationContext = (gamePhase: string, playerCount: number, isCurrentPlayer: boolean) => {
  const performanceLevel = useAdaptiveAnimation();
  const deviceType = useDeviceType();
  const { prefersReducedMotion } = useAccessibleAnimation();

  const context: AnimationContext = {
    gamePhase: gamePhase as any,
    playerCount,
    isCurrentPlayer,
    deviceType,
    performanceLevel,
    userPreferences: {
      reduceMotion: prefersReducedMotion,
      preferredSpeed: 1.0 // 나중에 사용자 설정에서 가져올 수 있음
    }
  };

  return useContextualAnimation(context);
};
