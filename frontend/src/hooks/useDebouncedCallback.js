import {useCallback, useRef, useState} from 'react'

export function useDebouncedCallback(fn, delay = 400) {
  const timerRef = useRef(null)
  const [pending, setPending] = useState(false)

  const run = useCallback((...args) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setPending(true)
    timerRef.current = setTimeout(() => {
      setPending(false)
      fn(...args)
    }, delay)
  }, [fn, delay])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setPending(false)
    }
  }, [])

  return { run, cancel, pending }
}

export default useDebouncedCallback
