import React from 'react'
import type {VotingStatusResponse} from '@/types/realtime'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Gavel, Users} from 'lucide-react'

export interface VotingStatusPanelProps {
  status?: VotingStatusResponse
}

export const VotingStatusPanel: React.FC<VotingStatusPanelProps> = ({ status }) => {
  const required = status?.requiredVotes ?? 0
  const current = status?.currentVotes ?? 0
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 0

  const notVoted = (status?.playerVotes ?? []).filter(p => !p.hasVoted)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4" />
          투표 현황
          <Badge variant="secondary" className="ml-2">
            {current} / {required}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} />
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          <span>투표 단계: {status?.votingPhase ?? '-'}</span>
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
