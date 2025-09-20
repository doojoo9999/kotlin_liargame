import * as React from 'react'
import {cn} from '@/lib/utils'

export interface BottomSheetProps { isOpen: boolean; onClose: ()=>void; title?: string; height?: 'auto'|'50vh'|'75vh'|'90vh'; children: React.ReactNode; className?: string }

export const BottomSheet: React.FC<BottomSheetProps> = ({isOpen,onClose,title,height='75vh',children,className}) => {
  React.useEffect(()=> {
    const handler = (e: KeyboardEvent) => { if(e.key==='Escape') onClose() }
    if(isOpen) window.addEventListener('keydown', handler)
    return ()=> window.removeEventListener('keydown', handler)
  },[isOpen,onClose])

  return (
    <div aria-hidden={!isOpen} className={cn('fixed inset-0 z-50 transition pointer-events-none', isOpen && 'pointer-events-auto')}>
      <div onClick={onClose} className={cn('absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 transition', isOpen && 'opacity-100')} />
      <div className={cn('absolute left-0 right-0 bottom-0 translate-y-full rounded-t-2xl bg-background shadow-xl border-t border-gray-200 flex flex-col overflow-hidden transition-transform duration-300', isOpen && 'translate-y-0', className)} style={{height: height==='auto'? undefined: height}} role='dialog' aria-modal='true'>
        <div className='h-1.5 w-12 bg-gray-300 rounded-full mx-auto my-2' aria-hidden />
        {title && <h3 className='px-4 pb-2 text-sm font-semibold'>{title}</h3>}
        <div className='flex-1 overflow-y-auto px-4 pb-4'>{children}</div>
      </div>
    </div>
  )
}
void BottomSheet

