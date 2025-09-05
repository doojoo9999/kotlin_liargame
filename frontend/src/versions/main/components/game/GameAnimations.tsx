import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {AlertTriangle, Check, Crown} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Card, CardContent} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import type {Player} from "@/shared/types/api.types"

interface VoteRevealProps {
  votes: Array<{
    voter: Player
    target: Player
  }>
  eliminatedPlayer?: Player
  onComplete?: () => void
  className?: string
}

export function VoteReveal({
  votes,
  eliminatedPlayer,
  onComplete,
  className
}: VoteRevealProps) {
  const [currentVoteIndex, setCurrentVoteIndex] = React.useState(0)
  const [showResult, setShowResult] = React.useState(false)

  React.useEffect(() => {
    if (currentVoteIndex < votes.length) {
      const timer = setTimeout(() => {
        setCurrentVoteIndex(currentVoteIndex + 1)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (currentVoteIndex >= votes.length && !showResult) {
      const timer = setTimeout(() => {
        setShowResult(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showResult) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentVoteIndex, votes.length, showResult, onComplete])

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">투표 결과 발표</h2>
        <p className="text-muted-foreground">
          {showResult ? "최종 결과" : `${currentVoteIndex}/${votes.length} 투표 공개 중`}
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {votes.slice(0, currentVoteIndex).map((vote, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {vote.voter.nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{vote.voter.nickname}</span>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-2xl"
                  >
                    →
                  </motion.div>

                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {vote.target.nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{vote.target.nickname}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showResult && eliminatedPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center"
          >
            <Card className="p-8 bg-red-50 border-red-200">
              <CardContent className="space-y-4">
                <div className="text-red-600 text-xl font-bold">
                  투표로 탈락!
                </div>

                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Avatar className="h-20 w-20 mx-auto border-4 border-red-300">
                    <AvatarFallback className="text-2xl">
                      {eliminatedPlayer.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>

                <div className="text-lg font-medium">
                  {eliminatedPlayer.nickname}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface RoleRevealProps {
  players: Player[]
  currentPlayerRole?: 'CITIZEN' | 'LIAR'
  onComplete?: () => void
  className?: string
}

export function RoleReveal({
  players,
  currentPlayerRole,
  onComplete,
  className
}: RoleRevealProps) {
  const [revealed, setRevealed] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setRevealed(true)
    }, 1000)

    const completeTimer = setTimeout(() => {
      onComplete?.()
    }, 4000)

    return () => {
      clearTimeout(timer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className={cn("space-y-8 text-center", className)}>
      <div>
        <h2 className="text-3xl font-bold mb-4">역할 공개</h2>
        <p className="text-muted-foreground">게임이 종료되었습니다</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{
              duration: 0.8,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
            className="perspective-1000"
          >
            <Card className="relative h-32 transform-style-preserve-3d">
              <div className="absolute inset-0 backface-hidden">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium mt-2">{player.nickname}</div>
                </CardContent>
              </div>

              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                    player.role === 'LIAR'
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  )}>
                    {player.role === 'LIAR' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <Check className="w-6 h-6" />
                    )}
                  </div>

                  <Badge
                    variant={player.role === 'LIAR' ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {player.role === 'LIAR' ? '라이어' : '시민'}
                  </Badge>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {currentPlayerRole && revealed && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className={cn(
            "p-6 rounded-lg",
            currentPlayerRole === 'LIAR'
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
          )}
        >
          <div className={cn(
            "text-xl font-bold mb-2",
            currentPlayerRole === 'LIAR' ? "text-red-600" : "text-green-600"
          )}>
            당신은 {currentPlayerRole === 'LIAR' ? '라이어' : '시민'}였습니다!
          </div>

          {currentPlayerRole === 'LIAR' && (
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>수고하셨습니다!</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

interface GameEndAnimationProps {
  winner: 'CITIZENS' | 'LIARS'
  isPlayerWinner: boolean
  onComplete?: () => void
  className?: string
}

export function GameEndAnimation({
  winner,
  isPlayerWinner,
  onComplete,
  className
}: GameEndAnimationProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={cn("text-center space-y-8", className)}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          duration: 1,
          bounce: 0.5
        }}
      >
        <div className={cn(
          "text-6xl mb-4",
          isPlayerWinner ? "text-green-500" : "text-red-500"
        )}>
          {isPlayerWinner ? "🎉" : "😔"}
        </div>

        <h1 className={cn(
          "text-4xl font-bold mb-4",
          isPlayerWinner ? "text-green-600" : "text-red-600"
        )}>
          {isPlayerWinner ? "승리!" : "패배!"}
        </h1>

        <p className="text-xl text-muted-foreground">
          {winner === 'CITIZENS' ? '시민팀' : '라이어팀'} 승리
        </p>
      </motion.div>

      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-8xl"
      >
        🏆
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-sm text-muted-foreground"
      >
        5초 후 로비로 돌아갑니다...
      </motion.div>
    </div>
  )
}
