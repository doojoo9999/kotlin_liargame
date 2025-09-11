import React from 'react'
import {Button} from '@/components/ui/button'

export function WaitingPhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center space-y-4">
      <div className="text-lg">플레이어가 준비되면 게임을 시작하세요.</div>
      <Button onClick={onStart} size="lg">게임 시작</Button>
    </div>
  )
}

