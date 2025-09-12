import * as React from 'react'
import {cn} from '@/lib/utils'

export interface VoteOption { id: string; label: string; disabled?: boolean; meta?: string }
export interface VoteSelectionProps { options: VoteOption[]; value: string | string[]; onChange: (v:string|string[])=>void; multiple?: boolean; disabled?: boolean; showResults?: boolean }

export const VoteSelection: React.FC<VoteSelectionProps> = ({options,value,onChange,multiple=false,disabled,showResults}) => {
  const isSelected = (id:string) => Array.isArray(value)? value.includes(id) : value===id
  const toggle = (id:string) => {
    if(disabled) return
    if(multiple){
      const arr = Array.isArray(value)? [...value] : []
      const idx = arr.indexOf(id)
      if(idx>=0){
        arr.splice(idx,1)
      } else {
        arr.push(id)
      }
      onChange(arr)
    } else {
      onChange(id)
    }
  }
  return (
    <ul className={cn('grid gap-2', multiple?'grid-cols-2':'grid-cols-1')} aria-label='투표 선택'>
      {options.map(o=> {
        const active = isSelected(o.id)
        return (
          <li key={o.id}>
            <button type='button' disabled={disabled||o.disabled} onClick={()=>toggle(o.id)} className={cn('w-full rounded border px-3 py-2 text-sm text-left transition', active?'bg-primary-600 text-white border-primary-600':'hover:border-primary-400 disabled:opacity-40')}>
              <span className='font-medium'>{o.label}</span>
              {showResults && o.meta && <span className='ml-2 text-xs opacity-80'>{o.meta}</span>}
            </button>
          </li>
        )
      })}
      {options.length===0 && <li className='text-xs text-gray-400'>옵션 없음</li>}
    </ul>
  )
}
void VoteSelection
