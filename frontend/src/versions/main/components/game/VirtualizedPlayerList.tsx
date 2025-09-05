import React, {memo, useCallback, useMemo} from 'react'
import {FixedSizeList as List} from 'react-window'
import {cn} from "@/versions/main/lib/utils"
import {PlayerCard} from './PlayerCard'
import type {Player} from '@/shared/types/api.types'

interface VirtualizedPlayerListProps {
  players: Player[]
  currentPlayerId?: number
  canVote?: boolean
  onVote?: (playerId: number) => void
  showRole?: boolean
  className?: string
}

interface PlayerItemProps {
  index: number
  style: React.CSSProperties
  data: {
    players: Player[]
    currentPlayerId?: number
    canVote?: boolean
    onVote?: (playerId: number) => void
    showRole?: boolean
  }
}

const PlayerItem = memo(({ index, style, data }: PlayerItemProps) => {
  const { players, currentPlayerId, canVote, onVote, showRole } = data
  const player = players[index]

  const handleVote = useCallback((playerId: number) => {
    onVote?.(playerId)
  }, [onVote])

  return (
    <div style={style}>
      <PlayerCard
        player={player}
        isCurrentPlayer={player.userId === currentPlayerId}
        canVote={canVote}
        onVote={handleVote}
        showRole={showRole}
        className="mb-2"
      />
    </div>
  )
})

PlayerItem.displayName = 'PlayerItem'

export const VirtualizedPlayerList = memo(({
  players,
  currentPlayerId,
  canVote,
  onVote,
  showRole,
  className
}: VirtualizedPlayerListProps) => {
  const itemData = useMemo(() => ({
    players,
    currentPlayerId,
    canVote,
    onVote,
    showRole
  }), [players, currentPlayerId, canVote, onVote, showRole])

  const memoizedPlayers = useMemo(() => {
    return players.map(player => ({
      ...player,
      key: `${player.id}-${player.hasVoted}-${player.votesReceived}`
    }))
  }, [players])

  if (memoizedPlayers.length <= 10) {
    // For small lists, render normally to avoid virtualization overhead
    return (
      <div className={cn("space-y-2", className)}>
        {memoizedPlayers.map((player, index) => (
          <PlayerItem
            key={player.key}
            index={index}
            style={{}}
            data={itemData}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("h-96", className)}>
      <List
        height={384} // 24rem in pixels
        itemCount={memoizedPlayers.length}
        itemSize={120} // Height of each player card
        itemData={itemData}
        overscanCount={5}
      >
        {PlayerItem}
      </List>
    </div>
  )
})

VirtualizedPlayerList.displayName = 'VirtualizedPlayerList'
