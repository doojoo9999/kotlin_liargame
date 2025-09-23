import {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import type {PlayerSummary, VotingSnapshot} from '@/stores/gameplayStore'

interface GameplayVotingPanelProps {
  voting: VotingSnapshot | null
  players: PlayerSummary[]
  canVote: boolean
  onVote?: (targetUserId: number) => Promise<void> | void
}

export function GameplayVotingPanel({ voting, players, canVote, onVote }: GameplayVotingPanelProps) {
  const [pendingVote, setPendingVote] = useState<number | null>(null)

  const handleVote = async (userId: number) => {
    if (!onVote) return
    try {
      setPendingVote(userId)
      await onVote(userId)
    } finally {
      setPendingVote(null)
    }
  }

  if (!voting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">투표 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">활성화된 투표 단계가 아닙니다.</p>
        </CardContent>
      </Card>
    )
  }

  const lookupNickname = (userId: number): string => {
    const player = players.find((item) => item.userId === userId)
    return player?.nickname ?? `플레이어 ${userId}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          투표 현황
          <Badge variant="outline">{voting.currentVotes} / {voting.requiredVotes}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>총 인원 {voting.totalPlayers}명</span>
          <span>마감까지 {voting.votingDeadline ? new Date(voting.votingDeadline).toLocaleTimeString() : '—'}</span>
          {voting.canChangeVote && <Badge variant="secondary">재투표 가능</Badge>}
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">투표 완료</h4>
            {voting.votedPlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground">아직 투표한 플레이어가 없습니다.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {voting.votedPlayers.map((voter) => (
                  <li key={voter.userId}>
                    <Badge variant="outline">{lookupNickname(voter.userId)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">투표 대기</h4>
            {voting.pendingPlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground">모든 플레이어가 투표를 완료했습니다.</p>
            ) : (
              <ul className="space-y-2">
                {voting.pendingPlayers.map((pending) => (
                  <li key={pending.userId} className="flex items-center justify-between gap-2">
                    <span>{lookupNickname(pending.userId)}</span>
                    {canVote && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingVote === pending.userId}
                        onClick={() => handleVote(pending.userId)}
                      >
                        {pendingVote === pending.userId ? '전송 중...' : '지목'}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
