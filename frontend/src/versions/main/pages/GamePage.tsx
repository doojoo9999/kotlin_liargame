import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Textarea} from '@/components/ui/textarea'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {ScrollArea} from '@/components/ui/scroll-area'
import {CheckCircle, Eye, EyeOff, LogOut, MessageCircle, Shield, Target, Users} from 'lucide-react'
import {useGameStore} from '@/store/gameStore'
import {useGameStatus, useSubmitAnswer, useVote} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'
import type {Player} from '../components'
import {CompactTimer, DefenseTimer, DiscussionTimer, GamePlayerCard} from '../components'
import {VotingPanel} from '@/components/game/VotingPanel/VotingPanel'

type GamePhase = 'topic' | 'discussion' | 'voting' | 'defense' | 'results'

export function MainGamePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    gameId,
    players,
    currentPlayer,
    currentRound,
    totalRounds,
    timeLimit,
    currentTopic,
    currentLiar,
    userVote,
    setUserVote
  } = useGameStore()

  const [localPhase, setLocalPhase] = useState<GamePhase>('topic')
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [selectedVote, setSelectedVote] = useState('')
  const [defenseAnswer, setDefenseAnswer] = useState('')
  const [showTopicDialog, setShowTopicDialog] = useState(true)

  // Mock data for demo
  const mockTopic = currentTopic || 'ANIMALS'
  const mockPlayers: Player[] = [
    {
      id: '1',
      nickname: 'You',
      isHost: false,
      isReady: true,
      isOnline: true,
      isCurrentUser: true,
      hasVoted: !!userVote
    },
    {
      id: '2',
      nickname: 'Alice',
      isHost: true,
      isReady: true,
      isOnline: true,
      hasVoted: localPhase === 'voting' ? true : false
    },
    {
      id: '3',
      nickname: 'Bob',
      isHost: false,
      isReady: true,
      isOnline: true,
      hasVoted: localPhase === 'voting' ? false : false
    },
    {
      id: '4',
      nickname: 'Charlie',
      isHost: false,
      isReady: true,
      isOnline: true,
      hasVoted: localPhase === 'voting' ? true : false
    }
  ]

  const currentPlayers = players.length > 0 ? players : mockPlayers
  const isLiar = currentLiar === currentPlayer?.id

  // Queries and mutations
  const { } = useGameStatus(gameId)
  const voteMutation = useVote()
  const submitAnswerMutation = useSubmitAnswer()

  // Phase management
  useEffect(() => {
    // Auto-advance phases for demo
    let phaseTimer: NodeJS.Timeout

    if (localPhase === 'topic') {
      phaseTimer = setTimeout(() => {
        setShowTopicDialog(false)
        setLocalPhase('discussion')
        setTimeRemaining(timeLimit)
      }, 3000)
    } else if (localPhase === 'discussion' && timeRemaining <= 0) {
      setLocalPhase('voting')
      setTimeRemaining(60)
    } else if (localPhase === 'voting' && timeRemaining <= 0) {
      if (isLiar) {
        setLocalPhase('defense')
        setTimeRemaining(30)
      } else {
        setLocalPhase('results')
      }
    } else if (localPhase === 'defense' && timeRemaining <= 0) {
      setLocalPhase('results')
    }

    return () => {
      if (phaseTimer) clearTimeout(phaseTimer)
    }
  }, [localPhase, timeRemaining, timeLimit, isLiar])

  const handleTimeUp = () => {
    setTimeRemaining(0)
  }

  const handleTimeTick = (time: number) => {
    setTimeRemaining(time)
  }

  const handleVote = (playerId: string) => {
    setSelectedVote(playerId)
  }

  const handleConfirmVote = async () => {
    try {
      await voteMutation.mutateAsync({ suspectedLiarId: selectedVote })
      setUserVote(selectedVote)
      toast({
        title: "Vote submitted!",
        description: "Waiting for other players to vote"
      })
    } catch (error: any) {
      toast({
        title: "Failed to submit vote",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleSubmitDefense = async () => {
    if (!defenseAnswer.trim()) {
      toast({
        title: "Please enter your answer",
        description: "You need to guess what the topic was",
        variant: "destructive"
      })
      return
    }

    try {
      await submitAnswerMutation.mutateAsync({ answer: defenseAnswer })
      toast({
        title: "Answer submitted!",
        description: "Your defense has been recorded"
      })
      setLocalPhase('results')
    } catch (error: any) {
      toast({
        title: "Failed to submit answer",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleNextRound = () => {
    // Reset for next round
    setLocalPhase('topic')
    setSelectedVote('')
    setDefenseAnswer('')
    setShowTopicDialog(true)
    setUserVote('')
  }

  const handleEndGame = () => {
    navigate(`/results/${roomId}`)
  }

  const handleLeaveGame = () => {
    navigate('/lobby')
    toast({
      title: "Left game",
      description: "You have left the game"
    })
  }

  const getPhaseTitle = () => {
    switch (localPhase) {
      case 'topic':
        return 'Receiving Topic...'
      case 'discussion':
        return 'Discussion Phase'
      case 'voting':
        return 'Voting Phase'
      case 'defense':
        return 'Defense Phase'
      case 'results':
        return 'Round Results'
      default:
        return 'Game'
    }
  }

  const getPhaseDescription = () => {
    switch (localPhase) {
      case 'topic':
        return 'Get ready to see your topic!'
      case 'discussion':
        return isLiar 
          ? 'Blend in! Try to figure out what the topic is and act natural'
          : 'Talk about your topic and try to figure out who\'s the liar!'
      case 'voting':
        return 'Time to vote! Who do you think is the liar?'
      case 'defense':
        return 'Liar\'s chance! Guess what the topic was to earn points'
      case 'results':
        return 'Let\'s see how everyone did this round'
      default:
        return ''
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Game Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 text-center space-y-3 p-4 border-b"
      >
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Round {currentRound || 1} of {totalRounds}
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {currentPlayers.length} players
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{getPhaseTitle()}</h1>
            <Badge variant="outline">{localPhase}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {getPhaseDescription()}
          </p>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Primary Game Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">

              {/* Topic Reveal Dialog */}
              <Dialog open={showTopicDialog && localPhase === 'topic'}>
                <DialogContent className="max-w-md">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl">
                      {isLiar ? 'You are the LIAR!' : 'Your Topic'}
                    </DialogTitle>
                    <DialogDescription>
                      {isLiar 
                        ? 'Try to blend in and figure out what the topic is'
                        : 'Discuss this topic naturally, but don\'t be too obvious!'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="text-center space-y-4">
                    <div className={`p-6 rounded-lg text-4xl font-bold ${
                      isLiar 
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isLiar ? 'LIAR' : mockTopic}
                    </div>
                    
                    {isLiar && (
                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          Listen carefully to figure out the topic. You'll get a chance to guess later!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Phase Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={localPhase}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
          {/* Discussion Phase */}
          {localPhase === 'discussion' && (
            <div className="space-y-6">
              {/* Timer */}
              <DiscussionTimer
                duration={timeLimit}
                onTimeUp={handleTimeUp}
                onTick={handleTimeTick}
                className="max-w-md mx-auto"
              />

              {/* Topic Display */}
              {!isLiar && (
                <Card className="max-w-md mx-auto">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Your Topic</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{mockTopic}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Discuss this topic naturally. Don't be too obvious!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Liar Hint */}
              {isLiar && (
                <Card className="max-w-md mx-auto bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-2">
                      <EyeOff className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-red-700 dark:text-red-300">You're the Liar</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                      Listen carefully and try to blend in. Figure out what the topic is!
                    </p>
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        You'll get a chance to guess the topic later for bonus points
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Chat Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Chat Integration</p>
                    <p className="text-sm">
                      Real-time chat will be integrated here for players to discuss the topic
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Voting Phase */}
          {localPhase === 'voting' && (
            <VotingPanel
              players={currentPlayers}
              currentUserId="1"
              phase="voting"
              selectedPlayerId={selectedVote}
              onPlayerSelect={handleVote}
              onVoteSubmit={handleConfirmVote}
              timeRemaining={timeRemaining}
              totalTime={60}
              hasVoted={!!userVote}
            />
          )}

          {/* Defense Phase */}
          {localPhase === 'defense' && isLiar && (
            <div className="space-y-6">
              {/* Timer */}
              <DefenseTimer
                duration={30}
                onTimeUp={handleTimeUp}
                onTick={handleTimeTick}
                className="max-w-md mx-auto"
              />

              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <CardTitle>Liar's Defense</CardTitle>
                  <CardDescription>
                    You've been caught! Guess what the topic was to earn points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="What do you think the topic was?"
                    value={defenseAnswer}
                    onChange={(e) => setDefenseAnswer(e.target.value)}
                    className="min-h-24"
                  />
                  <Button
                    onClick={handleSubmitDefense}
                    disabled={submitAnswerMutation.isPending || !defenseAnswer.trim()}
                    className="w-full"
                  >
                    {submitAnswerMutation.isPending ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Waiting for Defense Phase (non-liars) */}
          {localPhase === 'defense' && !isLiar && (
            <div className="text-center space-y-6">
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Defense Phase</h3>
                  <p className="text-muted-foreground">
                    The liar is making their defense. Hang tight!
                  </p>
                  <CompactTimer
                    duration={30}
                    onTimeUp={handleTimeUp}
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Phase */}
          {localPhase === 'results' && (
            <div className="space-y-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">Round Complete!</CardTitle>
                  <CardDescription>
                    Here's how everyone did this round
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div>
                    <p className="text-lg mb-2">
                      The liar was: <strong>Bob</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Topic: <span className="font-medium">{mockTopic}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">3</div>
                      <div className="text-sm text-muted-foreground">Correct Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">1</div>
                      <div className="text-sm text-muted-foreground">Wrong Votes</div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    {currentRound < totalRounds ? (
                      <Button onClick={handleNextRound}>
                        Next Round
                      </Button>
                    ) : (
                      <Button onClick={handleEndGame}>
                        View Final Results
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleLeaveGame}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Game
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
              </motion.div>
            </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar - Players and Chat */}
        <div className="w-80 border-l flex flex-col shrink-0">
          {/* Players Section - Scrollable if many players */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <Card className="m-4 mb-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {currentPlayers.map((player) => (
                        <motion.div
                          key={player.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <GamePlayerCard player={player} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </div>

          {/* Chat Area - Fixed height with internal scroll */}
          <div className="h-64 border-t">
            <Card className="m-4 mt-2 h-full flex flex-col">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-3">
                <ScrollArea className="h-full">
                  <div className="space-y-2 text-sm">
                    <div className="bg-muted/50 rounded-lg p-6 text-center text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium mb-1">Real-time Chat</p>
                      <p className="text-xs">Chat integration coming soon</p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}