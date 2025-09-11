import {useEffect, useRef} from 'react'
import {useGameStoreV2} from '@/stores/gameStoreV2'

// 경고 임계치(초): 10, 5에서 알림 발생
export function useTimerWarnings(onWarn?: (secs: number) => void) {
  const lastWarnRef = useRef<number | null>(null)
  const timeRemaining = useGameStoreV2(s => s.timeRemaining)

  useEffect(() => {
    if (!onWarn) return
    if (timeRemaining === 10 || timeRemaining === 5) {
      if (lastWarnRef.current !== timeRemaining) {
        lastWarnRef.current = timeRemaining
        onWarn(timeRemaining)
      }
    }
  }, [timeRemaining, onWarn])
}

