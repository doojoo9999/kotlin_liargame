import {motion} from 'framer-motion'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Clock, Lock, Play, Users} from 'lucide-react'
import {cn} from '@/lib/utils'
import type {LegacyGameRoom} from '../types'

interface GameCardProps {
  room: LegacyGameRoom
  onJoin: (room: LegacyGameRoom) => void
  className?: string
  disabled?: boolean
}

export function GameCard({ room, onJoin, className, disabled = false }: GameCardProps) {
  const isJoinable = room.status === 'waiting' && room.currentPlayers < room.maxPlayers
  const isFull = room.currentPlayers >= room.maxPlayers

  const handleJoin = () => {
    if (isJoinable && !disabled) {
      onJoin(room)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={isJoinable && !disabled ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className={cn(
          'h-full transition-all duration-200 hover:shadow-md',
          disabled && 'opacity-50 cursor-not-allowed',
          !isJoinable && 'opacity-75',
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {room.name || `Game ${room.sessionCode}`}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm">{room.sessionCode}</span>
                {room.isPrivate && <Lock className="h-3 w-3" />}
              </CardDescription>
            </div>
            <Badge
              variant={
                room.status === 'waiting'
                  ? 'secondary'
                  : room.status === 'playing'
                    ? 'default'
                    : 'outline'
              }
            >
              {room.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Hosted by <span className="font-medium">{room.hostName}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span
                className={cn(
                  'font-medium',
                  isFull ? 'text-red-600' : 'text-foreground',
                )}
              >
                {room.currentPlayers}/{room.maxPlayers}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {room.timeLimit > 0 ? `${Math.max(1, Math.floor(room.timeLimit / 60))}min` : '—'}
              </span>
            </div>

            <div className="text-center">
              <span className="font-medium">{room.totalRounds}</span>
              <span className="text-muted-foreground"> rounds</span>
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={!isJoinable || disabled}
            className="w-full mt-4"
            variant={isJoinable ? 'default' : 'secondary'}
          >
            {disabled ? (
              'Joining...'
            ) : room.status === 'playing' ? (
              'Game in Progress'
            ) : isFull ? (
              'Room Full'
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Join Game
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function GameCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          <div className="h-6 bg-muted rounded w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
        </div>
        <div className="h-10 bg-muted rounded w-full mt-4" />
      </CardContent>
    </Card>
  )
}
