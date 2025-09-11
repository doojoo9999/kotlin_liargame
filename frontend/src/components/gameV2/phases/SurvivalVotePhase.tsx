import React from 'react'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {Button} from '@/components/ui/button'

export function SurvivalVotePhase() {
  const { players, gameData, castSurvivalVote } = useGameStoreV2(s => ({ players: s.players, gameData: s.gameData, castSurvivalVote: s.castSurvivalVote }))
  const myId = 'me' // TODO: 실제 사용자 ID 연결
  const myVote = (gameData.survivalVotes||[]).find(v => v.voterId === myId)

  return (
    <div className="space-y-3" aria-label="생존 투표">
      <div className="text-sm text-muted-foreground">생존시킬 플레이어를 선택하세요. (변경 가능)</div>
      <div className="grid grid-cols-2 gap-2">
        {players.map(p => (
          <Button key={p.id}
                  variant={myVote?.targetId === p.id ? 'default' : 'outline'}
                  disabled={p.id === myId}
                  onClick={()=> castSurvivalVote(p.id)}
                  className="text-sm py-2">
            {p.nickname}{myVote?.targetId === p.id && ' (내 표)'}
          </Button>
        ))}
      </div>
      {myVote && <div className="text-[11px] text-blue-600">현재 표: {players.find(p=>p.id===myVote.targetId)?.nickname}</div>}
    </div>
  )
}
