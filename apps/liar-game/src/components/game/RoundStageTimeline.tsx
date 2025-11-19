import {motion} from 'framer-motion'
import {AlertTriangle, CheckCircle2, CircleDot, Clock} from 'lucide-react'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import type {GamePhase} from '@/types/backendTypes'
import type {GameTimer, RoundUxStage} from '@/stores/unified/types'

interface RoundStageTimelineProps {
  round: number
  totalRounds: number
  stage: RoundUxStage
  hasRoundStarted: boolean
  currentPhase: GamePhase
  currentTopic: string | null
  timer: GameTimer
  stageEnteredAt: number | null
}

type StepStatus = 'done' | 'active' | 'upcoming'

const stepDefinitions = [
  { id: 'topic', label: '주제 공개', helper: '진행자가 시민 주제를 공개합니다.' },
  { id: 'liar', label: '라이어 지정', helper: '라이어가 비밀리에 지정됩니다.' },
  { id: 'speech', label: '발언 제출', helper: '모든 플레이어가 힌트를 제출합니다.' },
  { id: 'debate', label: '토론', helper: '의심 플레이어의 변론을 듣습니다.' },
  { id: 'vote', label: '투표', helper: '라이어 또는 처형 여부를 투표로 결정합니다.' },
  { id: 'results', label: '결과 확인', helper: '라운드 결과와 점수를 집계합니다.' },
] as const

const stageIndexMap: Record<RoundUxStage, number> = {
  waiting: 0,
  speech: 2,
  debate: 3,
  vote: 4,
  results: 5,
}

export function RoundStageTimeline({
  round,
  totalRounds,
  stage,
  hasRoundStarted,
  currentPhase,
  currentTopic,
  timer,
  stageEnteredAt,
}: RoundStageTimelineProps) {
  const topicRevealed = Boolean(currentTopic)
  const activeIndex = (() => {
    if (!hasRoundStarted) {
      return topicRevealed ? 1 : 0
    }
    return stageIndexMap[stage] ?? 0
  })()

  const stepStatuses: StepStatus[] = stepDefinitions.map((definition, index) => {
    if (definition.id === 'topic') {
      if (topicRevealed) return 'done'
      return activeIndex === index ? 'active' : 'upcoming'
    }

    if (definition.id === 'liar') {
      if (!hasRoundStarted) {
        return activeIndex === index ? 'active' : 'upcoming'
      }
      if (activeIndex <= index) {
        return activeIndex === index ? 'active' : 'done'
      }
      return 'done'
    }

    if (index < activeIndex) return 'done'
    if (index === activeIndex) return 'active'
    return 'upcoming'
  })

  const completedCount = stepStatuses.filter((status) => status === 'done').length
  const progressValue = (completedCount / (stepDefinitions.length - 1)) * 100

  const remainingSeconds = Math.max(0, timer.timeRemaining ?? 0)
  const timerStatus = remainingSeconds === 0 ? 'idle' : remainingSeconds <= 10 ? 'critical' : remainingSeconds <= 30 ? 'warning' : 'normal'
  const timerTextClass = timerStatus === 'critical'
    ? 'text-destructive font-semibold'
    : timerStatus === 'warning'
      ? 'text-amber-600 font-medium'
      : 'text-muted-foreground'
  const progressIndicatorClass = timerStatus === 'critical'
    ? 'bg-destructive'
    : timerStatus === 'warning'
      ? 'bg-amber-500'
      : undefined

  const renderIcon = (status: StepStatus) => {
    if (status === 'done') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (status === 'active') {
      return <CircleDot className="h-4 w-4 text-primary" />
    }
    return <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">현재 라운드</div>
            <div className="text-lg font-semibold">라운드 {round || 0} / {totalRounds || 0}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm" role="status" aria-live="polite">
            <div className={`flex items-center gap-2 font-mono ${timerTextClass}`}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              {remainingSeconds > 0
                ? `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
                : stageEnteredAt
                  ? '연동 중'
                  : '대기 중'}
            </div>
            {timerStatus === 'critical' && (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs uppercase tracking-wide" role="alert">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                마지막 10초!
              </Badge>
            )}
          </div>
        </div>

        <Progress value={progressValue} className="h-2 bg-muted" indicatorClassName={progressIndicatorClass} aria-label="라운드 진행률" />

        <div className="grid gap-3 md:grid-cols-3">
          {stepDefinitions.map((definition, index) => {
            const status = stepStatuses[index]
            const isActive = status === 'active'
            const isDone = status === 'done'

            return (
              <motion.div
                key={definition.id}
                layout
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className={`rounded-lg border p-3 text-sm transition-colors ${
                  isActive ? 'border-primary/60 bg-primary/5' : isDone ? 'border-muted bg-muted/30' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {renderIcon(status)}
                  <span>{definition.label}</span>
                  {isActive && (
                    <Badge className="ml-auto text-xs" variant="secondary">
                      진행 중
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {definition.id === 'topic' && topicRevealed && currentTopic
                    ? `공개 주제: "${currentTopic}"`
                    : definition.helper}
                </p>
                {definition.id === 'results' && currentPhase === 'GAME_OVER' && (
                  <p className="mt-2 text-xs text-primary">
                    결과 정리가 완료되면 다음 라운드를 시작할 수 있습니다.
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
