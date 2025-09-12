import React, {useEffect, useRef} from 'react'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {ActivityEvent} from '@/types/game'
import {ScrollArea} from '@/components/ui/scroll-area'
import {AlertCircle, Clock, MessageCircle, Search, Shield, Target, Users} from 'lucide-react'

const typeIcon: Record<ActivityEvent['type'], JSX.Element> = {
  hint: <MessageCircle className="h-3.5 w-3.5" />,
  vote: <Target className="h-3.5 w-3.5" />,
  defense: <Shield className="h-3.5 w-3.5" />,
  guess: <Search className="h-3.5 w-3.5" />,
  phase_change: <Clock className="h-3.5 w-3.5" />,
  system: <AlertCircle className="h-3.5 w-3.5" />,
  survival_vote: <Users className="h-3.5 w-3.5" />
}

const typeColor: Record<ActivityEvent['type'], string> = {
  hint: 'text-green-600',
  vote: 'text-red-600',
  defense: 'text-purple-600',
  guess: 'text-orange-600',
  phase_change: 'text-blue-600',
  system: 'text-gray-600',
  survival_vote: 'text-indigo-600'
}

export function ActivityFeedV2() {
  const { activities } = useGameStoreV2(s => ({ activities: s.activities }))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const viewport = ref.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
    if (viewport) viewport.scrollTop = 0
  }, [activities])

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

  return (
    <Card className="h-full flex flex-col" aria-label="활동 피드">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">활동 로그
          <Badge variant="secondary" className="text-[10px] font-normal">{activities.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0 pb-2">
        <ScrollArea ref={ref} className="h-full">
          <div className="space-y-1 pr-2">
            {activities.map(a => (
              <div key={a.id} className={`p-2 rounded border bg-white/60 text-[11px] flex gap-2 items-start ${a.type==='phase_change'?'bg-blue-50':''}`}>
                <span className={`${typeColor[a.type]} mt-0.5`}>{typeIcon[a.type]}</span>
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium truncate">{renderTitle(a)}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(a.timestamp)}</span>
                  </div>
                  {a.content && <div className="text-[10px] text-gray-600 break-words">{a.content}</div>}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-[11px] text-muted-foreground py-6 text-center">아직 활동이 없습니다.</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function renderTitle(a: ActivityEvent) {
  switch (a.type) {
    case 'hint': return '힌트'
    case 'vote': return `투표: ${a.targetId ?? ''}`
    case 'defense': return '변론'
    case 'guess': return '추측'
    case 'phase_change': return '단계 변경'
    case 'system': return '시스템'
    case 'survival_vote': return `생존 투표: ${a.targetId ?? ''}`
    default: return '활동'
  }
}

