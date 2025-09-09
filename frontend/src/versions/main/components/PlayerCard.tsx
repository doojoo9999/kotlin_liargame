import {motion} from 'framer-motion'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Check, Crown, Eye, EyeOff, Target, Wifi, WifiOff, X} from 'lucide-react'
import {cn} from '@/lib/utils'

export interface Player {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
  isOnline: boolean
  isCurrentUser?: boolean
  hasVoted?: boolean
  isLiar?: boolean // Only shown in results
  votes?: number // Vote count in results
}

interface PlayerCardProps {
  player: Player
  variant?: 'lobby' | 'game' | 'voting' | 'results'
  onVote?: (playerId: string) => void
  selected?: boolean
  disabled?: boolean
  showVoteCount?: boolean
  votes?: number
  className?: string
}

export function PlayerCard({ 
  player, 
  variant = 'lobby', 
  onVote,
  selected = false,
  disabled = false,
  showVoteCount = false,
  className 
}: PlayerCardProps) {
  const avatarLetters = player.nickname
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleClick = () => {
    if (variant === 'voting' && onVote && !disabled && !player.isCurrentUser) {
      onVote(player.id)
    }
  }

  const isClickable = variant === 'voting' && onVote && !disabled && !player.isCurrentUser

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={className}
    >
      <Card 
        className={cn(
          "transition-all duration-200",
          isClickable && "cursor-pointer hover:shadow-md",
          selected && "ring-2 ring-primary",
          disabled && "opacity-50 cursor-not-allowed",
          player.isLiar && variant === 'results' && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative">
              <Avatar className={cn(
                "h-10 w-10",
                player.isLiar && variant === 'results' && "ring-2 ring-red-500"
              )}>
                <AvatarFallback className={cn(
                  "font-bold text-sm",
                  player.isHost && "bg-primary text-primary-foreground",
                  player.isCurrentUser && !player.isHost && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                  player.isLiar && variant === 'results' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                )}>
                  {avatarLetters}
                </AvatarFallback>
              </Avatar>
              
              {/* Online Status */}
              <div className="absolute -bottom-1 -right-1">
                {player.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500 bg-background rounded-full p-0.5" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500 bg-background rounded-full p-0.5" />
                )}
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "font-medium truncate",
                  player.isCurrentUser && "text-blue-600 dark:text-blue-400"
                )}>
                  {player.nickname}
                </span>
                
                {/* Host Badge */}
                {player.isHost && (
                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}
                
                {/* Current User Badge */}
                {player.isCurrentUser && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    나
                  </Badge>
                )}

                {/* Liar Badge (Results) */}
                {player.isLiar && variant === 'results' && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    <Target className="h-3 w-3 mr-1" />
                    라이어
                  </Badge>
                )}
              </div>

              {/* Status Row */}
              <div className="flex items-center space-x-2 mt-1">
                {/* Lobby Variant - Ready Status */}
                {variant === 'lobby' && (
                  <div className="flex items-center space-x-1">
                    {player.isReady ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">준비됨</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">준비 안 됨</span>
                      </>
                    )}
                  </div>
                )}

                {/* Game Variant - Topic Status */}
                {variant === 'game' && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">게임 중</span>
                  </div>
                )}

                {/* Voting Variant - Vote Status */}
                {variant === 'voting' && (
                  <div className="flex items-center space-x-1">
                    {player.hasVoted ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">투표 완료</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">생각 중...</span>
                      </>
                    )}
                  </div>
                )}

                {/* Results Variant - Vote Count */}
                {variant === 'results' && showVoteCount && typeof player.votes === 'number' && (
                  <Badge variant="secondary" className="text-xs">
                    {player.votes}표
                  </Badge>
                )}
              </div>
            </div>

            {/* Selection Indicator */}
            {selected && variant === 'voting' && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Specialized variants for different contexts
export function LobbyPlayerCard(props: Omit<PlayerCardProps, 'variant'>) {
  return <PlayerCard {...props} variant="lobby" />
}

export function GamePlayerCard(props: Omit<PlayerCardProps, 'variant'>) {
  return <PlayerCard {...props} variant="game" />
}

export function VotingPlayerCard(props: Omit<PlayerCardProps, 'variant'>) {
  return <PlayerCard {...props} variant="voting" />
}

export function ResultsPlayerCard(props: Omit<PlayerCardProps, 'variant'>) {
  return <PlayerCard {...props} variant="results" />
}

// Loading skeleton
export function PlayerCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-muted rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-24 mb-1" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}