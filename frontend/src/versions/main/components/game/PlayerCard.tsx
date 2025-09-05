import * as React from "react"
import {motion} from "framer-motion"
import {cn} from "@/versions/main/lib/utils"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {useVoteAnimation} from "@/versions/main/animations"
import type {Player, PlayerRole} from "@/shared/types/api.types"

interface PlayerCardProps {
  player: Player
  isCurrentPlayer?: boolean
  canVote?: boolean
  isSelected?: boolean
  showRole?: boolean
  onVote?: (playerId: number) => void
  className?: string
}

const roleColors: Record<PlayerRole, string> = {
  CITIZEN: "bg-green-100 text-green-800 border-green-300",
  LIAR: "bg-red-100 text-red-800 border-red-300"
}

export function PlayerCard({
  player,
  isCurrentPlayer = false,
  canVote = false,
  isSelected = false,
  showRole = false,
  onVote,
  className
}: PlayerCardProps) {
  const { controls, selectVote, deselectVote } = useVoteAnimation()

  React.useEffect(() => {
    if (isSelected) {
      selectVote(player.id.toString())
    } else {
      deselectVote()
    }
  }, [isSelected, player.id, selectVote, deselectVote])

  const handleClick = () => {
    if (canVote && onVote && !isCurrentPlayer) {
      onVote(player.id)
    }
  }

  return (
    <motion.div
      animate={controls}
      whileHover={canVote && !isCurrentPlayer ? { scale: 1.02 } : {}}
      whileTap={canVote && !isCurrentPlayer ? { scale: 0.98 } : {}}
      onClick={handleClick}
      className={cn(
        "relative p-4 rounded-lg border bg-card transition-colors",
        canVote && !isCurrentPlayer && "cursor-pointer hover:bg-accent",
        isCurrentPlayer && "ring-2 ring-primary",
        isSelected && "ring-2 ring-blue-500",
        !player.isAlive && "opacity-50 grayscale",
        className
      )}
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm font-medium">
              {player.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {isCurrentPlayer && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
          )}

          {!player.isAlive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <span className="text-white text-xs">✕</span>
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="font-medium text-sm">{player.nickname}</p>

          {player.isHost && (
            <Badge variant="secondary" className="text-xs">방장</Badge>
          )}
        </div>

        {showRole && player.role && (
          <Badge
            variant="outline"
            className={cn("text-xs", roleColors[player.role as PlayerRole])}
          >
            {player.role === 'LIAR' ? '라이어' : '시민'}
          </Badge>
        )}

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {player.hasVoted && (
            <span className="text-green-600">✓ 투표완료</span>
          )}

          {player.votesReceived > 0 && (
            <span>{player.votesReceived}표</span>
          )}
        </div>

        {canVote && !isCurrentPlayer && (
          <div className="text-xs text-center text-muted-foreground">
            클릭하여 투표
          </div>
        )}
      </div>
    </motion.div>
  )
}
