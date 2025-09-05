import * as React from "react"
import {motion} from "framer-motion"
import {Clock, Lock, Trophy, Users} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Button} from "@/versions/main/components/ui/button"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {cn} from "@/versions/main/lib/utils"
import {fadeInScale} from "@/versions/main/animations"

interface GameRoom {
  id: number
  title: string
  hostNickname: string
  currentPlayerCount: number
  maxPlayerCount: number
  isPrivate: boolean
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
  gameMode: string
  targetPoints: number
  createdAt: string
}

interface GameCardProps {
  room: GameRoom
  onJoin?: (roomId: number) => void
  onSpectate?: (roomId: number) => void
  disabled?: boolean
  className?: string
}

const statusConfig = {
  WAITING: {
    label: "대기 중",
    color: "bg-green-100 text-green-800",
    variant: "secondary" as const
  },
  IN_PROGRESS: {
    label: "진행 중",
    color: "bg-blue-100 text-blue-800",
    variant: "default" as const
  },
  FINISHED: {
    label: "종료됨",
    color: "bg-gray-100 text-gray-800",
    variant: "outline" as const
  }
}

export function GameCard({
  room,
  onJoin,
  onSpectate,
  disabled = false,
  className
}: GameCardProps) {
  const status = statusConfig[room.status]
  const canJoin = room.status === 'WAITING' && room.currentPlayerCount < room.maxPlayerCount
  const canSpectate = room.status === 'IN_PROGRESS'

  const handleJoin = () => {
    if (canJoin && onJoin && !disabled) {
      onJoin(room.id)
    }
  }

  const handleSpectate = () => {
    if (canSpectate && onSpectate && !disabled) {
      onSpectate(room.id)
    }
  }

  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Card className={cn(
        "h-full transition-all duration-200 hover:shadow-lg",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg line-clamp-1">
                {room.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {room.hostNickname.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{room.hostNickname}</span>
                {room.isPrivate && <Lock className="h-3 w-3" />}
              </div>
            </div>

            <Badge variant={status.variant} className={status.color}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {room.currentPlayerCount}/{room.maxPlayerCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span>{room.targetPoints}점</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(room.createdAt).toLocaleString('ko-KR')}
            </div>
            <div className="mt-1">
              모드: {room.gameMode === 'LIARS_KNOW' ? '라이어 서로 알기' : '라이어 다른 단어'}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {canJoin && (
              <Button
                onClick={handleJoin}
                disabled={disabled}
                className="flex-1"
                variant="game-primary"
              >
                참가하기
              </Button>
            )}

            {canSpectate && (
              <Button
                onClick={handleSpectate}
                disabled={disabled}
                className="flex-1"
                variant="outline"
              >
                관전하기
              </Button>
            )}

            {room.status === 'FINISHED' && (
              <Button
                disabled
                className="flex-1"
                variant="outline"
              >
                게임 종료
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
