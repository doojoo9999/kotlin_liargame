import React from 'react'
import {useRealtimeVotingStatus} from '@/hooks/useRealtimeGameStatus'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {AlertCircle, Gavel, Shuffle, Users} from 'lucide-react'
import {Alert, AlertDescription} from '@/components/ui/alert'

export interface VotingStatusPanelProps {
  gameNumber: number
}

export const VotingStatusPanel: React.FC<VotingStatusPanelProps> = ({ gameNumber }) => {
  const { votingStatus, error } = useRealtimeVotingStatus(gameNumber)
  const status = votingStatus

  const required = status?.requiredVotes ?? 0
  const current = status?.currentVotes ?? 0
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 0

  const notVoted = (status?.playerVotes ?? []).filter(p => !p.hasVoted)
  const isTieBreaker = status?.votingPhase === 'TIE_BREAKER'

  const getVotingPhaseText = (phase: string) => {
    switch (phase) {
      case 'LIAR_ELIMINATION': return '라이어 찾기 투표'
      case 'SURVIVAL_VOTE': return '생존 투표'
      case 'TIE_BREAKER': return '동점 결정전'
      case 'ACCUSATION': return '고발 투표'
      case 'DEFENSE': return '변론 단계'
      case 'COMPLETED': return '투표 완료'
      default: return phase || '-'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isTieBreaker ? <Shuffle className="h-4 w-4" /> : <Gavel className="h-4 w-4" />}
          투표 현황
          <Badge variant={isTieBreaker ? "destructive" : "secondary"} className="ml-2">
            {current} / {required}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Progress value={pct} />
        {isTieBreaker && (
          <Alert className="border-orange-200 bg-orange-50">
            <Shuffle className="h-4 w-4" />
            <AlertDescription>
              동점 상황입니다! 시스템에서 자동으로 한 명을 선택합니다.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          <span>투표 단계: {getVotingPhaseText(status?.votingPhase ?? '')}</span>
        </div>
        {notVoted.length > 0 && (
          <div className="text-xs text-muted-foreground">
            아직 투표하지 않음: {notVoted.map(p => p.nickname).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
