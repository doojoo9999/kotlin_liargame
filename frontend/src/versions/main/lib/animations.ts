import {Variants} from "framer-motion"

// 페이지 전환 애니메이션
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

export const pageTransitionConfig = {
  type: "tween" as const,
  duration: 0.3,
  ease: "easeInOut" as const
}

// 카드 등장 애니메이션
export const cardAppear: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -10 }
}

export const cardAppearConfig = {
  type: "spring" as const,
  damping: 25,
  stiffness: 300
}

// 버튼 인터랙션 애니메이션
export const buttonInteraction = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring" as const, damping: 20, stiffness: 300 }
}

// 플레이어 턴 하이라이트 애니메이션
export const turnHighlight: Variants = {
  animate: {
    boxShadow: [
      "0 0 0 rgba(59, 130, 246, 0)",
      "0 0 20px rgba(59, 130, 246, 0.5)",
      "0 0 0 rgba(59, 130, 246, 0)"
    ]
  }
}

export const turnHighlightConfig = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut" as const
}

// 투표 효과 애니메이션
export const voteEffect: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.1, 1] },
  transition: { duration: 0.3 }
}

// 채팅 메시지 애니메이션
export const chatMessageAnimation: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.8 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}

export const chatMessageConfig = {
  type: "spring" as const,
  damping: 20,
  stiffness: 300
}

// 게임 종료 애니메이션
export const gameEndAnimation = {
  winner: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: "spring" as const, damping: 10, stiffness: 100 }
  },
  loser: {
    initial: { opacity: 1 },
    animate: { opacity: 0.5, scale: 0.95 },
    transition: { duration: 0.5 }
  }
}

// 리스트 아이템 스태거 애니메이션
export const staggerContainer: Variants = {
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

// 모달/다이얼로그 애니메이션
export const modalAnimation: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

export const modalBackdropAnimation: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

// 로딩 스피너 애니메이션
export const spinnerAnimation = {
  animate: { rotate: 360 },
  transition: { duration: 1, repeat: Infinity, ease: "linear" as const }
}

// 진행률 바 애니메이션
export const progressBarAnimation = {
  initial: { width: "0%" },
  animate: { width: "100%" },
  transition: { duration: 0.5, ease: "easeOut" as const }
}
