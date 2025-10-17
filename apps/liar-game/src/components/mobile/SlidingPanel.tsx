import * as React from 'react'
import {cn} from '@/lib/utils'

export interface SlidingPanelProps { isOpen: boolean; onToggle: ()=>void; position?: 'left'|'right'; overlay?: boolean; width?: string; children: React.ReactNode; className?: string }

export const SlidingPanel: React.FC<SlidingPanelProps> = ({isOpen,onToggle,position='left',overlay=true,width='16rem',children,className}) => {
  return (
    <div className={cn('fixed inset-0 z-40 pointer-events-none', isOpen && 'pointer-events-auto')} aria-hidden={!isOpen}>
      {overlay && <div onClick={onToggle} className={cn('absolute inset-0 bg-black/40 opacity-0 transition', isOpen && 'opacity-100')} />}
      <aside className={cn('absolute top-0 bottom-0 bg-background shadow-xl border w-64 max-w-full transition-transform duration-300 flex flex-col', position==='left'?'left-0 -translate-x-full':'right-0 translate-x-full', isOpen && 'translate-x-0', className)} style={{width}} role='complementary'>
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </aside>
    </div>
  )
}
void SlidingPanel

