import * as React from "react"
import {motion} from "framer-motion"
import {AlertCircle, Clock} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Progress} from "@/versions/main/components/ui/progress"
import {useTimerAnimation} from "@/versions/main/animations"

interface TimerProps {
  timeRemaining: number
  totalTime: number
  phase?: string
  urgent?: boolean
  onTimeUp?: () => void
  className?: string
}

export function Timer({
  timeRemaining,
  totalTime,
  phase,
  urgent = false,
  onTimeUp,
  className
}: TimerProps) {
  const { controls, backgroundColor } = useTimerAnimation(timeRemaining, totalTime)

  React.useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp()
    }
  }, [timeRemaining, onTimeUp])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressValue = (timeRemaining / totalTime) * 100
  const isUrgent = urgent || progressValue < 20

  return (
    <div className={cn("space-y-3", className)}>
      {phase && (
        <div className="text-center">
          <h3 className="text-lg font-semibold">{phase}</h3>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Clock className={cn(
          "w-5 h-5",
          isUrgent ? "text-red-500" : "text-muted-foreground"
        )} />

        <motion.div
          animate={controls}
          className={cn(
            "text-3xl font-mono font-bold tabular-nums",
            isUrgent ? "text-red-600" : "text-foreground"
          )}
        >
          {formatTime(timeRemaining)}
        </motion.div>
      </div>

      <div className="space-y-2">
        <motion.div style={{ backgroundColor }}>
          <Progress
            value={progressValue}
            className={cn(
              "h-3 transition-all duration-300",
              isUrgent && "animate-pulse"
            )}
          />
        </motion.div>

        {isUrgent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            시간이 얼마 남지 않았습니다!
          </motion.div>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {Math.round(progressValue)}% 남음
      </div>
    </div>
  )
}

interface CountdownProps {
  from: number
  onComplete?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Countdown({
  from,
  onComplete,
  size = 'md',
  className
}: CountdownProps) {
  const [count, setCount] = React.useState(from)

  React.useEffect(() => {
    if (count <= 0) {
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setCount(count - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl"
  }

  return (
    <motion.div
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      className={cn(
        "flex items-center justify-center font-bold font-mono text-center",
        sizeClasses[size],
        count <= 3 ? "text-red-500" : "text-foreground",
        className
      )}
    >
      {count}
    </motion.div>
  )
}
