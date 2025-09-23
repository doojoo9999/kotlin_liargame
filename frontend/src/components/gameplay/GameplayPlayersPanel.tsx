import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import type {PlayerSummary} from '@/stores/gameplayStore'

interface GameplayPlayersPanelProps {
  players: PlayerSummary[]
  activePlayerId?: number | null
  accusedPlayerId?: number | null
}

const PLAYER_STATE_LABEL: Record<string, string> = {
  WAITING: '대기',
  READY: '준비 완료',
  PLAYING: '게임 중',
  ELIMINATED: '탈락',
  SPECTATING: '관전'
}

export function GameplayPlayersPanel({ players, activePlayerId, accusedPlayerId }: GameplayPlayersPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">플레이어 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground">아직 참여한 플레이어가 없습니다.</p>
        )}
        <ul className="space-y-2">
          {players.map((player) => {
            const initials = player.nickname.slice(0, 2).toUpperCase()
            const isActive = activePlayerId === player.id
            const isAccused = accusedPlayerId === player.id
            const voteBadge = player.votesReceived != null ? `${player.votesReceived}표` : null

            return (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-md border border-border/60 p-3 text-sm"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{player.nickname}</span>
                    <Badge variant={player.isAlive ? 'secondary' : 'destructive'}>
                      {player.isAlive ? '생존' : '탈락'}
                    </Badge>
                    {isActive && <Badge variant="outline">발언 중</Badge>}
                    {isAccused && <Badge variant="destructive">지목됨</Badge>}
                    {player.hasVoted && <Badge variant="outline">투표 완료</Badge>}
                    {voteBadge && <Badge variant="outline">{voteBadge}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    상태: {PLAYER_STATE_LABEL[player.state] ?? player.state}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
