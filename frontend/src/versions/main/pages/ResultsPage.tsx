import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Separator} from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {Activity, Crown, Home, RotateCcw, Share2, Target, Trophy} from 'lucide-react'
import {useGameStore} from '@/store/gameStore'
import {useRoundResults} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'
import {CompactScoreBoard, FinalScoreBoard} from '../components'

interface PlayerScore {
  id: string
  nickname: string
  totalScore: number
  roundScores: number[]
  roundsWon: number
  timesLiar: number
  timesDetected: number
  timesEvaded: number
  rank: number
  isCurrentUser?: boolean
}

interface RoundResult {
  roundNumber: number
  liarId: string
  topic: string
  votes: Record<string, string[]> // playerId -> array of voter IDs
  liarAnswer?: string
  liarAnswerCorrect?: boolean
}

export function MainResultsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    gameId,
    players,
    currentPlayer,
    currentRound,
    totalRounds,
    gameResults,
    resetGame
  } = useGameStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [celebrationDone, setCelebrationDone] = useState(false)

  // Mock data for comprehensive results
  const mockPlayerScores: PlayerScore[] = [
    {
      id: '1',
      nickname: 'You',
      totalScore: 240,
      roundScores: [80, 60, 100],
      roundsWon: 2,
      timesLiar: 1,
      timesDetected: 2,
      timesEvaded: 0,
      rank: 1,
      isCurrentUser: true
    },
    {
      id: '2',
      nickname: 'Alice',
      totalScore: 220,
      roundScores: [60, 80, 80],
      roundsWon: 1,
      timesLiar: 1,
      timesDetected: 2,
      timesEvaded: 1,
      rank: 2
    },
    {
      id: '3',
      nickname: 'Bob',
      totalScore: 180,
      roundScores: [40, 60, 80],
      roundsWon: 0,
      timesLiar: 1,
      timesDetected: 1,
      timesEvaded: 0,
      rank: 3
    },
    {
      id: '4',
      nickname: 'Charlie',
      totalScore: 200,
      roundScores: [60, 40, 100],
      roundsWon: 1,
      timesLiar: 0,
      timesDetected: 3,
      timesEvaded: 0,
      rank: 2
    }
  ].sort((a, b) => b.totalScore - a.totalScore).map((player, index) => ({
    ...player,
    rank: index + 1
  }))

  const mockRoundResults: RoundResult[] = [
    {
      roundNumber: 1,
      liarId: '3',
      topic: 'ANIMALS',
      votes: {
        '3': ['1', '2', '4'], // Bob got 3 votes
        '2': ['3'] // Alice got 1 vote
      },
      liarAnswer: 'Animals',
      liarAnswerCorrect: true
    },
    {
      roundNumber: 2,
      liarId: '2',
      topic: 'FOOD',
      votes: {
        '2': ['1', '3'], // Alice got 2 votes
        '1': ['2'], // You got 1 vote
        '4': ['4'] // Charlie got 1 vote
      },
      liarAnswer: 'Food',
      liarAnswerCorrect: true
    },
    {
      roundNumber: 3,
      liarId: '1',
      topic: 'MOVIES',
      votes: {
        '1': ['2', '3'], // You got 2 votes
        '3': ['1', '4'] // Bob got 2 votes
      },
      liarAnswer: 'Movies',
      liarAnswerCorrect: true
    }
  ]

  const winner = mockPlayerScores[0]
  const isGameComplete = currentRound >= totalRounds
  const isWinner = winner.isCurrentUser

  // Queries
  const { data: roundResults } = useRoundResults(gameId, currentRound || 1)

  // Celebration effect
  useEffect(() => {
    if (isGameComplete && !celebrationDone) {
      setTimeout(() => {
        setCelebrationDone(true)
      }, 2000)
    }
  }, [isGameComplete, celebrationDone])

  const handlePlayAgain = () => {
    resetGame()
    navigate('/main')
    toast({
      title: "Ready for another game!",
      description: "Create a new game or join an existing one"
    })
  }

  const handleBackToHome = () => {
    resetGame()
    navigate('/main')
  }

  const handleShareResults = async () => {
    const shareText = `Just played Liar Game! 🎮
${isWinner ? '🏆 I won!' : `🎯 ${winner.nickname} won!`}
Final Score: ${winner.totalScore} points
Want to play? Join us at ${window.location.origin}/main`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Liar Game Results',
          text: shareText
        })
      } catch (error) {
        // User cancelled or share failed
        try {
          await navigator.clipboard.writeText(shareText)
          toast({
            title: "Results copied!",
            description: "Share your victory with friends"
          })
        } catch (clipError) {
          toast({
            title: "Sharing failed",
            description: "Could not share results",
            variant: "destructive"
          })
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        toast({
          title: "Results copied!",
          description: "Share your victory with friends"
        })
      } catch (error) {
        toast({
          title: "Sharing failed",
          description: "Could not share results",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Victory Animation */}
      <AnimatePresence>
        {isGameComplete && !celebrationDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear" }}
              className="text-8xl"
            >
              {isWinner ? '🏆' : '🎉'}
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute text-center"
            >
              <h2 className="text-4xl font-bold mb-2">
                {isWinner ? 'You Won!' : 'Game Complete!'}
              </h2>
              <p className="text-muted-foreground">
                {isWinner ? 'Congratulations! 🎊' : `${winner.nickname} is the winner!`}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold">Game Complete!</h1>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {totalRounds} rounds
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-xl text-muted-foreground">
              {isWinner ? (
                <span className="text-primary font-semibold">🎊 You are the champion! 🎊</span>
              ) : (
                <span><strong>{winner.nickname}</strong> is the winner with {winner.totalScore} points!</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Thanks for playing! Want to go again?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scoreboard">Scoreboard</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Winner Highlight */}
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-yellow-700 dark:text-yellow-300">
                Champion: {winner.nickname}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">
                {winner.totalScore} points
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <div className="text-2xl font-bold">{winner.roundsWon}</div>
                  <div className="text-sm text-muted-foreground">Rounds Won</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{winner.timesDetected}</div>
                  <div className="text-sm text-muted-foreground">Correct Guesses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{winner.timesEvaded}</div>
                  <div className="text-sm text-muted-foreground">Times Evaded</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Game Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{totalRounds}</div>
                  <div className="text-sm text-muted-foreground">Total Rounds</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {mockPlayerScores.reduce((sum, p) => sum + p.timesDetected, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Detections</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {mockPlayerScores.reduce((sum, p) => sum + p.timesEvaded, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful Lies</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.max(...mockPlayerScores.map(p => p.totalScore))}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Scoreboard */}
          <CompactScoreBoard
            players={mockPlayerScores}
            currentRound={totalRounds}
            totalRounds={totalRounds}
          />
        </TabsContent>

        {/* Detailed Scoreboard Tab */}
        <TabsContent value="scoreboard" className="space-y-6">
          <FinalScoreBoard
            players={mockPlayerScores}
            currentRound={totalRounds}
            totalRounds={totalRounds}
            variant="final"
            showRoundDetails={true}
          />
        </TabsContent>

        {/* Round-by-Round Results Tab */}
        <TabsContent value="rounds" className="space-y-6">
          <div className="space-y-4">
            {mockRoundResults.map((round, index) => {
              const liar = mockPlayerScores.find(p => p.id === round.liarId)
              const voteEntries = Object.entries(round.votes)
              const maxVotes = Math.max(...voteEntries.map(([,votes]) => votes.length))
              const suspectedLiars = voteEntries.filter(([,votes]) => votes.length === maxVotes)
              const wasLiarCaught = suspectedLiars.some(([playerId]) => playerId === round.liarId)

              return (
                <motion.div
                  key={round.roundNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span>Round {round.roundNumber}</span>
                          <Badge variant="outline">{round.topic}</Badge>
                        </CardTitle>
                        <Badge variant={wasLiarCaught ? "destructive" : "secondary"}>
                          {wasLiarCaught ? "Liar Caught" : "Liar Escaped"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-500" />
                        <span className="text-sm">
                          Liar: <strong>{liar?.nickname}</strong>
                          {round.liarAnswer && (
                            <span className="text-muted-foreground ml-2">
                              (Guessed: "{round.liarAnswer}" - {round.liarAnswerCorrect ? '✓' : '✗'})
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Voting Results:</h4>
                        {voteEntries.map(([playerId, voters]) => {
                          const player = mockPlayerScores.find(p => p.id === playerId)
                          const isLiar = playerId === round.liarId
                          
                          return (
                            <div 
                              key={playerId}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                isLiar ? 'bg-red-100 dark:bg-red-950' : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isLiar 
                                    ? 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300' 
                                    : 'bg-primary text-primary-foreground'
                                }`}>
                                  {player?.nickname[0]}
                                </div>
                                <span className="font-medium">{player?.nickname}</span>
                                {isLiar && (
                                  <Badge variant="destructive" className="text-xs">
                                    Liar
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {voters.length} vote{voters.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button size="lg" onClick={handlePlayAgain}>
          <RotateCcw className="h-5 w-5 mr-2" />
          Play Again
        </Button>
        
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5 mr-2" />
              Share Results
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Your Results</DialogTitle>
              <DialogDescription>
                Let everyone know how the game went!
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  Just played Liar Game! 🎮<br />
                  {isWinner ? '🏆 I won!' : `🎯 ${winner.nickname} won!`}<br />
                  Final Score: {winner.totalScore} points<br />
                  Want to play? Join us at liargame.com
                </p>
              </div>
              
              <Button onClick={handleShareResults} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="lg" onClick={handleBackToHome}>
          <Home className="h-5 w-5 mr-2" />
          Home
        </Button>
      </div>
    </div>
  )
}