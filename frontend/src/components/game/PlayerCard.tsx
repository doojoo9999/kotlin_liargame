import React from 'react'
import type {FrontendPlayer} from '@/types'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent} from '@/components/ui/card'
import {CheckCircle, Clock, Crown, Eye, Shield, WifiOff} from 'lucide-react'

export interface PlayerCardProps {
  player: FrontendPlayer
  isCurrentPlayer?: boolean
  isCurrentTurn?: boolean
  showRole?: boolean
  voteCount?: number
  className?: string
  onClick?: () => void
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer = false,
  isCurrentTurn = false,
  showRole = false,
  voteCount = 0,
  className,
  onClick
}) => {
  const getRoleConfig = () => {
    if (player.isHost) {
      return {
        label: '방장',
        color: 'bg-purple-100 text-purple-700',
        icon: <Crown className="h-3 w-3" />
      }
    }
    
    if (showRole && player.role === 'LIAR') {
      return {
        label: '라이어',
        color: 'bg-orange-100 text-orange-700',
        icon: <Eye className="h-3 w-3" />
      }
    }
    
    return {
      label: '시민',
      color: 'bg-blue-100 text-blue-700',
      icon: <Shield className="h-3 w-3" />
    }
  }

  const getStatusIcon = () => {
    if (!player.isOnline) {
      return <WifiOff className="h-3 w-3 text-gray-400" />
    }
    
    if (player.hasVoted) {
      return <CheckCircle className="h-3 w-3 text-green-500" />
    }
    
    if (isCurrentTurn) {
      return <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
    }
    
    return <Clock className="h-3 w-3 text-yellow-500" />
  }

  const roleConfig = getRoleConfig()

  return (
    <Card 
      className={`transition-all ${
        isCurrentPlayer 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      } ${
        isCurrentTurn 
          ? 'ring-2 ring-green-300 ring-opacity-50' 
          : ''
      } ${
        !player.isOnline 
          ? 'opacity-60' 
          : ''
      } ${
        onClick ? 'cursor-pointer' : ''
      } ${className || ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Avatar with online indicator */}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`text-sm ${roleConfig.color}`}>
                {player.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Online/Offline Indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              player.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`font-medium text-sm truncate ${
                isCurrentPlayer ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {player.nickname}
                {isCurrentPlayer && ' (나)'}
              </span>
              
              {/* Role Badge */}
              <Badge variant="secondary" className={`text-xs ${roleConfig.color}`}>
                <div className="flex items-center space-x-1">
                  {roleConfig.icon}
                  <span>{roleConfig.label}</span>
                </div>
              </Badge>
            </div>

            {/* Status and Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-xs text-gray-600">
                  {player.hasVoted ? '투표 완료' : isCurrentTurn ? '진행 중' : '대기 중'}
                </span>
              </div>
              
              {/* Vote count if any */}
              {voteCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {voteCount}표
                </Badge>
              )}
            </div>
          </div>

          {/* Current Turn Indicator */}
          {isCurrentTurn && (
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mb-1" />
              <span className="text-xs text-green-600 font-medium">턴</span>
            </div>
          )}
        </div>

        {/* Player hint or defense if available */}
        {player.hint && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
            <strong>힌트:</strong> {player.hint}
          </div>
        )}
        
        {player.defense && (
          <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
            <strong>변론:</strong> {player.defense}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PlayerCard