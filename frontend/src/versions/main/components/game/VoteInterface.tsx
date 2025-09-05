import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {AlertTriangle, Check, Vote, X} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Button} from "@/versions/main/components/ui/button"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {staggerContainer, staggerItem} from "@/versions/main/animations"
import type {Player} from "@/shared/types/api.types"

interface VoteInterfaceProps {
  players: Player[]
  currentPlayerId: number
  onVote: (playerId: number) => void
  votedFor?: number
  disabled?: boolean
  timeRemaining?: number
  className?: string
}

export function VoteInterface({
  players,
  currentPlayerId,
  onVote,
  votedFor,
  disabled = false,
  timeRemaining,
  className
}: VoteInterfaceProps) {
  const [selectedPlayer, setSelectedPlayer] = React.useState<number | null>(votedFor || null)
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  const eligiblePlayers = players.filter(p => p.id !== currentPlayerId && p.isAlive)

  const handlePlayerSelect = (playerId: number) => {
    if (disabled || votedFor) return
    setSelectedPlayer(playerId)
  }

  const handleConfirmVote = () => {
    if (selectedPlayer && !disabled) {
      onVote(selectedPlayer)
      setConfirmDialogOpen(false)
    }
  }

  const selectedPlayerData = eligiblePlayers.find(p => p.id === selectedPlayer)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            라이어 투표
          </div>
          {timeRemaining && (
            <Badge variant="outline" className="text-sm">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} 남음
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {votedFor ? (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">투표 완료</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {players.find(p => p.id === votedFor)?.nickname}에게 투표했습니다
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground text-center">
              라이어라고 생각하는 플레이어를 선택하세요
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              <AnimatePresence>
                {eligiblePlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    variants={staggerItem}
                    whileHover="hover"
                    whileTap="tap"
                    animate={selectedPlayer === player.id ? "selected" : "initial"}
                    onClick={() => handlePlayerSelect(player.id)}
                    className={cn(
                      "relative p-4 rounded-lg border cursor-pointer transition-all",
                      selectedPlayer === player.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:border-blue-300 hover:bg-blue-50/50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {player.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="text-center">
                        <div className="font-medium text-sm">{player.nickname}</div>
                        {player.votesReceived > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {player.votesReceived}표 받음
                          </div>
                        )}
                      </div>

                      {selectedPlayer === player.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {selectedPlayer && selectedPlayerData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="font-medium">투표 확인</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPlayerData.nickname}을(를) 라이어로 지목하시겠습니까?
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleConfirmVote}
                    disabled={disabled}
                    variant="game-danger"
                    className="flex-1"
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    투표하기
                  </Button>

                  <Button
                    onClick={() => setSelectedPlayer(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface VoteResultsProps {
  players: Player[]
  eliminatedPlayer?: Player
  className?: string
}

export function VoteResults({
  players,
  eliminatedPlayer,
  className
}: VoteResultsProps) {
  const sortedPlayers = [...players]
    .filter(p => p.votesReceived > 0)
    .sort((a, b) => b.votesReceived - a.votesReceived)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="w-5 h-5" />
          투표 결과
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {eliminatedPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-center"
          >
            <div className="font-medium text-red-800 mb-2">
              투표 결과 탈락
            </div>
            <div className="flex items-center justify-center gap-2">
              <Avatar>
                <AvatarFallback>
                  {eliminatedPlayer.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{eliminatedPlayer.nickname}</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          <div className="text-sm font-medium">투표 현황</div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                variants={staggerItem}
                className={cn(
                  "flex items-center justify-between p-3 rounded border",
                  index === 0 && player.votesReceived > 0
                    ? "bg-red-50 border-red-200"
                    : "bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.nickname}</span>
                </div>

                <Badge variant={index === 0 ? "destructive" : "secondary"}>
                  {player.votesReceived}표
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
