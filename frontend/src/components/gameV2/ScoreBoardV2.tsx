import React from 'react'
import type {PlayerID} from '@/types/game'

export interface ScoreChange {
  playerId: PlayerID
  delta: number
}

export interface ScoreBoardEntry {
  id: PlayerID
  nickname: string
  score: number
  isCurrentPlayer?: boolean
}

export interface ScoreBoardV2Props {
  entries: ScoreBoardEntry[]
  className?: string
}

export function ScoreBoardV2({ entries = [], className }: ScoreBoardV2Props) {
  // Sort entries by score (highest first)
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score)

  return (
    <div className={`rounded border bg-card p-3 ${className || ''}`}>
      <div className="font-semibold mb-2">점수판</div>
      <div className="space-y-2">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`flex items-center justify-between text-sm p-2 rounded ${
                entry.isCurrentPlayer 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-600">#{index + 1}</span>
                <span className={entry.isCurrentPlayer ? 'font-semibold text-blue-700' : ''}>
                  {entry.nickname}
                </span>
              </div>
              <span className="font-semibold">{entry.score}점</span>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 text-sm py-4">
            점수 정보가 없습니다
          </div>
        )}
      </div>
    </div>
  )
}

export default ScoreBoardV2