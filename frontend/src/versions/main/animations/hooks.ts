import {useAnimation, useMotionValue, useTransform} from 'framer-motion'
import {useEffect, useRef} from 'react'

export function useTimerAnimation(timeRemaining: number, totalTime: number) {
  const controls = useAnimation()
  const progress = useMotionValue(1)
  const backgroundColor = useTransform(
    progress,
    [0, 0.3, 1],
    ['rgb(239, 68, 68)', 'rgb(251, 191, 36)', 'rgb(34, 197, 94)']
  )

  useEffect(() => {
    const progressValue = timeRemaining / totalTime
    progress.set(progressValue)

    if (progressValue < 0.2) {
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.5, repeat: Infinity }
      })
    } else {
      controls.start({ scale: 1 })
    }
  }, [timeRemaining, totalTime, controls, progress])

  return { controls, backgroundColor }
}

export function useRoleRevealAnimation() {
  const controls = useAnimation()

  const reveal = async () => {
    await controls.start({
      rotateY: 180,
      transition: { duration: 0.8, ease: "easeInOut" }
    })
  }

  const hide = async () => {
    await controls.start({
      rotateY: 0,
      transition: { duration: 0.8, ease: "easeInOut" }
    })
  }

  return { controls, reveal, hide }
}

export function useVoteAnimation() {
  const controls = useAnimation()

  const selectVote = async (playerId: string) => {
    await controls.start({
      scale: 1.05,
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5)",
      transition: { duration: 0.3 }
    })
  }

  const deselectVote = async () => {
    await controls.start({
      scale: 1,
      boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)",
      transition: { duration: 0.3 }
    })
  }

  return { controls, selectVote, deselectVote }
}

export function usePhaseTransition() {
  const controls = useAnimation()
  const isTransitioning = useRef(false)

  const transitionToPhase = async (onComplete?: () => void) => {
    if (isTransitioning.current) return

    isTransitioning.current = true

    await controls.start({
      opacity: 0,
      scale: 0.9,
      rotateX: -90,
      transition: { duration: 0.4, ease: "easeIn" }
    })

    onComplete?.()

    await controls.start({
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    })

    isTransitioning.current = false
  }

  return { controls, transitionToPhase, isTransitioning: isTransitioning.current }
}

export function useChatMessageAnimation() {
  const controls = useAnimation()

  const sendMessage = async () => {
    await controls.start({
      x: [0, -20, 0],
      scale: [1, 0.8, 1],
      transition: { duration: 0.3, ease: "easeOut" }
    })
  }

  const receiveMessage = async () => {
    await controls.start({
      opacity: [0, 1],
      x: [-20, 0],
      scale: [0.8, 1],
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    })
  }

  return { controls, sendMessage, receiveMessage }
}

export function usePlayerEliminationAnimation() {
  const controls = useAnimation()

  const eliminate = async () => {
    await controls.start({
      opacity: [1, 0],
      scale: [1, 0.8],
      filter: ['grayscale(0%)', 'grayscale(100%)'],
      transition: { duration: 1, ease: "easeInOut" }
    })
  }

  const revive = async () => {
    await controls.start({
      opacity: [0, 1],
      scale: [0.8, 1],
      filter: ['grayscale(100%)', 'grayscale(0%)'],
      transition: { duration: 0.5, ease: "easeOut" }
    })
  }

  return { controls, eliminate, revive }
}
