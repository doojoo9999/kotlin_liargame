import {Variants} from 'framer-motion';

// 1. 기본 애니메이션 프리셋
export const baseAnimations: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  },
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  },
  slideLeft: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  },
  slideRight: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  },
  scaleIn: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  },
  bounce: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 400
      }
    }
  }
};

// 2. 게임 특화 애니메이션
export const gameAnimations: Record<string, Variants> = {
  turnHighlight: {
    inactive: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderColor: 'rgb(229, 231, 235)'
    },
    active: {
      boxShadow: [
        '0 0 0 rgba(59, 130, 246, 0)',
        '0 0 20px rgba(59, 130, 246, 0.8)',
        '0 0 0 rgba(59, 130, 246, 0)'
      ],
      borderColor: 'rgb(59, 130, 246)',
      transition: {
        boxShadow: { duration: 2, repeat: Infinity },
        borderColor: { duration: 0.3 }
      }
    }
  },
  voteSuccess: {
    idle: { scale: 1, rotate: 0 },
    voted: {
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.6, ease: "backOut" }
    }
  },
  elimination: {
    alive: {
      opacity: 1,
      scale: 1,
      filter: 'grayscale(0%)'
    },
    eliminated: {
      opacity: 0.4,
      scale: 0.95,
      filter: 'grayscale(100%)',
      transition: { duration: 0.8 }
    }
  },
  cardFlip: {
    front: { rotateY: 0 },
    back: {
      rotateY: 180,
      transition: { duration: 0.6, ease: "easeInOut" }
    }
  },
  floatingAction: {
    idle: { y: 0 },
    floating: {
      y: [-2, 2, -2],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// 3. 복합 애니메이션 시퀀스
export const animationSequences = {
  gameStart: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      }
    },
    item: {
      hidden: { scale: 0, opacity: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.5, ease: "backOut" }
      }
    }
  },
  roundEnd: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.3,
          delayChildren: 0.1
        }
      }
    },
    results: {
      hidden: { scale: 0, opacity: 0 },
      visible: { scale: 1, opacity: 1 }
    },
    scoreboard: {
      hidden: { y: 50, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    },
    nextButton: {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    }
  },
  phaseTransition: {
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { duration: 0.3 }
    },
    enter: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "backOut" }
    }
  }
};

// 트랜지션 프리셋
export const transitions = {
  spring: {
    type: "spring" as const,
    damping: 20,
    stiffness: 300
  },
  smooth: {
    duration: 0.3,
    ease: "easeInOut" as const
  },
  bounce: {
    type: "spring" as const,
    damping: 10,
    stiffness: 400
  },
  slow: {
    duration: 0.8,
    ease: "easeInOut" as const
  }
};
