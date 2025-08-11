import {useCallback, useEffect, useRef, useState} from 'react'

export function useRedirectCountdown({
  seconds,
  enabled = false,
  onDone
}) {
  const [remaining, setRemaining] = useState(seconds || 0)
  const [canceled, setCanceled] = useState(false)
  const timerRef = useRef(null)

  const cancel = useCallback(() => {
    setCanceled(true)
  }, [])

  useEffect(() => {
    if (!enabled || canceled || remaining <= 0) return

    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          timerRef.current = null
          if (!canceled && typeof onDone === 'function') {
            onDone()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, canceled, onDone, remaining])

  useEffect(() => {
    setRemaining(seconds || 0)
    setCanceled(false)
  }, [seconds])

  return { remaining, canceled, cancel }
}

export default useRedirectCountdown
