import * as React from 'react'
import {cn} from '@/lib/utils'

export interface TabItem { id: string; label: string; icon?: React.ReactNode; badge?: number }
export interface MobileTabBarProps { tabs: TabItem[]; activeTab: string; onChange: (id:string)=>void; position?: 'bottom'|'top'; className?: string }

export const MobileTabBar: React.FC<MobileTabBarProps> = ({tabs,activeTab,onChange,position='bottom',className}) => {
  return (
    <nav className={cn('fixed left-0 right-0 z-40 bg-background/90 backdrop-blur border-t flex justify-around', position==='top' && 'top-0 border-b border-t-0', position==='bottom' && 'bottom-0', className)} aria-label='모바일 탭바'>
      {tabs.map(t=> {
        const active = t.id===activeTab
        return (
          <button key={t.id} onClick={()=>onChange(t.id)} className={cn('flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition', active?'text-primary-600':'text-gray-500 hover:text-gray-700')} aria-current={active?'page':undefined}>
            {t.icon && <span className='h-5 w-5' aria-hidden>{t.icon}</span>}
            <span>{t.label}</span>
            {typeof t.badge==='number' && t.badge>0 && <span className='absolute mt-[-6px] ml-6 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white'>{t.badge}</span>}
          </button>
        )
      })}
    </nav>
  )
}
void MobileTabBar

