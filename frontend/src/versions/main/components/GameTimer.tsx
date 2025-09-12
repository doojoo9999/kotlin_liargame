import {useCallback, useEffect, useState} from 'react'
import {motion} from 'framer-motion'
import {Card, CardContent} from '@/components/ui/card'
import {Progress} from '@/components/ui/progress'
import {AlertTriangle, Clock, Pause, Square} from 'lucide-react'
import {cn} from '@/lib/utils'

interface GameTimerProps {
  duration: number // Total duration in seconds
  onTimeUp: () => void
  onTick?: (timeRemaining: number) => void
  autoStart?: boolean
  showProgress?: boolean
  showIcon?: boolean
  variant?: 'default' | 'compact' | 'large'
  warningThreshold?: number // Show warning when time is less than this (seconds)
  className?: string
  paused?: boolean
  phase?: string // Current game phase for display
}

export function GameTimer({
  duration,
  onTimeUp,
  onTick,
  autoStart = true,
  showProgress = true,
  showIcon = true,
  variant = 'default',
  warningThreshold = 10,
  className,
  paused = false,
  phase
}: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isActive, setIsActive] = useState(autoStart)
  const [hasEnded, setHasEnded] = useState(false)

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(duration)
    setHasEnded(false)
    if (autoStart) {
      setIsActive(true)
    }
  }, [duration, autoStart])

  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      setIsActive(false)
    } else if (autoStart && !hasEnded) {
      setIsActive(true)
    }
  }, [paused, autoStart, hasEnded])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeRemaining > 0 && !hasEnded) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1
          
          // Call onTick callback
          if (onTick) {
            onTick(newTime)
          }
          
          // Check if time is up
          if (newTime <= 0) {
            setIsActive(false)
            setHasEnded(true)
            onTimeUp()
            return 0
          }
          
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isActive, timeRemaining, onTimeUp, onTick, hasEnded])

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Calculate progress percentage
  const progressPercentage = ((duration - timeRemaining) / duration) * 100
  
  // Determine if we're in warning state
  const isWarning = timeRemaining <= warningThreshold && timeRemaining > 0
  const isCritical = timeRemaining <= 5 && timeRemaining > 0
  const isExpired = timeRemaining <= 0

  // Variant-specific styling
  const getTimerSize = () => {
    switch (variant) {
      case 'compact':
        return 'text-lg'
      case 'large':
        return 'text-4xl'
      default:
        return 'text-2xl'
    }
  }

  const getCardPadding = () => {
    switch (variant) {
      case 'compact':
        return 'p-3'
      case 'large':
        return 'p-8'
      default:
        return 'p-6'
    }
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "transition-all duration-300",
        isWarning && "border-yellow-400 bg-yellow-50 dark:bg-yellow-950",
        isCritical && "border-red-400 bg-red-50 dark:bg-red-950 animate-pulse",
        isExpired && "border-gray-400 bg-gray-50 dark:bg-gray-950"
      )}>
        <CardContent className={getCardPadding()}>
          <div className="text-center space-y-4">
            {/* Phase Display */}
            {phase && variant !== 'compact' && (
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                {phase}
              </div>
            )}

            {/* Timer Display */}
            <div className="flex items-center justify-center space-x-3">
              {showIcon && (
                <div className={cn(
                  "flex items-center justify-center rounded-full",
                  variant === 'compact' ? "w-8 h-8" : "w-12 h-12",
                  isExpired ? "bg-gray-100 dark:bg-gray-800" :
                  isCritical ? "bg-red-100 dark:bg-red-900" :
                  isWarning ? "bg-yellow-100 dark:bg-yellow-900" :
                  "bg-primary/10"
                )}>
                  {isExpired ? (
                    <Square className={cn(
                      variant === 'compact' ? "h-4 w-4" : "h-6 w-6",
                      "text-gray-500"
                    )} />
                  ) : paused ? (
                    <Pause className={cn(
                      variant === 'compact' ? "h-4 w-4" : "h-6 w-6",
                      isCritical ? "text-red-600 dark:text-red-400" :
                      isWarning ? "text-yellow-600 dark:text-yellow-400" :
                      "text-primary"
                    )} />
                  ) : (
                    <Clock className={cn(
                      variant === 'compact' ? "h-4 w-4" : "h-6 w-6",
                      isCritical ? "text-red-600 dark:text-red-400" :
                      isWarning ? "text-yellow-600 dark:text-yellow-400" :
                      "text-primary"
                    )} />
                  )}
                </div>
              )}
              
              <div className={cn(
                "font-mono font-bold",
                getTimerSize(),
                isExpired ? "text-gray-500" :
                isCritical ? "text-red-600 dark:text-red-400" :
                isWarning ? "text-yellow-600 dark:text-yellow-400" :
                "text-foreground"
              )}>
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Progress Bar */}
            {showProgress && variant !== 'compact' && (
              <div className="space-y-2">
                <Progress 
                  value={progressPercentage} 
                  className={cn(
                    "h-2",
                    isCritical && "bg-red-100 dark:bg-red-950",
                    isWarning && "bg-yellow-100 dark:bg-yellow-950"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Warning Message */}
            {isCritical && variant !== 'compact' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">시간이 거의 끝나갑니다!</span>
              </motion.div>
            )}

            {/* Time's Up Message */}
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-gray-600 dark:text-gray-400"
              >
                <div className="text-sm font-medium">시간 종료!</div>
              </motion.div>
            )}

            {/* Paused Indicator */}
            {paused && !isExpired && variant !== 'compact' && (
              <div className="text-sm text-muted-foreground">
                타이머 일시정지됨
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Preset timer variants for common use cases
export function DiscussionTimer(props: Omit<GameTimerProps, 'phase'>) {
  return <GameTimer {...props} phase="토론 단계" />
}

export function VotingTimer(props: Omit<GameTimerProps, 'phase' | 'warningThreshold'>) {
  return <GameTimer {...props} phase="투표 단계" warningThreshold={15} />
}

export function DefenseTimer(props: Omit<GameTimerProps, 'phase' | 'warningThreshold'>) {
  return <GameTimer {...props} phase="변명 단계" warningThreshold={10} />
}

export function CompactTimer(props: Omit<GameTimerProps, 'variant' | 'showProgress'>) {
  return <GameTimer {...props} variant="compact" showProgress={false} />
}