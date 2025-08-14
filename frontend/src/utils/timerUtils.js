// Timer-related utility functions

// Convert seconds to MM:SS format
export const formatTimer = (seconds) => {
  if (typeof seconds !== 'number' || seconds < 0) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Convert MM:SS format to seconds
export const parseTimerFormat = (timeString) => {
  if (typeof timeString !== 'string') return 0
  
  const parts = timeString.split(':')
  if (parts.length !== 2) return 0
  
  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)
  
  if (isNaN(minutes) || isNaN(seconds)) return 0
  
  return minutes * 60 + seconds
}

// Check if timer has expired
export const isTimerExpired = (timer) => {
  return typeof timer === 'number' && timer <= 0
}

// Check if timer is active
export const isTimerActive = (timer) => {
  return typeof timer === 'number' && timer > 0
}

// Calculate remaining time percentage (for progress bars)
export const getTimerPercentage = (currentTime, totalTime) => {
  if (typeof currentTime !== 'number' || typeof totalTime !== 'number' || totalTime <= 0) {
    return 0
  }
  
  const percentage = (currentTime / totalTime) * 100
  return Math.max(0, Math.min(100, percentage))
}

// Get timer status text
export const getTimerStatusText = (timer) => {
  if (!isTimerActive(timer)) return 'Timer inactive'
  
  if (timer <= 10) return 'Hurry up!'
  if (timer <= 30) return 'Time running out'
  
  return 'Time remaining'
}

// Create countdown interval
export const createCountdownInterval = (callback, intervalMs = 1000) => {
  return setInterval(callback, intervalMs)
}

// Clear countdown interval
export const clearCountdownInterval = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId)
  }
}

// Calculate exponential backoff delay
export const calculateBackoffDelay = (retryCount, baseDelay = 1000, maxDelay = 30000) => {
  const delay = baseDelay * Math.pow(2, retryCount)
  return Math.min(delay, maxDelay)
}

// Create delayed execution timeout
export const createDelayedExecution = (callback, delay = 100) => {
  return setTimeout(callback, delay)
}

// Clear delayed execution timeout
export const clearDelayedExecution = (timeoutId) => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
}

// Debounce timer updates (prevent rapid consecutive updates)
export const createTimerDebouncer = (callback, delay = 100) => {
  let timeoutId = null
  
  return (...args) => {
    clearDelayedExecution(timeoutId)
    timeoutId = createDelayedExecution(() => callback(...args), delay)
  }
}

// Throttle timer updates (limit frequency of updates)
export const createTimerThrottler = (callback, limit = 100) => {
  let inThrottle = false
  
  return (...args) => {
    if (!inThrottle) {
      callback(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Validate timer value
export const isValidTimerValue = (timer) => {
  return typeof timer === 'number' && timer >= 0 && isFinite(timer)
}

// Ensure timer value is within valid range
export const clampTimerValue = (timer, min = 0, max = 3600) => {
  if (!isValidTimerValue(timer)) return min
  
  return Math.max(min, Math.min(max, timer))
}

// Convert milliseconds to seconds
export const millisecondsToSeconds = (milliseconds) => {
  return Math.floor(milliseconds / 1000)
}

// Convert seconds to milliseconds
export const secondsToMilliseconds = (seconds) => {
  return seconds * 1000
}

// Get current timestamp in seconds
export const getCurrentTimestamp = () => {
  return millisecondsToSeconds(Date.now())
}

// Calculate time difference in seconds
export const getTimeDifference = (startTime, endTime = Date.now()) => {
  return millisecondsToSeconds(endTime - startTime)
}

// Check if enough time has passed since last action
export const hasEnoughTimePassed = (lastActionTime, requiredInterval) => {
  const currentTime = Date.now()
  const timeDifference = getTimeDifference(lastActionTime, currentTime)
  return timeDifference >= requiredInterval
}

// Create a timer state object
export const createTimerState = (initialValue = 0) => ({
  value: initialValue,
  isActive: isTimerActive(initialValue),
  isExpired: isTimerExpired(initialValue),
  formatted: formatTimer(initialValue),
  percentage: 0
})

// Update timer state object
export const updateTimerState = (timerState, newValue, totalTime = null) => ({
  ...timerState,
  value: newValue,
  isActive: isTimerActive(newValue),
  isExpired: isTimerExpired(newValue),
  formatted: formatTimer(newValue),
  percentage: totalTime ? getTimerPercentage(newValue, totalTime) : timerState.percentage
})