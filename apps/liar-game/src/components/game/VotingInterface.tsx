import * as React from 'react'
import type {Player} from '@/types/game'
import {cn} from '@/lib/utils'

export type VoteType = 'LIAR' | 'SURVIVAL'
export interface VotingInterfaceProps { players: Player[]; currentUserId: string; phase: 'VOTING_FOR_LIAR' | 'VOTING_FOR_SURVIVAL'; onVote: (targetId: string, voteType: VoteType)=>void; timeRemaining: number }

export const VotingInterface: React.FC<VotingInterfaceProps> = ({players,currentUserId,phase,onVote,timeRemaining}) => {
  const [selected,setSelected] = React.useState<string | null>(null)
  const handleSelect = (id: string) => { setSelected(id) }
  const submit = () => { if(selected) onVote(selected, phase==='VOTING_FOR_LIAR'?'LIAR':'SURVIVAL') }
  return (
    <div className='space-y-4' aria-label='투표 인터페이스'>
      <header className='flex items-center justify-between text-sm text-gray-600'>
        <span>{phase==='VOTING_FOR_LIAR'?'라이어 지목':'생존 투표'}</span>
        <span>남은시간 {timeRemaining}s</span>
      </header>
      <ul className='grid grid-cols-2 gap-2'>
        {players.filter(p=>p.id!==currentUserId && p.isAlive!==false).map(p=> (
          <li key={p.id}>
            <button type='button' onClick={()=>handleSelect(p.id)} className={cn('w-full rounded border px-3 py-2 text-sm transition', selected===p.id?'bg-primary-600 text-white border-primary-600':'hover:border-primary-400')}>{p.nickname}</button>
          </li>
        ))}
      </ul>
      <div className='flex justify-end'>
        <button disabled={!selected} onClick={submit} className='px-4 py-2 rounded bg-primary-600 text-white text-sm disabled:opacity-50'>투표</button>
      </div>
    </div>
  )
}
void VotingInterface

