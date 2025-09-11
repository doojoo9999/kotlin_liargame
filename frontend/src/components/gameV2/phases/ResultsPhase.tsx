import React from 'react'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {Card, CardContent} from '@/components/ui/card'

export function ResultsPhase() {
  const { gameData, scores, players, currentRound } = useGameStoreV2(s => ({
    gameData: s.gameData,
    scores: s.scores,
    players: s.players,
    currentRound: s.currentRound
  }))

  const winners = gameData.results?.winners || []

  return (
    <div className="space-y-4" aria-label="라운드 결과">
      <div>
        <h3 className="font-semibold text-lg">라운드 {currentRound} 결과</h3>
        <p className="text-sm text-muted-foreground mt-1">{gameData.results?.reason || '라운드 종료'}</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="font-medium">점수 현황</div>
          <div className="grid grid-cols-2 gap-2">
            {players.map(p => (
              <div key={p.id} className={`flex justify-between rounded px-2 py-1 border ${winners.includes(p.id)?'bg-green-50 border-green-300':'border-border bg-card'}`}>
                <span className="truncate">{p.nickname}</span>
                <span className="font-semibold">{scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
          {winners.length > 0 && (
            <div className="text-xs text-green-700 mt-2" aria-live="polite">승자: {winners.map(id=> players.find(p=>p.id===id)?.nickname).join(', ')}</div>
          )}
        </CardContent>
      </Card>

      <div className="text-[11px] text-muted-foreground">※ 점수는 라운드 종료 시 자동 집계됩니다.</div>
    </div>
  )
}
