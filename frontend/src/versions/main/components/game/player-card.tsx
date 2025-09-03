import * as React from "react"
import {motion} from "framer-motion"
import {cn} from "../../../lib/utils"
import {Card, CardContent, CardHeader} from "../ui/card"
import {Avatar, AvatarFallback} from "../ui/avatar"
import {Badge} from "../ui/badge"
import {Button} from "../ui/button"
import {StatusIndicator} from "../ui/status-indicator"
import {Player} from "../../../types/game"

interface PlayerCardProps {
  player: Player
  variant?: 'compact' | 'detailed' | 'voting'
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  showHint?: boolean
  showRole?: boolean
  onVote?: () => void
  onViewDetails?: () => void
  className?: string
}

const cardVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

const turnHighlight = {
  animate: {
    boxShadow: [
      '0 0 0 rgba(59, 130, 246, 0)',
      '0 0 20px rgba(59, 130, 246, 0.5)',
      '0 0 0 rgba(59, 130, 246, 0)'
    ]
  },
  transition: { duration: 2, repeat: Infinity }
}

export function PlayerCard({
  player,
  variant = 'detailed',
  interactive = false,
  selected = false,
  disabled = false,
  showHint = false,
  showRole = false,
  onVote,
  onViewDetails,
  className
}: PlayerCardProps) {
  const isCurrentTurn = player.isCurrentTurn
  const canVote = interactive && onVote && !disabled

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate={isCurrentTurn ? turnHighlight : "animate"}
      whileHover={interactive ? "hover" : undefined}
      whileTap={interactive ? "tap" : undefined}
      className={className}
    >
      <Card
        variant={interactive ? "interactive" : "player"}
        selected={selected}
        disabled={disabled}
        className={cn(
          "relative overflow-hidden",
          isCurrentTurn && "border-blue-400 bg-blue-50",
          !player.isAlive && "opacity-60 grayscale",
          canVote && "cursor-pointer"
        )}
        onClick={canVote ? onVote : undefined}
      >
        {variant === 'compact' && (
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {player.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.nickname}</p>
                {showRole && player.role && (
                  <Badge variant={player.role === 'LIAR' ? 'liar' : 'citizen'} className="text-xs">
                    {player.role === 'LIAR' ? '라이어' : '시민'}
                  </Badge>
                )}
              </div>
              <StatusIndicator
                status={player.isAlive ? 'playing' : 'offline'}
                size="sm"
              />
            </div>
          </CardContent>
        )}

        {variant === 'detailed' && (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg font-bold">
                      {player.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{player.nickname}</h3>
                    <div className="flex items-center space-x-2">
                      <StatusIndicator
                        status={player.isAlive ? 'playing' : 'offline'}
                        showText
                        size="sm"
                      />
                      {showRole && player.role && (
                        <Badge variant={player.role === 'LIAR' ? 'liar' : 'citizen'}>
                          {player.role === 'LIAR' ? '라이어' : '시민'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {isCurrentTurn && (
                  <Badge variant="waiting" className="animate-pulse">
                    현재 턴
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">점수</span>
                  <span className="font-medium">{player.cumulativeScore}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">받은 투표</span>
                  <span className="font-medium">{player.votesReceived}</span>
                </div>

                {showHint && player.hint && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <span className="text-muted-foreground">힌트: </span>
                    <span className="font-medium">{player.hint}</span>
                  </div>
                )}

                {player.defense && (
                  <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-sm">
                    <span className="text-muted-foreground">변론: </span>
                    <span className="font-medium">{player.defense}</span>
                  </div>
                )}

                {canVote && (
                  <Button
                    className="w-full mt-2"
                    variant="game-primary"
                    onClick={onVote}
                    disabled={disabled}
                  >
                    투표하기
                  </Button>
                )}

                {onViewDetails && (
                  <Button
                    variant="outline"
                    className="w-full mt-1"
                    onClick={onViewDetails}
                  >
                    상세보기
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        )}

        {variant === 'voting' && (
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <Avatar className="h-16 w-16 mx-auto">
                <AvatarFallback className="text-2xl font-bold">
                  {player.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{player.nickname}</h3>
                <p className="text-sm text-muted-foreground">
                  받은 투표: {player.votesReceived}
                </p>
              </div>
              {canVote && (
                <Button
                  className="w-full"
                  variant={selected ? "destructive" : "game-primary"}
                  onClick={onVote}
                  disabled={disabled}
                >
                  {selected ? "선택됨" : "투표"}
                </Button>
              )}
            </div>
          </CardContent>
        )}

        {/* 투표 상태 표시 */}
        {player.hasVoted && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              투표 완료
            </Badge>
          </div>
        )}

        {/* 사망 오버레이 */}
        {!player.isAlive && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              탈락
            </Badge>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
