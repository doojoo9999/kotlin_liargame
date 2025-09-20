import * as React from 'react'

export interface ScoreChange { playerId: string; delta: number; timestamp: number }
export interface ScoreTrackerProps { scores: Record<string, number>; recentChanges: ScoreChange[]; targetScore: number; animateChanges?: boolean }

export const ScoreTracker: React.FC<ScoreTrackerProps> = ({scores,recentChanges,targetScore,animateChanges=true}) => {
  const players = Object.keys(scores)
  return (
    <div className='space-y-3' aria-label='점수 보드'>
      <h3 className='text-sm font-semibold'>점수</h3>
      <ul className='space-y-1 text-xs'>
        {players.map(pid => {
          const val = scores[pid]
          const pct = Math.min(100, (val/targetScore)*100)
          return (
            <li key={pid} className='space-y-1'>
              <div className='flex items-center justify-between'><span className='font-medium'>{pid}</span><span>{val}</span></div>
              <div className='h-1.5 bg-gray-200 rounded overflow-hidden'>
                <div className='h-full bg-green-500 transition-all' style={{width: pct+'%'}} />
              </div>
            </li>)
        })}
        {players.length===0 && <li className='text-gray-400'>플레이어 없음</li>}
      </ul>
      {animateChanges && recentChanges.length>0 && (
        <div className='pt-2 border-t'>
          <h4 className='text-[11px] font-medium text-gray-500 mb-1'>최근 변화</h4>
          <ul className='space-y-0.5 max-h-24 overflow-y-auto text-[11px]'>
            {recentChanges.slice(-5).reverse().map(c=> <li key={c.timestamp} className='flex justify-between'><span>{c.playerId}</span><span className={c.delta>=0?'text-green-600':'text-red-600'}>{c.delta>=0?'+':''}{c.delta}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
void ScoreTracker

