import React from 'react'
import type {FrontendPlayer} from '@/types'
import {PlayerCard} from './PlayerCard'
import {AnimatePresence, motion} from 'framer-motion'

export interface PlayerListProps {
  players: FrontendPlayer[]
  currentPlayerId?: string
  currentTurnPlayerId?: string
  showRoles?: boolean
  votes?: Record<string, string>
  onPlayerClick?: (player: FrontendPlayer) => void
  className?: string
  layout?: 'grid' | 'list'
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayerId,
  currentTurnPlayerId,
  showRoles = false,
  votes = {},
  onPlayerClick,
  className,
  layout = 'grid'
}) => {
  // Calculate vote counts for each player
  const getVoteCount = (playerId: string): number => {
    return Object.values(votes).filter(vote => vote === playerId).length
  }

  // Sort players: current player first, then by online status, then alphabetically
  const sortedPlayers = [...players].sort((a, b) => {
    // Current player goes first
    if (a.id === currentPlayerId) return -1
    if (b.id === currentPlayerId) return 1
    
    // Online players before offline
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    
    // Host before regular players
    if (a.isHost && !b.isHost) return -1
    if (!a.isHost && b.isHost) return 1
    
    // Alphabetical by nickname
    return a.nickname.localeCompare(b.nickname)
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  }

  const gridClass = layout === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' 
    : 'space-y-3'

  return (
    <motion.div 
      className={`${gridClass} ${className || ''}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {sortedPlayers.map((player) => (
          <motion.div
            key={player.id}
            variants={itemVariants}
            layout
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PlayerCard
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
              isCurrentTurn={player.id === currentTurnPlayerId}
              showRole={showRoles}
              voteCount={getVoteCount(player.id)}
              onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
              className="h-full"
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {players.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-8 text-gray-500"
        >
          <div className="text-lg font-medium mb-2">플레이어가 없습니다</div>
          <div className="text-sm">게임에 참여할 플레이어를 기다리고 있습니다...</div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default PlayerList