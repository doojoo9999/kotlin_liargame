import React from 'react'
import {useRealtimeCountdown, useRealtimeReadyStatus} from '@/hooks/useRealtimeGameStatus'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {AlertCircle, CheckCircle, Clock, Crown, MoreVertical, Play, Users, X} from 'lucide-react'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface GameStartPanelProps {
  gameNumber: number
  playerCount: number
  minPlayers: number
  maxPlayers: number
  isOwner?: boolean
  myPlayerId?: number
}

export const GameStartPanel: React.FC<GameStartPanelProps> = ({
  gameNumber,
  playerCount,
  minPlayers,
  maxPlayers,
  isOwner,
  myPlayerId,
}) => {
  const { readyPlayers, toggleReady, loading: readyLoading, error: readyError } = useRealtimeReadyStatus(gameNumber)
  const { countdown, startCountdown, cancelCountdown, loading: countdownLoading, error: countdownError } = useRealtimeCountdown(gameNumber)
  
  const loading = readyLoading || countdownLoading
  const error = readyError || countdownError

  const handleToggleReady = async () => {
    if (loading) return
    await toggleReady()
  }

  const handleStartCountdown = async () => {
    if (loading) return
    await startCountdown()
  }

  const handleCancelCountdown = async () => {
    if (loading) return
    await cancelCountdown()
  }

  const readyCount = readyPlayers.filter(p => p.isReady).length
  const isMeReady = readyPlayers.find(p => p.playerId === myPlayerId)?.isReady ?? false

  const pct = countdown?.isActive && countdown.durationSeconds
    ? ((countdown.durationSeconds - (countdown.remainingSeconds ?? 0)) / countdown.durationSeconds) * 100
    : 0

  const allReady = readyCount === playerCount && playerCount >= minPlayers
  const canOwnerStart = isOwner && allReady && !countdown?.isActive
  
  const handleTransferHost = (targetPlayer: any) => {
    // TODO: Implement host transfer API call
    console.log('Transfer host to:', targetPlayer)
  }
  
  const handleKickPlayer = (targetPlayer: any) => {
    // TODO: Implement kick player API call
    console.log('Kick player:', targetPlayer)
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            게임 준비 상태
            {isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
            <Badge variant="secondary" className="ml-2">
              {playerCount}/{maxPlayers}
            </Badge>
          </div>
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('Modify settings')}>
                  게임 설정 변경
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => console.log('Reset game')}
                >
                  게임 초기화
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
        <Progress 
          value={(readyCount / Math.max(playerCount, 1)) * 100} 
          aria-label={`게임 준비 상태: ${readyCount}명 중 ${playerCount}명 준비 완료`}
        />

        {/* Actions - 모바일 최적화 */}
        {error && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <Button 
            size="sm" 
            onClick={handleToggleReady} 
            variant={isMeReady ? 'secondary' : 'default'}
            disabled={loading}
            aria-label={isMeReady ? '준비 상태 취소' : '게임 준비 완료'}
            className="text-xs sm:text-sm"
          >
            {isMeReady ? '준비 취소' : '준비'}
          </Button>

          {canOwnerStart && (
            <Button 
              size="sm" 
              onClick={handleStartCountdown} 
              disabled={loading || !allReady}
              aria-label="게임 시작 카운트다운 시작"
              className="text-xs sm:text-sm"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">카운트다운 시작</span>
              <span className="sm:hidden">시작</span>
            </Button>
          )}

          {countdown?.isActive && isOwner && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancelCountdown}
              disabled={loading}
              aria-label="카운트다운 취소"
              className="text-xs sm:text-sm"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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

        {/* 플레이어 목록 (방장인 경우에만 표시) */}
        {isOwner && readyPlayers.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">플레이어 관리</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {readyPlayers.map((player) => (
                <div key={player.playerId} className="flex items-center justify-between text-xs p-1 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {player.isOwner && <Crown className="h-3 w-3 text-yellow-500" />}
                    <span>{player.nickname}</span>
                    {player.isReady ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Clock className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                  {!player.isOwner && isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTransferHost(player)}>
                          방장 이양
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleKickPlayer(player)}
                        >
                          강퇴
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          최소 {minPlayers}명 필요. 모두 준비 시 방장이 시작할 수 있습니다.
        </div>
      </CardContent>
    </Card>
  )
}

