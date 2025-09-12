import * as React from 'react'
import type {ActivityEvent} from '@/types/game'

export interface ActivityFeedProps { events: ActivityEvent[]; maxEvents?: number; showTimestamps?: boolean; autoScroll?: boolean; className?: string }

export const ActivityFeed: React.FC<ActivityFeedProps> = ({events,maxEvents=50,showTimestamps=true,autoScroll=true,className}) => {
  const ref = React.useRef<HTMLUListElement>(null)
  const trimmed = events.slice(-maxEvents)
  React.useEffect(()=>{ if(autoScroll && ref.current){ ref.current.scrollTop = ref.current.scrollHeight } },[trimmed,autoScroll])
  return (
    <div className={className} aria-label='이벤트 피드'>
      <ul ref={ref} className='space-y-1 max-h-64 overflow-y-auto text-xs'>
        {trimmed.map(e=> (
          <li key={e.id} className='flex gap-2 items-start'>
            {showTimestamps && <span className='text-gray-400 shrink-0'>{new Date(e.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</span>}
            <span className={e.highlight?'font-semibold text-primary-600':''}>{e.type}{e.content?`: ${e.content}`:''}</span>
          </li>
        ))}
        {trimmed.length===0 && <li className='text-gray-400'>이벤트 없음</li>}
      </ul>
    </div>
  )
}
void ActivityFeed

