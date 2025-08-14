import {useCallback, useMemo, useState} from 'react'
import {debounce} from 'lodash-es'

export function useDebouncedCallback(fn, delay = 400) {
  const [pending, setPending] = useState(false)

  const debouncedFn = useMemo(() => {
    return debounce((...args) => {
      setPending(false)
      fn(...args)
    }, delay)
  }, [fn, delay])

  const run = useCallback((...args) => {
    setPending(true)
    debouncedFn(...args)
  }, [debouncedFn])

  const cancel = useCallback(() => {
    debouncedFn.cancel()
    setPending(false)
  }, [debouncedFn])

  return { run, cancel, pending }
}

export default useDebouncedCallback
