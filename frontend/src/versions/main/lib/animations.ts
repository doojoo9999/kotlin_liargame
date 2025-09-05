import type {Variants} from "framer-motion"

// 게임 UI 애니메이션 설정
export const gameAnimations = {
  // 페이드 인/아웃
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // 슬라이드 애니메이션
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },

  // 스케일 애니메이션
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },

  // 스태거 애니메이션을 위한 컨테이너
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  // 스태거 아이템
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  },

  // 게임 특화 애니메이션
  playerCard: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.9, y: -20 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  } as Variants,

  // 타이머 애니메이션
  timer: {
    initial: { scale: 1 },
    warning: {
      scale: [1, 1.1, 1],
      transition: {
        repeat: Infinity,
        duration: 1
      }
    }
  } as Variants,

  // 투표 애니메이션
  vote: {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    exit: { opacity: 0, scale: 0 }
  } as Variants
}

// 트랜지션 설정
export const transitions = {
  default: { duration: 0.3 },
  fast: { duration: 0.15 },
  slow: { duration: 0.6 },
  spring: { type: "spring", stiffness: 300, damping: 20 }
}

// 이징 설정
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1]
}

// 누락된 애니메이션 함수들 추가
export const buttonInteraction: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
}

export const cardAppear: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}
