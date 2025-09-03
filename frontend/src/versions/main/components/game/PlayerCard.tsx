import * as React from "react"
import {motion} from "framer-motion"
import {Card, CardContent} from "../ui/card"
import {Avatar, AvatarFallback} from "../ui/avatar"
import {Badge} from "../ui/badge"
import {Crown, Users} from "lucide-react"
import {cn} from "../../lib/utils"

export interface PlayerCardProps {
  player: {
    id: string
    nickname: string
    role?: 'CITIZEN' | 'LIAR' | 'UNKNOWN'
    isHost: boolean
    isAlive: boolean
    votesReceived: number
    hasVoted?: boolean
    isCurrentPlayer?: boolean
  }
  selected?: boolean
  onSelect?: (playerId: string) => void
  interactive?: boolean
  showRole?: boolean
  compact?: boolean
}

export function PlayerCard({
  player,
  selected = false,
  onSelect,
  interactive = false,
  showRole = false,
  compact = false
}: PlayerCardProps) {
  const handleClick = () => {
    if (interactive && onSelect) {
      onSelect(player.id)
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'LIAR': return 'destructive'
      case 'CITIZEN': return 'default'
      default: return 'secondary'
    }
  }

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer",
          {
            "ring-2 ring-primary": selected,
            "hover:shadow-md": interactive,
            "opacity-50": !player.isAlive,
            "h-20": compact,
            "h-24": !compact
          }
        )}
        onClick={handleClick}
      >
        <CardContent className={cn("p-3", { "p-2": compact })}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className={cn("h-10 w-10", { "h-8 w-8": compact })}>
                <AvatarFallback>
                  {getPlayerInitials(player.nickname)}
                </AvatarFallback>
              </Avatar>
              {player.isHost && (
                <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium truncate",
                  { "text-sm": compact }
                )}>
                  {player.nickname}
                </span>
                {player.hasVoted && (
                  <Badge variant="outline" className="text-xs">
                    투표완료
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {showRole && player.role && (
                  <Badge variant={getRoleColor(player.role)} className="text-xs">
                    {player.role === 'LIAR' ? '라이어' :
                     player.role === 'CITIZEN' ? '시민' : '미확인'}
                  </Badge>
                )}

                {player.votesReceived > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {player.votesReceived}표
                  </Badge>
                )}
              </div>
            </div>

            {player.isCurrentPlayer && (
              <div className="text-primary">
                <Users className="h-4 w-4" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
