export const gameAnimations = {
  // 플레이어 턴 전환 애니메이션
  turnTransition: {
    current: {
      keyframes: [
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
        { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
        { transform: 'scale(1)', boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }
      ],
      duration: 800,
      easing: 'ease-in-out'
    },
    previous: {
      keyframes: [
        { transform: 'scale(1.05)', boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(59, 130, 246, 0)' }
      ],
      duration: 400,
      easing: 'ease-out'
    }
  },

  // 투표 시 파티클 효과
  voteParticles: {
    container: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      width: 200,
      height: 200,
      pointerEvents: 'none' as const,
      transform: 'translate(-50%, -50%)'
    },
    particle: (i: number) => ({
      keyframes: [
        {
          transform: 'scale(0) translate(0, 0)',
          opacity: 0
        },
        {
          transform: 'scale(1) translate(0, 0)',
          opacity: 1
        },
        {
          transform: `scale(0) translate(${Math.cos(i * (360 / 12) * Math.PI / 180) * 80}px, ${Math.sin(i * (360 / 12) * Math.PI / 180) * 80}px)`,
          opacity: 0
        }
      ],
      duration: 1200,
      delay: i * 100,
      easing: 'ease-out'
    })
  },

  // 게임 종료 축하 효과
  victory: {
    confetti: {
      keyframes: [
        {
          transform: 'translateY(-100px) rotate(0deg)',
          opacity: 1
        },
        {
          transform: `translateY(${window.innerHeight + 100}px) rotate(720deg)`,
          opacity: 0
        }
      ],
      duration: 3000,
      easing: 'ease-in'
    },
    celebration: {
      keyframes: [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.2) rotate(-5deg)' },
        { transform: 'scale(1.1) rotate(5deg)' },
        { transform: 'scale(1.1) rotate(0deg)' }
      ],
      duration: 1500,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  // 버튼 호버 효과
  buttonHover: {
    keyframes: [
      { transform: 'scale(1)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
      { transform: 'scale(1.02)', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
    ],
    duration: 200,
    easing: 'ease-out'
  },

  // 카드 선택 효과
  cardSelect: {
    keyframes: [
      { transform: 'scale(1)', borderColor: 'transparent' },
      { transform: 'scale(0.98)', borderColor: 'rgb(59, 130, 246)' },
      { transform: 'scale(1)', borderColor: 'rgb(59, 130, 246)' }
    ],
    duration: 300,
    easing: 'ease-out'
  },

  // 알림 표시 효과
  notification: {
    slideIn: {
      keyframes: [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      duration: 300,
      easing: 'ease-out'
    },
    slideOut: {
      keyframes: [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 }
      ],
      duration: 200,
      easing: 'ease-in'
    }
  },

  // 로딩 스피너
  loading: {
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ],
    duration: 1000,
    easing: 'linear',
    iterationCount: Infinity
  }
};

// 애니메이션 유틸리티 함수
export const animationUtils = {
  // 순차적 애니메이션
  sequence: async (elements: HTMLElement[], animation: any, delay = 100) => {
    for (let i = 0; i < elements.length; i++) {
      setTimeout(() => {
        elements[i].animate(animation.keyframes, {
          duration: animation.duration,
          easing: animation.easing
        });
      }, i * delay);
    }
  },

  // 병렬 애니메이션
  parallel: async (elements: HTMLElement[], animations: any[]) => {
    const promises = elements.map((element, index) => {
      const animation = animations[index] || animations[0];
      return new Promise<void>((resolve) => {
        const animationInstance = element.animate(animation.keyframes, {
          duration: animation.duration,
          easing: animation.easing
        });
        animationInstance.addEventListener('finish', () => resolve());
      });
    });

    return Promise.all(promises);
  },

  // 조건부 애니메이션
  conditional: (condition: boolean, trueAnimation: any, falseAnimation?: any) => {
    return condition ? trueAnimation : (falseAnimation || null);
  }
};
