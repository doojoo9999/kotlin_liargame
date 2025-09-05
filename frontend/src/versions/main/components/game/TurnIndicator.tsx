import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {ChevronRight, Crown} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {Badge} from "@/versions/main/components/ui/badge"
import {staggerContainer, staggerItem} from "@/versions/main/animations"
import type {Player} from "@/shared/types/api.types"

interface TurnIndicatorProps {
  players: Player[]
  currentTurnIndex: number
  direction?: 'horizontal' | 'vertical'
  showAll?: boolean
  className?: string
}

export function TurnIndicator({
  players,
  currentTurnIndex,
  direction = 'horizontal',
  showAll = false,
  className
}: TurnIndicatorProps) {
  const currentPlayer = players[currentTurnIndex]
  const visiblePlayers = showAll ? players : players.slice(0, 5)

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn(
        "flex items-center gap-2",
        direction === 'vertical' && "flex-col",
        className
      )}
    >
      <div className="text-sm font-medium text-muted-foreground mb-2">
        현재 턴
      </div>

      <div className={cn(
        "flex items-center gap-3",
        direction === 'vertical' && "flex-col gap-2"
      )}>
        <AnimatePresence mode="wait">
          {visiblePlayers.map((player, index) => (
            <motion.div
              key={player.id}
              variants={staggerItem}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={
                  index === currentTurnIndex
                    ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.7)",
                          "0 0 0 8px rgba(59, 130, 246, 0)",
                          "0 0 0 0 rgba(59, 130, 246, 0)"
                        ]
                      }
                    : { scale: 1, boxShadow: "none" }
                }
                transition={{
                  duration: 2,
                  repeat: index === currentTurnIndex ? Infinity : 0,
                  ease: "easeOut"
                }}
                className={cn(
                  "relative",
                  index === currentTurnIndex && "z-10"
                )}
              >
                <Avatar className={cn(
                  "h-10 w-10 border-2 transition-all duration-300",
                  index === currentTurnIndex
                    ? "border-blue-500 shadow-lg"
                    : "border-border",
                  !player.isAlive && "opacity-50 grayscale"
                )}>
                  <AvatarFallback className={cn(
                    "text-sm font-medium",
                    index === currentTurnIndex && "bg-blue-50 text-blue-700"
                  )}>
                    {player.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {player.isHost && (
                  <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                )}

                {index === currentTurnIndex && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                  >
                    <Badge variant="default" className="text-xs">
                      턴
                    </Badge>
                  </motion.div>
                )}
              </motion.div>

              {direction === 'horizontal' && index < visiblePlayers.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {currentPlayer && (
        <motion.div
          key={currentPlayer.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-sm font-medium">{currentPlayer.nickname}의 턴</div>
          <div className="text-xs text-muted-foreground">
            힌트를 제공해주세요
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

interface NextPlayerIndicatorProps {
  nextPlayer: Player
  timeUntilTurn?: number
  className?: string
}

export function NextPlayerIndicator({
  nextPlayer,
  timeUntilTurn,
  className
}: NextPlayerIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-lg", className)}
    >
      <div className="text-sm text-muted-foreground">다음 턴:</div>

      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {nextPlayer.nickname.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{nextPlayer.nickname}</span>
      </div>

      {timeUntilTurn && (
        <div className="text-xs text-muted-foreground">
          {timeUntilTurn}초 후
        </div>
      )}
    </motion.div>
  )
}
