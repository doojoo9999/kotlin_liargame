import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import type {Player} from '@/stores'
import {CheckCircle2, Clock, Crown, Loader2, Users} from 'lucide-react'

interface WaitingRoomControlsProps {
  players: Player[]
  currentPlayer: Player | null
  readyPlayers: number
  totalPlayers: number
  minimumPlayers?: number
  onToggleReady: () => void | Promise<void>
  onStartGame?: () => void | Promise<void>
  isTogglePending?: boolean
  isStartPending?: boolean
  canStartGame: boolean
}

export function WaitingRoomControls({
  players,
  currentPlayer,
  readyPlayers,
  totalPlayers,
  minimumPlayers = 3,
  onToggleReady,
  onStartGame,
  isTogglePending = false,
  isStartPending = false,
  canStartGame,
}: WaitingRoomControlsProps) {
  const isHost = Boolean(currentPlayer?.isHost)
  const isReady = Boolean(currentPlayer?.isReady)
  const awaitingPlayers = Math.max(totalPlayers - readyPlayers, 0)
  const needsMorePlayers = totalPlayers < minimumPlayers

  let statusMessage: string
  if (needsMorePlayers) {
    const remaining = minimumPlayers - totalPlayers
    statusMessage = `${minimumPlayers}명 이상 모여야 게임을 시작할 수 있어요. 현재 ${totalPlayers}명이며 ${remaining}명이 더 필요합니다.`
  } else if (!canStartGame) {
    statusMessage = awaitingPlayers === 0
      ? '서버 조건을 기다리는 중입니다. 잠시 후 다시 시도해주세요.'
      : `남은 ${awaitingPlayers}명이 준비하면 게임을 시작할 수 있어요.`
  } else {
    statusMessage = isHost
      ? '모든 플레이어가 준비되었습니다. 지금 게임을 시작할 수 있어요.'
      : '모든 플레이어가 준비되었습니다. 방장이 곧 게임을 시작할 거예요.'
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#181823]/90 px-5 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="font-semibold text-foreground">
            {readyPlayers}/{totalPlayers} 준비 완료
          </span>
          <Badge variant="outline" className="text-[11px]">
            최소 {minimumPlayers}명
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onToggleReady}
            disabled={isTogglePending}
            className={`h-10 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.25)] transition-all ${
              isReady
                ? 'bg-[#3b3c4a] hover:bg-[#444558]'
                : 'bg-gradient-to-r from-[#8b5cf6] via-[#9c6cf6] to-[#a855f7] hover:from-[#9d6df6] hover:to-[#b46cf6]'
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {isTogglePending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isReady ? '준비 해제' : '준비 완료'}
          </Button>

          {isHost && onStartGame && (
            <Button
              size="sm"
              onClick={onStartGame}
              disabled={!canStartGame || isStartPending || needsMorePlayers}
              className={`h-10 rounded-xl px-4 text-sm font-semibold transition-all ${
                !canStartGame || needsMorePlayers
                  ? 'border border-white/10 bg-[#252633] text-muted-foreground shadow-none'
                  : 'bg-emerald-500 text-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.25)] hover:bg-emerald-400'
              } disabled:cursor-not-allowed disabled:opacity-75`}
            >
              {isStartPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crown className="mr-2 h-4 w-4" />
              )}
              게임 시작
            </Button>
          )}
        </div>
      </div>

      <p className="mt-2 text-[12px] text-muted-foreground/80" aria-live="polite">
        {statusMessage}
      </p>

      <div className="mt-3 flex flex-wrap gap-2.5" aria-label="플레이어 준비 상태">
        {players.map((player) => {
          const ready = Boolean(player.isReady)
          const isPlayerHost = Boolean(player.isHost)
          return (
            <span
              key={player.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium tracking-tight ${
                ready
                  ? 'border-emerald-300/50 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 bg-[#20212c] text-muted-foreground'
              } ${player.id === currentPlayer?.id ? 'ring-1 ring-primary/50' : ''}`}
            >
              {ready ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{player.nickname}</span>
              {isPlayerHost && (
                <Crown className="h-3.5 w-3.5 text-amber-400" aria-label="방장" />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
