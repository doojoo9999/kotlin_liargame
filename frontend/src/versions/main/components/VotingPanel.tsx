import {useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {VotingPlayerCard} from './PlayerCard'
import {AlertCircle, Clock, Target, Users} from 'lucide-react'
import {cn} from '@/lib/utils'

interface Player {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
  isOnline: boolean
  isCurrentUser?: boolean
  hasVoted?: boolean
}

interface VotingPanelProps {
  players: Player[]
  selectedPlayerId?: string
  onVote: (playerId: string) => void
  onConfirm: () => void
  timeRemaining?: number
  totalTime?: number
  isLoading?: boolean
  hasVoted?: boolean
  votingResults?: Record<string, number>
  showResults?: boolean
  className?: string
}

export function VotingPanel({
  players,
  selectedPlayerId,
  onVote,
  onConfirm,
  timeRemaining,
  totalTime = 60,
  isLoading = false,
  hasVoted = false,
  votingResults,
  showResults = false,
  className
}: VotingPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  
  // Calculate voting progress
  const votedCount = players.filter(p => p.hasVoted).length
  const totalPlayers = players.length
  const progressPercentage = (votedCount / totalPlayers) * 100

  // Time progress
  const timeProgressPercentage = timeRemaining && totalTime 
    ? (timeRemaining / totalTime) * 100 
    : 100

  const handleConfirmVote = async () => {
    if (!selectedPlayerId) return
    
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Voting Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
          <Target className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">Time to Vote</h2>
        <p className="text-muted-foreground">
          Who do you think is the liar? Choose carefully!
        </p>
      </div>

      {/* Timer and Progress */}
      {(timeRemaining !== undefined || !showResults) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Time Remaining */}
            {timeRemaining !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Time Remaining
                  </span>
                  <span className="font-mono">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Progress 
                  value={timeProgressPercentage} 
                  className={cn(
                    "h-2",
                    timeRemaining < 10 ? "bg-red-100" : "bg-muted"
                  )}
                />
              </div>
            )}

            {/* Voting Progress */}
            {!showResults && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Players Voted
                  </span>
                  <span>{votedCount}/{totalPlayers}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voting Instructions */}
      {!hasVoted && !showResults && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Voting Instructions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Click on a player to select them as your suspect</li>
                  <li>• You cannot vote for yourself</li>
                  <li>• Confirm your vote when you're ready</li>
                  <li>• Once confirmed, you cannot change your vote</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {showResults ? 'Voting Results' : 'Select the Liar'}
          </CardTitle>
          {!showResults && (
            <CardDescription>
              Click on the player you suspect is the liar
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {players
                .filter(p => !p.isCurrentUser) // Can't vote for yourself
                .map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <VotingPlayerCard
                    player={player}
                    onVote={hasVoted || showResults ? undefined : onVote}
                    selected={selectedPlayerId === player.id}
                    disabled={isLoading || hasVoted}
                    showVoteCount={showResults}
                    votes={votingResults?.[player.id] || 0}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Selected Player Confirmation */}
      <AnimatePresence>
        {selectedPlayer && !hasVoted && !showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      You selected:
                    </p>
                    <p className="text-lg font-semibold">
                      {selectedPlayer.nickname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Are you sure they're the liar?
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => onVote('')}
                      disabled={isLoading || isConfirming}
                    >
                      Change Vote
                    </Button>
                    <Button
                      onClick={handleConfirmVote}
                      disabled={isLoading || isConfirming}
                      className="min-w-24"
                    >
                      {isConfirming ? 'Confirming...' : 'Confirm Vote'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote Confirmed Message */}
      {hasVoted && !showResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                Vote Confirmed!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                You voted for <strong>{selectedPlayer?.nickname}</strong>.
                <br />
                Waiting for other players to finish voting...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results Summary */}
      {showResults && votingResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Final Results</CardTitle>
              <CardDescription>
                Here's how everyone voted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(votingResults)
                  .sort(([,a], [,b]) => b - a)
                  .map(([playerId, votes]) => {
                    const player = players.find(p => p.id === playerId)
                    if (!player) return null
                    
                    const percentage = (votes / totalPlayers) * 100
                    
                    return (
                      <div key={playerId} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {player.nickname[0]}
                          </div>
                          <span className="font-medium">{player.nickname}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {votes} vote{votes !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}