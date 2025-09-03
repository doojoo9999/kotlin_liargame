import * as React from "react"
import {motion} from "framer-motion"
import {Badge} from "@/versions/main/components/ui/badge"
import {Progress} from "@/versions/main/components/ui/progress"
import {AlertTriangle, Clock} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"

export interface GameTimerProps {
  timeRemaining: number
  totalTime: number
  phase: string
  isWarning?: boolean
  className?: string
  onTimeUp?: () => void
}

export function GameTimer({
  timeRemaining,
  totalTime,
  phase,
  isWarning = false,
  className,
  onTimeUp
}: GameTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressValue = (timeRemaining / totalTime) * 100
  const isTimeWarning = timeRemaining <= 30

  React.useEffect(() => {
    if (timeRemaining === 0 && onTimeUp) {
      onTimeUp()
    }
  }, [timeRemaining, onTimeUp])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("text-center space-y-4", className)}
    >
      {/* 페이즈 표시 */}
      <Badge
        variant={isTimeWarning ? "game-danger" : "game-primary"}
        className="text-lg px-4 py-2"
      >
        <Clock className="w-4 h-4 mr-2" />
        {phase}
      </Badge>

      {/* 시간 표시 */}
      <motion.div
        animate={isTimeWarning ? { scale: [1, 1.1, 1] } : {}}
        transition={isTimeWarning ? { repeat: Infinity, duration: 1 } : {}}
        className={cn(
          "text-6xl font-bold font-mono",
          isTimeWarning ? "text-red-600" : "text-blue-600"
        )}
      >
        {formatTime(timeRemaining)}
      </motion.div>

      {/* 프로그레스 바 */}
      <div className="space-y-2">
        <Progress
          value={progressValue}
          animated={isTimeWarning}
          color={isTimeWarning ? "danger" : "primary"}
          className="h-4"
        />
        <div className="text-sm text-gray-600">
          남은 시간: {timeRemaining}초
        </div>
      </div>

      {/* 경고 메시지 */}
      {isTimeWarning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-red-600"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">시간이 얼마 남지 않았습니다!</span>
        </motion.div>
      )}
    </motion.div>
  )
}
