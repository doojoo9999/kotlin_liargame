import * as React from "react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {motion} from "framer-motion"
import {cn, formatTime} from "@/versions/main/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card"
import {Button} from "../ui/button"
import {Progress} from "../ui/progress"
import {RadioGroup, RadioGroupItem} from "../ui/radio-group"
import {Label} from "../ui/label"
import {PlayerCard} from "./player-card"
import {VotingFormData, votingSchema} from "@/versions/main/lib/validations"
import {Player} from "@/versions/main/types/game"

interface VotingPanelProps {
  players: Player[]
  onSubmit: (data: VotingFormData) => Promise<void>
  timeRemaining?: number
  totalTime?: number
  disabled?: boolean
  votedPlayerId?: number
  title?: string
  description?: string
  submitText?: string
  className?: string
}

const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 }
}

export function VotingPanel({
  players,
  onSubmit,
  timeRemaining,
  totalTime,
  disabled = false,
  votedPlayerId,
  title = "투표하기",
  description = "라이어로 의심되는 플레이어를 선택해주세요.",
  submitText = "투표 제출",
  className
}: VotingPanelProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<VotingFormData>({
    resolver: zodResolver(votingSchema),
    defaultValues: {
      targetPlayerId: votedPlayerId
    }
  })

  const selectedPlayerId = form.watch("targetPlayerId")
  const alivePlayers = players.filter(p => p.isAlive)

  const progressPercentage = timeRemaining && totalTime
    ? (timeRemaining / totalTime) * 100
    : undefined

  const isTimeWarning = timeRemaining !== undefined && timeRemaining <= 30

  const handleSubmit = async (data: VotingFormData) => {
    if (isSubmitting || disabled) return

    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error('투표 제출 실패:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            {timeRemaining !== undefined && (
              <motion.span
                className={cn(
                  "text-lg font-mono",
                  isTimeWarning && "text-red-500"
                )}
                animate={isTimeWarning ? { scale: [1, 1.1, 1] } : undefined}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {formatTime(timeRemaining)}
              </motion.span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>

          {progressPercentage !== undefined && (
            <Progress
              value={progressPercentage}
              color={isTimeWarning ? "danger" : "default"}
              animated={isTimeWarning}
              className="h-2"
            />
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* 플레이어 카드 그리드 방식 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alivePlayers.map((player) => (
                <motion.div
                  key={player.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PlayerCard
                    player={player}
                    variant="voting"
                    interactive={!disabled && !isSubmitting}
                    selected={selectedPlayerId === player.id}
                    disabled={disabled || isSubmitting}
                    onVote={() => form.setValue("targetPlayerId", player.id)}
                    className="h-full"
                  />
                </motion.div>
              ))}
            </div>

            {/* 라디오 그룹 방식 (대안) */}
            <div className="hidden">
              <RadioGroup
                value={selectedPlayerId?.toString()}
                onValueChange={(value) => form.setValue("targetPlayerId", parseInt(value))}
                className="grid grid-cols-2 gap-4"
                disabled={disabled || isSubmitting}
              >
                {alivePlayers.map((player) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={player.id.toString()} id={`player-${player.id}`} />
                    <Label
                      htmlFor={`player-${player.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{player.nickname}</span>
                        <span className="text-sm text-muted-foreground">
                          (투표 {player.votesReceived}표)
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 에러 메시지 */}
            {form.formState.errors.targetPlayerId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-red-500 bg-red-50 p-2 rounded"
              >
                {form.formState.errors.targetPlayerId.message}
              </motion.div>
            )}

            {/* 선택된 플레이어 요약 */}
            {selectedPlayerId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">선택된 플레이어:</span>
                    <span className="ml-2 font-semibold">
                      {alivePlayers.find(p => p.id === selectedPlayerId)?.nickname}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("targetPlayerId", undefined as any)}
                    disabled={disabled || isSubmitting}
                  >
                    선택 해제
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 제출 버튼 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="submit"
                className="w-full"
                variant="game-primary"
                size="lg"
                disabled={!selectedPlayerId || disabled || isSubmitting}
                loading={isSubmitting}
              >
                {submitText}
              </Button>
            </motion.div>

            {/* 투표 완료 상태 */}
            {votedPlayerId && !disabled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 p-4 rounded-lg text-center"
              >
                <p className="text-green-700 font-medium">
                  ✓ 투표가 완료되었습니다!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  다른 플레이어들의 투표를 기다리는 중...
                </p>
              </motion.div>
            )}
          </form>

          {/* 투표 통계 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">현재 투표 현황</h4>
            <div className="space-y-2">
              {alivePlayers
                .filter(p => p.votesReceived > 0)
                .sort((a, b) => b.votesReceived - a.votesReceived)
                .map((player) => (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <span>{player.nickname}</span>
                    <span className="font-medium">{player.votesReceived}표</span>
                  </div>
                ))}
              {alivePlayers.every(p => p.votesReceived === 0) && (
                <p className="text-sm text-muted-foreground text-center">
                  아직 투표가 없습니다.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
