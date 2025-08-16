import React, {useEffect, useRef, useState} from 'react'
import {Alert, Box, CircularProgress, Typography} from '@components/ui'
import {AlertTriangle as WarningIcon, Timer as TimerIcon} from 'lucide-react'

const GameTimerComponent = ({ 
  gameTimer, 
  maxTime = 60, 
  gameStatus,
  onTimeExpired,
  showCountdown = true,
  size = 120 
}) => {
  const [isBlinking, setIsBlinking] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const intervalRef = useRef(null)
  const animationRef = useRef(null)

  // Calculate progress percentage
  const progress = maxTime > 0 ? ((maxTime - gameTimer) / maxTime) * 100 : 0

  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (gameTimer <= 5) return '#f44336' // Red
    if (gameTimer <= 10) return '#ff9800' // Orange
    return '#4caf50' // Green
  }

  // Handle blinking animation for low time
  useEffect(() => {
    if (gameTimer <= 10 && gameTimer > 0) {
      setIsBlinking(true)
      const blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev)
      }, 500)
      
      return () => clearInterval(blinkInterval)
    } else {
      setIsBlinking(false)
    }
  }, [gameTimer])

  // Show warning for last 5 seconds
  useEffect(() => {
    if (gameTimer <= 5 && gameTimer > 0) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [gameTimer])

  // Handle countdown display (3-2-1 before game phase starts)
  useEffect(() => {
    if (showCountdown && gameTimer === maxTime && gameStatus !== 'WAITING') {
      setCountdown(3)
      let count = 3
      
      const countdownInterval = setInterval(() => {
        count--
        if (count > 0) {
          setCountdown(count)
        } else {
          setCountdown(null)
          clearInterval(countdownInterval)
        }
      }, 1000)
      
      return () => clearInterval(countdownInterval)
    }
  }, [gameTimer, maxTime, gameStatus, showCountdown])

  // Handle time expiration
  useEffect(() => {
    if (gameTimer === 0 && onTimeExpired) {
      console.log('[DEBUG_LOG] Timer expired, executing auto action')
      onTimeExpired()
    }
  }, [gameTimer, onTimeExpired])

  // Smooth animation using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      // This ensures smooth rendering
      animationRef.current = requestAnimationFrame(animate)
    }
    
    if (gameTimer > 0) {
      animate()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameTimer])

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`
  }

  // Don't render if no timer
  if (gameTimer <= 0 && !countdown) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        mb: 2
      }}
    >
      {/* Countdown Display */}
      {countdown && (
        <Fade in={true}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '50%',
              width: size + 20,
              height: size + 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '3rem'
              }}
            >
              {countdown}
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Warning Alert */}
      {showWarning && (
        <Fade in={showWarning}>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              mb: 1,
              animation: isBlinking ? 'blink 0.5s infinite' : 'none',
              '@keyframes blink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0.3 }
              }
            }}
          >
            시간이 얼마 남지 않았습니다!
          </Alert>
        </Fade>
      )}

      {/* Circular Timer */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isBlinking ? (showWarning ? 0.7 : 1) : 1,
          transition: 'opacity 0.3s ease'
        }}
      >
        {/* Background Circle */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{
            color: 'rgba(0, 0, 0, 0.1)',
            position: 'absolute'
          }}
        />
        
        {/* Progress Circle */}
        <CircularProgress
          variant="determinate"
          value={progress}
          size={size}
          thickness={4}
          sx={{
            color: getTimerColor(),
            transform: 'rotate(-90deg) !important',
            transition: 'color 0.3s ease',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round'
            }
          }}
        />
        
        {/* Timer Text */}
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <TimerIcon
            sx={{
              color: getTimerColor(),
              fontSize: '1.5rem',
              mb: 0.5
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: getTimerColor(),
              fontWeight: 'bold',
              fontSize: gameTimer >= 100 ? '1.2rem' : '1.5rem',
              transition: 'color 0.3s ease'
            }}
          >
            {formatTime(gameTimer)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.7rem',
              mt: 0.5
            }}
          >
            남은 시간
          </Typography>
        </Box>
      </Box>

      {/* Game Phase Indicator */}
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        {gameStatus === 'SPEAKING' && '발언 시간'}
        {gameStatus === 'VOTING' && '투표 시간'}
        {gameStatus === 'DEFENSE' && '변론 시간'}
        {gameStatus === 'SURVIVAL_VOTING' && '생존 투표'}
        {gameStatus === 'WORD_GUESS' && '단어 추측'}
      </Typography>
    </Box>
  )
}

export default GameTimerComponent