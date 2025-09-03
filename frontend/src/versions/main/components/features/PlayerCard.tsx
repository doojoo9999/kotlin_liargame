import * as React from "react"
import {motion} from "framer-motion"
import {Card, CardContent} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {Button} from "@/versions/main/components/ui/button"
import {Crown, Shield, Vote, X} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"

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
  gamePhase?: 'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING'
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  onVote?: (playerId: string) => void
  onSelect?: (playerId: string) => void
  className?: string
}

export function PlayerCard({
  player,
  gamePhase = 'WAITING',
  interactive = false,
  selected = false,
  disabled = false,
  onVote,
  onSelect,
  className
}: PlayerCardProps) {
  const handleClick = () => {
    if (disabled) return
    if (onSelect) {
      onSelect(player.id)
    }
  }

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onVote && !disabled) {
      onVote(player.id)
    }
  }

  const isVotingPhase = gamePhase === 'VOTING'
  const canVote = isVotingPhase && interactive && player.isAlive && !player.isCurrentPlayer

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      whileHover={interactive ? { scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      className={className}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          selected && "ring-2 ring-blue-500",
          disabled && "opacity-50 cursor-not-allowed",
          !player.isAlive && "grayscale",
          interactive && "hover:shadow-lg"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4 text-center space-y-3">
          {/* 아바타 */}
          <div className="relative">
            <Avatar className="mx-auto">
              <AvatarFallback>{player.nickname[0]}</AvatarFallback>
            </Avatar>

            {/* 호스트 표시 */}
            {player.isHost && (
              <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
            )}

            {/* 사망 표시 */}
            {!player.isAlive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <X className="w-6 h-6 text-red-500" />
              </div>
            )}
          </div>

          {/* 플레이어 정보 */}
          <div>
            <div className="font-medium text-sm">{player.nickname}</div>
            {player.isCurrentPlayer && (
              <div className="text-xs text-blue-600">나</div>
            )}
          </div>

          {/* 역할 표시 (게임 진행 중) */}
          {gamePhase === 'REVEALING' && player.role && (
            <Badge
              variant={player.role === 'LIAR' ? 'liar' : 'citizen'}
              className="text-xs"
            >
              {player.role === 'LIAR' ? '라이어' : '시민'}
            </Badge>
          )}

          {/* 투표 현황 */}
          {isVotingPhase && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                투표 {player.votesReceived}표
                {player.hasVoted && (
                  <div className="text-green-600">✓ 투표완료</div>
                )}
              </div>
            </div>
          )}

          {/* 상태 표시 */}
          <div className="flex justify-center gap-1">
            {player.isAlive ? (
              <Badge variant="status-online" className="text-xs">
                생존
              </Badge>
            ) : (
              <Badge variant="status-offline" className="text-xs">
                사망
              </Badge>
            )}
          </div>

          {/* 투표 버튼 */}
          {canVote && (
            <Button
              size="sm"
              variant={selected ? "game-danger" : "outline"}
              className="w-full"
              onClick={handleVote}
              disabled={disabled}
            >
              <Vote className="w-3 h-3 mr-1" />
              투표하기
            </Button>
          )}

          {/* 방어 중 표시 */}
          {gamePhase === 'REVEALING' && selected && (
            <div className="flex items-center justify-center gap-1 text-orange-600">
              <Shield className="w-3 h-3" />
              <span className="text-xs">방어 중</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
