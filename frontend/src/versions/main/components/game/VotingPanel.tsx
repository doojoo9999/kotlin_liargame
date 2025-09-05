import * as React from "react"
import {motion} from "framer-motion"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card"
import {Progress} from "../ui/progress"
import {Badge} from "../ui/badge"
import {PlayerCard} from "./PlayerCard"
import {GameButton} from "./GameButton"
import {type VotingFormData, votingSchema} from "../../lib/validations"
import {cardAppear, staggerContainer, staggerItem} from "../../lib/animations"
import {cn} from "../../lib/utils"
import {AlertCircle, CheckCircle2, Clock, Timer, Users, Vote} from "lucide-react"

interface Player {
  id: number
  userId: number
  nickname: string
  role?: 'CITIZEN' | 'LIAR'
  isAlive: boolean
  isCurrentTurn: boolean
  votesReceived: number
  hasVoted: boolean
  hint?: string
  defense?: string
  isOwner?: boolean
  connectionStatus?: 'online' | 'offline' | 'away'
  avatar?: string
  score?: number
}

interface VotingPanelProps {
  gameNumber: number
  players: Player[]
  onSubmit: (data: VotingFormData) => Promise<void>
  timeRemaining?: number
  totalTime?: number
  disabled?: boolean
  title?: string
  description?: string
  variant?: 'liar' | 'final' | 'custom'
  showConfidence?: boolean
  allowAbstention?: boolean
  className?: string
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  gameNumber,
  players,
  onSubmit,
  timeRemaining,
  totalTime,
  disabled = false,
  title = "투표하기",
  description = "라이어로 의심되는 플레이어를 선택하세요",
  variant = 'liar',
  showConfidence = false,
  allowAbstention = false,
  className
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [confidence, setConfidence] = React.useState(3)

  const {
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors }
  } = useForm<VotingFormData>({
    resolver: zodResolver(votingSchema),
    defaultValues: {
      targetPlayerId: 0,
      confidence: 3
    }
  })

  const watchedTargetId = watch('targetPlayerId')

  const votableePlayers = players.filter(player => player.isAlive)
  const votedCount = players.filter(player => player.hasVoted).length
  const totalPlayers = players.length
  const votingProgress = Math.round((votedCount / totalPlayers) * 100)

  const timeProgress = totalTime && timeRemaining
    ? ((totalTime - timeRemaining) / totalTime) * 100
    : 0

  const isTimeRunningOut = timeRemaining !== undefined && timeRemaining < 30

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handlePlayerSelect = (playerId: number) => {
    if (disabled || isSubmitting) return
    setSelectedPlayerId(playerId)
    setValue('targetPlayerId', playerId)
  }

  const handleConfidenceChange = (value: number) => {
    setConfidence(value)
    setValue('confidence', value)
  }

  const handleAbstention = () => {
    setSelectedPlayerId(-1) // -1은 기권을 의미
    setValue('targetPlayerId', -1)
  }

  const handleVoteSubmit = async (data: VotingFormData) => {
    if ((!selectedPlayerId || selectedPlayerId === 0) && !allowAbstention) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...data,
        confidence: showConfidence ? confidence : undefined
      })
    } catch (error) {
      console.error('투표 실패:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSelection = () => {
    setSelectedPlayerId(null)
    setValue('targetPlayerId', 0)
    setValue('confidence', 3)
    setConfidence(3)
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardAppear}
      className={className}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              {title}
            </CardTitle>

            {timeRemaining !== undefined && (
              <div className="flex items-center gap-2">
                <Timer className={cn(
                  "h-4 w-4",
                  isTimeRunningOut ? "text-red-500" : "text-muted-foreground"
                )} />
                <Badge
                  variant={isTimeRunningOut ? 'destructive' : 'secondary'}
                  className="font-mono"
                >
                  {formatTime(timeRemaining)}
                </Badge>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 진행 상황 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">투표 진행률</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {votedCount}/{totalPlayers} 완료
              </span>
            </div>
            <Progress value={votingProgress} className="h-2" />

            {/* 시간 진행률 */}
            {totalTime && timeRemaining !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={cn(
                      "h-4 w-4",
                      isTimeRunningOut ? "text-red-500" : "text-muted-foreground"
                    )} />
                    <span className="text-sm font-medium">남은 시간</span>
                  </div>
                  <span className={cn(
                    "text-sm font-mono",
                    isTimeRunningOut ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Progress
                  value={timeProgress}
                  className={cn(
                    "h-2",
                    isTimeRunningOut && "bg-red-100 [&>div]:bg-red-500"
                  )}
                />
              </div>
            )}

            {/* 위험 경고 */}
            {isTimeRunningOut && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                  시간이 얼마 남지 않았습니다!
                </span>
              </motion.div>
            )}
          </div>

          {/* 투표 폼 */}
          <form onSubmit={handleSubmit(handleVoteSubmit)} className="space-y-6">
            {/* 플레이어 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">플레이어 선택</h3>

              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {votableePlayers.map((player) => (
                  <motion.div key={player.id} variants={staggerItem}>
                    <PlayerCard
                      player={player}
                      variant="voting"
                      interactive
                      selected={selectedPlayerId === player.userId}
                      disabled={disabled || isSubmitting}
                      showRole={variant === 'final'}
                      onVote={() => handlePlayerSelect(player.userId)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* 확신도 설정 */}
            {showConfidence && selectedPlayerId && selectedPlayerId !== -1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <h4 className="text-md font-medium">확신도 선택</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <GameButton
                      key={level}
                      type="button"
                      size="sm"
                      variant={confidence === level ? "game-primary" : "outline"}
                      onClick={() => handleConfidenceChange(level)}
                      className="flex-1"
                    >
                      {level}
                    </GameButton>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  1: 확신 없음 → 5: 매우 확신함
                </p>
              </motion.div>
            )}

            {/* 기권 옵션 */}
            {allowAbstention && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      또는
                    </span>
                  </div>
                </div>

                <GameButton
                  type="button"
                  variant="ghost"
                  onClick={handleAbstention}
                  disabled={disabled || isSubmitting}
                  className="w-full"
                >
                  기권하기
                </GameButton>
              </div>
            )}

            {/* 에러 메시지 */}
            {errors.targetPlayerId && (
              <p className="text-sm text-destructive mt-1">
                {errors.targetPlayerId.message}
              </p>
            )}

            {/* 선택 확인 */}
            {selectedPlayerId && selectedPlayerId !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    선택됨
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {selectedPlayerId === -1
                    ? "기권하기를 선택했습니다"
                    : `${players.find(p => p.userId === selectedPlayerId)?.nickname}에게 투표합니다`
                  }
                  {showConfidence && selectedPlayerId !== -1 && (
                    <span className="ml-2">
                      (확신도: {confidence}/5)
                    </span>
                  )}
                </p>
              </motion.div>
            )}

            {/* 투표 버튼 */}
            <div className="flex gap-3 pt-4">
              <GameButton
                type="submit"
                variant="game-primary"
                disabled={
                  (!selectedPlayerId || selectedPlayerId === 0) ||
                  disabled ||
                  isSubmitting
                }
                loading={isSubmitting}
                className="flex-1"
                animation={selectedPlayerId ? "pulse" : "none"}
                particleEffect={!isSubmitting}
              >
                {isSubmitting ? "투표 중..." : "투표하기"}
              </GameButton>

              {selectedPlayerId && selectedPlayerId !== 0 && (
                <GameButton
                  type="button"
                  variant="outline"
                  onClick={resetSelection}
                  disabled={isSubmitting}
                >
                  취소
                </GameButton>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { VotingPanel }
