import * as React from "react"
import {motion} from "framer-motion"
import {cn, formatTime} from "@/versions/main/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card"
import {Progress} from "../ui/progress"
import {Badge} from "../ui/badge"
import {GamePhase} from "@/versions/main/types/game"

interface PhaseConfig {
  key: GamePhase
  label: string
  description: string
  color: string
}

interface GamePhaseIndicatorProps {
  currentPhase: GamePhase
  phases: PhaseConfig[]
  timeRemaining?: number
  totalTime?: number
  onPhaseClick?: (phase: GamePhase) => void
  className?: string
}

const phaseConfigs: PhaseConfig[] = [
  {
    key: 'WAITING_FOR_PLAYERS',
    label: '대기',
    description: '플레이어 대기 중',
    color: 'bg-yellow-500'
  },
  {
    key: 'SPEECH',
    label: '힌트',
    description: '힌트 제공 단계',
    color: 'bg-blue-500'
  },
  {
    key: 'VOTING_FOR_LIAR',
    label: '투표',
    description: '라이어 지목 투표',
    color: 'bg-orange-500'
  },
  {
    key: 'DEFENDING',
    label: '변론',
    description: '변론 단계',
    color: 'bg-purple-500'
  },
  {
    key: 'VOTING_FOR_SURVIVAL',
    label: '최종투표',
    description: '처형/생존 투표',
    color: 'bg-red-500'
  },
  {
    key: 'GUESSING_WORD',
    label: '단어추측',
    description: '라이어 단어 추측',
    color: 'bg-indigo-500'
  },
  {
    key: 'GAME_OVER',
    label: '종료',
    description: '게임 종료',
    color: 'bg-gray-500'
  }
]

const progressVariants = {
  initial: { width: 0 },
  animate: { width: "100%" },
  warning: {
    backgroundColor: ["#ef4444", "#fbbf24", "#ef4444"],
    transition: { duration: 1, repeat: Infinity }
  }
}

export function GamePhaseIndicator({
  currentPhase,
  phases = phaseConfigs,
  timeRemaining,
  totalTime,
  onPhaseClick,
  className
}: GamePhaseIndicatorProps) {
  const currentPhaseIndex = phases.findIndex(p => p.key === currentPhase)
  const currentPhaseConfig = phases[currentPhaseIndex]

  const progressPercentage = timeRemaining && totalTime
    ? (timeRemaining / totalTime) * 100
    : undefined

  const isTimeWarning = timeRemaining !== undefined && timeRemaining <= 30

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>게임 진행 상황</span>
          {currentPhaseConfig && (
            <Badge
              className={cn("text-white", currentPhaseConfig.color)}
              variant="secondary"
            >
              {currentPhaseConfig.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 단계 스테퍼 */}
        <div className="flex items-center justify-between">
          {phases.map((phase, index) => {
            const isActive = index === currentPhaseIndex
            const isCompleted = index < currentPhaseIndex
            const isClickable = onPhaseClick && (isCompleted || isActive)

            return (
              <div key={phase.key} className="flex items-center">
                <motion.button
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isActive && "ring-2 ring-offset-2 ring-primary scale-110",
                    isCompleted && "bg-green-500 text-white",
                    !isCompleted && !isActive && "bg-gray-200 text-gray-500",
                    isActive && phase.color.replace('bg-', 'bg-') + " text-white",
                    isClickable && "cursor-pointer hover:scale-105"
                  )}
                  onClick={isClickable ? () => onPhaseClick(phase.key) : undefined}
                  disabled={!isClickable}
                  whileHover={isClickable ? { scale: 1.1 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                >
                  {index + 1}
                </motion.button>
                {index < phases.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {/* 현재 단계 설명 */}
        {currentPhaseConfig && (
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{currentPhaseConfig.label}</h3>
            <p className="text-sm text-muted-foreground">
              {currentPhaseConfig.description}
            </p>
          </div>
        )}

        {/* 시간 표시 및 프로그레스 바 */}
        {timeRemaining !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">남은 시간</span>
              <motion.span
                className={cn(
                  "text-lg font-mono font-bold",
                  isTimeWarning && "text-red-500"
                )}
                animate={isTimeWarning ? { scale: [1, 1.1, 1] } : undefined}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {formatTime(timeRemaining)}
              </motion.span>
            </div>

            {progressPercentage !== undefined && (
              <motion.div
                initial="initial"
                animate={isTimeWarning ? "warning" : "animate"}
                variants={progressVariants}
              >
                <Progress
                  value={progressPercentage}
                  color={isTimeWarning ? "danger" : "default"}
                  animated={isTimeWarning}
                  className="h-2"
                />
              </motion.div>
            )}
          </div>
        )}

        {/* 다음 단계 미리보기 */}
        {currentPhaseIndex < phases.length - 1 && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">다음:</span>
              <span className="text-sm font-medium">
                {phases[currentPhaseIndex + 1].label}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
