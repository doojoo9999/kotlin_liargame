import React from 'react'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {GamePhase} from '@/types/game'

export function PlayerStatusPanelV2() {
  const { players, gameData, currentPlayer, phase } = useGameStoreV2(s => ({
    players: s.players,
    gameData: s.gameData,
    currentPlayer: s.currentPlayer,
    phase: s.phase
  }))

  const voteCount = React.useCallback((playerId: string) => {
    return gameData.votes.filter(v => v.targetId === playerId).length
  }, [gameData.votes])

  const survivalCount = React.useCallback((playerId: string) => {
    return (gameData.survivalVotes || []).filter(v => v.targetId === playerId).length
  }, [gameData.survivalVotes])

  return (
    <div className="space-y-4" aria-label="플레이어 현황 패널">
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">플레이어 ({players.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {players.map(p => {
            const isTurn = p.id === currentPlayer
            const isAccused = p.id === gameData.accusedPlayer
            const isEliminated = p.id === gameData.eliminatedPlayer
            const vc = voteCount(p.id)
            const sc = survivalCount(p.id)
            return (
              <div key={p.id} className={`p-2 rounded border text-xs flex items-center justify-between gap-2 transition-colors
                ${isTurn ? 'border-blue-300 bg-blue-50' : 'border-border bg-card'}
                ${isAccused ? 'ring-1 ring-red-300' : ''}
                ${isEliminated ? 'opacity-60 line-through' : ''}`}
                aria-label={`${p.nickname} 상태`}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.nickname}{isTurn && ' (턴)'}</div>
                  <div className="text-[10px] text-muted-foreground space-x-1">
                    {isAccused && <span className="text-red-600">지목됨</span>}
                    {isEliminated && <span className="text-amber-600">제거</span>}
                  </div>
                </div>
                {phase === GamePhase.VOTING_FOR_LIAR && vc > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{vc}표</Badge>
                )}
                {phase === GamePhase.VOTING_FOR_SURVIVAL && sc > 0 && (
                  <Badge variant="outline" className="text-[10px]">생존 {sc}</Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-3 text-[11px] space-y-1">
          <div className="flex justify-between"><span>힌트 수</span><span>{gameData.hints.length}</span></div>
          <div className="flex justify-between"><span>투표 수</span><span>{gameData.votes.length}</span></div>
          {phase === GamePhase.VOTING_FOR_SURVIVAL && (
            <div className="flex justify-between"><span>생존표</span><span>{(gameData.survivalVotes||[]).length}</span></div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

