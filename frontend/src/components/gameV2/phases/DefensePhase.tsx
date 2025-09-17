import React from 'react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {useGameStoreV2} from '@/stores/gameStoreV2'

export function DefensePhase({ accusedNickname }: { accusedNickname?: string }) {
  const { gameData, submitDefense } = useGameStoreV2(s => ({ gameData: s.gameData, submitDefense: s.submitDefense }))
  const [text, setText] = React.useState('')
  const disabled = !gameData.accusedPlayer || !!gameData.defenseStatement

  if (!gameData.accusedPlayer) {
    return <div className="text-sm text-muted-foreground">지목된 플레이어를 계산 중...</div>
  }

  return (
    <div className="space-y-3" aria-label="변론 단계">
      <div className="text-sm font-medium">지목된 플레이어: <span className="text-red-600">{accusedNickname ?? '알 수 없음'}</span></div>
      {gameData.defenseStatement ? (
        <div className="p-3 rounded border bg-card text-sm" aria-live="polite">
          <span className="font-semibold mr-2">제출된 변론:</span>{gameData.defenseStatement}
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(e)=>{e.preventDefault(); if(!text.trim()) return; submitDefense(text.trim()); setText('')}}>
          <Input value={text} onChange={(e)=> setText(e.target.value.slice(0,120))} placeholder="변론을 입력하세요 (최대 120자)" aria-label="변론 입력" disabled={disabled} />
          <Button type="submit" className="w-full" disabled={disabled || !text.trim()}>변론 제출</Button>
        </form>
      )}
      <p className="text-[11px] text-muted-foreground">※ 변론은 한 번만 제출할 수 있습니다.</p>
    </div>
  )
}
