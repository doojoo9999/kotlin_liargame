import React from 'react'
import type {CountdownResponse, PlayerReadyResponse} from '@/types/realtime'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {CheckCircle, Clock, Play, Users, X} from 'lucide-react'

export interface GameStartPanelProps {
  playerCount: number
  minPlayers: number
  maxPlayers: number
  readyPlayers: PlayerReadyResponse[]
  countdown?: CountdownResponse
  canStartGame: boolean
  isOwner?: boolean
  myPlayerId?: number
  onToggleReady?: () => void
  onStartCountdown?: () => void
  onCancelCountdown?: () => void
}

export const GameStartPanel: React.FC<GameStartPanelProps> = ({
  playerCount,
  minPlayers,
  maxPlayers,
  readyPlayers,
  countdown,
  canStartGame,
  isOwner,
  myPlayerId,
  onToggleReady,
  onStartCountdown,
  onCancelCountdown,
}) => {
  const readyCount = readyPlayers.filter(p => p.isReady).length
  const isMeReady = readyPlayers.find(p => p.playerId === myPlayerId)?.isReady ?? false

  const pct = countdown?.isActive && countdown.durationSeconds
    ? ((countdown.durationSeconds - (countdown.remainingSeconds ?? 0)) / countdown.durationSeconds) * 100
    : 0

  const allReady = readyCount === playerCount && playerCount >= minPlayers
  const canOwnerStart = isOwner && canStartGame && !countdown?.isActive

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          게임 준비 상태
          <Badge variant="secondary" className="ml-2">
            {playerCount}/{maxPlayers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>준비 완료</span>
          </div>
          <span className="font-medium">{readyCount} / {playerCount}</span>
        </div>
        <Progress value={(readyCount / Math.max(playerCount, 1)) * 100} />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={onToggleReady} variant={isMeReady ? 'secondary' : 'default'}>
            {isMeReady ? '준비 취소' : '준비'}
          </Button>

          {canOwnerStart && (
            <Button size="sm" onClick={onStartCountdown} disabled={!allReady}>
              <Play className="h-4 w-4 mr-1" />
              카운트다운 시작
            </Button>
          )}

          {countdown?.isActive && (
            <Button size="sm" variant="outline" onClick={onCancelCountdown}>
              <X className="h-4 w-4 mr-1" />
              취소
            </Button>
          )}
        </div>

        {/* Countdown */}
        {countdown?.isActive && (
          <div className="rounded-md border p-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>게임 시작까지</span>
              </div>
              <span className="font-semibold">{countdown.remainingSeconds ?? countdown.durationSeconds}s</span>
            </div>
            <Progress value={pct} />
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          최소 {minPlayers}명 필요. 모두 준비 시 방장이 시작할 수 있습니다.
        </div>
      </CardContent>
    </Card>
  )
}

