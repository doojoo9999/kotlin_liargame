import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'

interface GameplayPhaseSummaryProps {
  phase: string
  endsAt?: string | null
  countdownSeconds?: number | null
  activePlayerName?: string | null
  accusedPlayerName?: string | null
  lastEventType?: string | null
}

const PHASE_LABELS: Record<string, string> = {
  WAITING_FOR_PLAYERS: '플레이어 대기',
  READY_CHECK: '준비 확인',
  SUBJECT_PRESENTATION: '주제 공개',
  LIAR_SELECTION: '라이어 선정',
  SPEECH: '자유 발언',
  DISCUSSION: '토론',
  DEFENSE: '변론',
  VOTING: '투표 진행',
  FINAL_VOTING: '최종 투표',
  GUESSING_WORD: '라이어 단어 추측',
  RESULTS: '결과 정산',
  GAME_OVER: '게임 종료'
}

const getPhaseLabel = (phase: string): string => {
  return PHASE_LABELS[phase] ?? phase.replace(/_/g, ' ')
}

const formatRemaining = (seconds?: number | null): string => {
  if (seconds == null) {
    return '—'
  }
  const clamped = Math.max(seconds, 0)
  const minutes = Math.floor(clamped / 60)
  const secs = clamped % 60
  if (minutes > 0) {
    return `${minutes}분 ${secs.toString().padStart(2, '0')}초`
  }
  return `${secs}초`
}

export function GameplayPhaseSummary({
  phase,
  endsAt,
  countdownSeconds,
  activePlayerName,
  accusedPlayerName,
  lastEventType
}: GameplayPhaseSummaryProps) {
  const label = getPhaseLabel(phase)
  const remainingLabel = formatRemaining(countdownSeconds)
  const hasCountdown = countdownSeconds != null && countdownSeconds > 0
  const progressValue = hasCountdown
    ? Math.max(0, Math.min(100, (countdownSeconds / 120) * 100))
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Badge variant="outline" className="uppercase text-xs tracking-wide">
            {phase}
          </Badge>
          <span className="text-lg font-semibold">{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
          <span>남은 시간: <span className="font-medium text-foreground">{remainingLabel}</span></span>
          {endsAt && <span>종료 예정: {new Date(endsAt).toLocaleTimeString()}</span>}
          {lastEventType && (
            <span>최근 이벤트: <span className="font-medium text-foreground">{lastEventType}</span></span>
          )}
        </div>
        {(activePlayerName || accusedPlayerName) && (
          <div className="flex flex-wrap gap-4 text-sm">
            {activePlayerName && (
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold">발언자</span>
                <span>{activePlayerName}</span>
              </span>
            )}
            {accusedPlayerName && (
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold">지목</span>
                <span>{accusedPlayerName}</span>
              </span>
            )}
          </div>
        )}
        {progressValue != null && (
          <Progress value={progressValue} aria-label={`남은 시간 ${remainingLabel}`} />
        )}
      </CardContent>
    </Card>
  )
}
