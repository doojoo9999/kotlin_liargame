import React from 'react'
import type {GamePhase} from '@/types/backendTypes'
import {Badge} from '@/components/ui/badge'
import {Clock, Eye, MessageSquare, Shield, Trophy, Vote} from 'lucide-react'

export interface GamePhaseIndicatorProps {
  phase: GamePhase
  timeRemaining?: number
  className?: string
}

const phaseConfig = {
  WAITING_FOR_PLAYERS: {
    label: '플레이어 대기 중',
    color: 'bg-gray-100 text-gray-700',
    icon: <Clock className="h-4 w-4" />
  },
  SPEECH: {
    label: '힌트 제공',
    color: 'bg-blue-100 text-blue-700',
    icon: <MessageSquare className="h-4 w-4" />
  },
  VOTING_FOR_LIAR: {
    label: '라이어 투표',
    color: 'bg-orange-100 text-orange-700',
    icon: <Vote className="h-4 w-4" />
  },
  DEFENDING: {
    label: '변론 시간',
    color: 'bg-purple-100 text-purple-700',
    icon: <Shield className="h-4 w-4" />
  },
  VOTING_FOR_SURVIVAL: {
    label: '생존 투표',
    color: 'bg-red-100 text-red-700',
    icon: <Vote className="h-4 w-4" />
  },
  GUESSING_WORD: {
    label: '정답 추리',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <Eye className="h-4 w-4" />
  },
  GAME_OVER: {
    label: '게임 종료',
    color: 'bg-green-100 text-green-700',
    icon: <Trophy className="h-4 w-4" />
  }
}

export const GamePhaseIndicator: React.FC<GamePhaseIndicatorProps> = ({
  phase,
  timeRemaining,
  className
}) => {
  const config = phaseConfig[phase] || phaseConfig.WAITING_FOR_PLAYERS
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center space-x-3 ${className || ''}`}>
      <Badge variant="secondary" className={`${config.color} border-0`}>
        <div className="flex items-center space-x-2">
          {config.icon}
          <span className="font-medium">{config.label}</span>
        </div>
      </Badge>
      
      {timeRemaining !== undefined && timeRemaining > 0 && (
        <div className={`flex items-center space-x-1 text-sm ${
          timeRemaining <= 30 ? 'text-red-600 font-semibold' : 'text-gray-600'
        }`}>
          <Clock className="h-3 w-3" />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      )}
    </div>
  )
}

export default GamePhaseIndicator