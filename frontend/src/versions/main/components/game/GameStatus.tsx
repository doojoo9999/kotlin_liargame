import * as React from "react"
import {motion} from "framer-motion"
import {AlertCircle, Clock, Trophy, Users} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Progress} from "@/versions/main/components/ui/progress"
import {useTimerAnimation} from "@/versions/main/animations"
import type {GamePhase} from "@/shared/types/api.types"

interface GameStatusProps {
  gamePhase: GamePhase
  timeRemaining?: number
  totalTime?: number
  currentRound: number
  totalRounds: number
  playersTotal: number
  playersVoted: number
  className?: string
}

const phaseLabels: Record<GamePhase, string> = {
  WAITING: "대기 중",
  ROLE_ASSIGNMENT: "역할 배정",
  HINT_PROVIDING: "힌트 제공",
  DISCUSSION: "토론 시간",
  VOTING: "투표 시간",
  DEFENSE: "변론 시간",
  FINAL_VOTING: "최종 투표",
  LIAR_GUESS: "라이어 추측",
  RESULT: "결과 발표",
  FINISHED: "게임 종료"
}

const phaseColors: Record<GamePhase, string> = {
  WAITING: "bg-gray-100 text-gray-800",
  ROLE_ASSIGNMENT: "bg-purple-100 text-purple-800",
  HINT_PROVIDING: "bg-blue-100 text-blue-800",
  DISCUSSION: "bg-green-100 text-green-800",
  VOTING: "bg-red-100 text-red-800",
  DEFENSE: "bg-orange-100 text-orange-800",
  FINAL_VOTING: "bg-red-100 text-red-800",
  LIAR_GUESS: "bg-yellow-100 text-yellow-800",
  RESULT: "bg-purple-100 text-purple-800",
  FINISHED: "bg-gray-100 text-gray-800"
}

export function GameStatus({
  gamePhase,
  timeRemaining,
  totalTime = 120,
  currentRound,
  totalRounds,
  playersTotal,
  playersVoted,
  className
}: GameStatusProps) {
  const { controls, backgroundColor } = useTimerAnimation(
    timeRemaining || 0,
    totalTime
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressValue = timeRemaining ? (timeRemaining / totalTime) * 100 : 0
  const isUrgent = progressValue < 20

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            게임 현황
          </span>
          <Badge className={phaseColors[gamePhase]}>
            {phaseLabels[gamePhase]}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {timeRemaining !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                남은 시간
              </span>
              <motion.span
                animate={controls}
                className={`font-mono text-lg font-bold ${
                  isUrgent ? 'text-red-600' : 'text-foreground'
                }`}
              >
                {formatTime(timeRemaining)}
              </motion.span>
            </div>

            <motion.div style={{ backgroundColor }}>
              <Progress
                value={progressValue}
                className="h-2"
              />
            </motion.div>

            {isUrgent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-red-600"
              >
                <AlertCircle className="w-3 h-3" />
                시간이 얼마 남지 않았습니다!
              </motion.div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              라운드 진행
            </div>
            <div className="text-2xl font-bold">
              {currentRound} / {totalRounds}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">투표 현황</div>
            <div className="text-2xl font-bold">
              {playersVoted} / {playersTotal}
            </div>
          </div>
        </div>

        {gamePhase === 'VOTING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>투표 진행률</span>
              <span>{Math.round((playersVoted / playersTotal) * 100)}%</span>
            </div>
            <Progress value={(playersVoted / playersTotal) * 100} />
          </div>
        )}

        {gamePhase === 'DISCUSSION' && (
          <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            플레이어들이 힌트를 공유하고 있습니다
          </div>
        )}

        {gamePhase === 'DEFENSE' && (
          <div className="text-center text-sm text-orange-600 p-3 bg-orange-50 rounded-lg">
            의심받는 플레이어의 변론 시간입니다
          </div>
        )}
      </CardContent>
    </Card>
  )
}
