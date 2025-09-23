import {motion} from 'framer-motion'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Award, Crown, Medal, Target, Trophy} from 'lucide-react'
import {cn} from '@/lib/utils'

interface PlayerScore {
  id: string
  nickname: string
  totalScore: number
  roundScores: number[]
  roundsWon: number
  timesLiar: number
  timesDetected: number // How many times they correctly identified the liar
  timesEvaded: number // How many times they were liar but weren't caught
  rank: number
  isCurrentUser?: boolean
}

interface ScoreBoardProps {
  players: PlayerScore[]
  currentRound: number
  totalRounds: number
  variant?: 'full' | 'compact' | 'final'
  showRoundDetails?: boolean
  className?: string
}

export function ScoreBoard({
  players,
  currentRound,
  totalRounds,
  variant = 'full',
  showRoundDetails = true,
  className
}: ScoreBoardProps) {
  // Sort players by rank
  const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank)
  
  // Get winner(s)
  const winners = sortedPlayers.filter(p => p.rank === 1)
  const isGameComplete = currentRound >= totalRounds

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
      case 2:
        return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
      case 3:
        return "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
      default:
        return ""
    }
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedPlayers.slice(0, 3).map((player) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  player.isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getRankIcon(player.rank)}
                    <span className="font-bold text-sm">#{player.rank}</span>
                  </div>
                  <span className={cn(
                    "font-medium text-sm",
                    player.isCurrentUser && "text-primary"
                  )}>
                    {player.nickname}
                  </span>
                </div>
                <span className="font-bold">{player.totalScore}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        {isGameComplete ? (
          <div>
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold">Game Complete!</h2>
            <p className="text-muted-foreground">
              {winners.length === 1 
                ? `${winners[0].nickname} is the winner!`
                : `We have a ${winners.length}-way tie!`
              }
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold">Scoreboard</h2>
            <p className="text-muted-foreground">
              Round {currentRound} of {totalRounds}
            </p>
          </div>
        )}
      </div>

      {/* Main Scoreboard */}
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={cn(
              "transition-all duration-200",
              getRankColor(player.rank),
              player.isCurrentUser && "ring-2 ring-primary"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Player Info */}
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex items-center gap-2">
                      {getRankIcon(player.rank)}
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{player.rank}
                      </span>
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={cn(
                        "font-bold",
                        player.isCurrentUser && "bg-primary text-primary-foreground"
                      )}>
                        {player.nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Player Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-lg font-semibold",
                          player.isCurrentUser && "text-primary"
                        )}>
                          {player.nickname}
                        </span>
                        {player.isCurrentUser && (
                          <Badge variant="outline">You</Badge>
                        )}
                        {player.rank === 1 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{player.roundsWon} rounds won</span>
                        <span>{player.timesDetected} correct detections</span>
                        {player.timesEvaded > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {player.timesEvaded} successful lies
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {player.totalScore}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      points
                    </div>
                  </div>
                </div>

                {/* Round Details */}
                {showRoundDetails && variant === 'full' && player.roundScores.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">
                      Round Scores:
                    </div>
                    <div className="flex gap-2">
                      {player.roundScores.map((score, roundIndex) => (
                        <div
                          key={roundIndex}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                            score > 0 
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : score < 0
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          )}
                          title={`Round ${roundIndex + 1}: ${score > 0 ? '+' : ''}${score} points`}
                        >
                          {score > 0 ? `+${score}` : score}
                        </div>
                      ))}
                      {/* Placeholder for remaining rounds */}
                      {Array.from({ length: totalRounds - player.roundScores.length }).map((_, i) => (
                        <div
                          key={`placeholder-${i}`}
                          className="w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground"
                        >
                          {player.roundScores.length + i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Game Statistics */}
      {variant === 'final' && isGameComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Game Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalRounds}</div>
                <div className="text-sm text-muted-foreground">Rounds Played</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.max(...players.map(p => p.totalScore))}
                </div>
                <div className="text-sm text-muted-foreground">Highest Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {players.reduce((sum, p) => sum + p.timesDetected, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Detections</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {players.reduce((sum, p) => sum + p.timesEvaded, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Successful Lies</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function CompactScoreBoard(props: Omit<ScoreBoardProps, 'variant'>) {
  return <ScoreBoard {...props} variant="compact" />
}

export function FinalScoreBoard(props: Omit<ScoreBoardProps, 'variant'>) {
  return <ScoreBoard {...props} variant="final" />
}