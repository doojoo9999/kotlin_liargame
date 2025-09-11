import React from 'react'
import type {Player} from '@/types/game'
import {Button} from '@/components/ui/button'

export function VotingPhase({ players, onVote, myId }: { players: Player[]; onVote: (id: string) => void; myId?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {players.map(p => (
        <Button key={p.id} onClick={() => onVote(p.id)} disabled={p.id === myId}>{p.nickname}</Button>
      ))}
    </div>
  )
}

