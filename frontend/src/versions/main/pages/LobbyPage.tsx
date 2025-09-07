import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    LogOut,
    Play,
    RefreshCw,
    Settings,
    Share2,
    UserPlus,
    Users
} from 'lucide-react'
import {useGameStore} from '@/store/gameStore'
import {useGameStatus, useSetReady, useStartGame} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'
import type {Player} from '../components'
import {LobbyPlayerCard, PlayerCardSkeleton} from '../components'

export function MainLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const {
    gameId,
    sessionCode,
    players,
    currentPlayer,
    maxPlayers,
    timeLimit,
    totalRounds,
    gamePhase,
    updatePlayers,
    setGamePhase,
    updateGameSettings
  } = useGameStore()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [newSettings, setNewSettings] = useState({
    maxPlayers: maxPlayers,
    timeLimit: timeLimit,
    totalRounds: totalRounds
  })

  // Queries and mutations
  const { data: gameStatus, isLoading, error } = useGameStatus(gameId)
  const startGameMutation = useStartGame()
  const setReadyMutation = useSetReady()

  // Mock players for demo - will be replaced with real data
  const mockPlayers: Player[] = [
    {
      id: '1',
      nickname: currentPlayer?.nickname || 'You',
      isHost: true,
      isReady: currentPlayer?.isReady || false,
      isOnline: true,
      isCurrentUser: true
    },
    {
      id: '2',
      nickname: 'Alice',
      isHost: false,
      isReady: true,
      isOnline: true
    },
    {
      id: '3',
      nickname: 'Bob',
      isHost: false,
      isReady: false,
      isOnline: true
    },
    {
      id: '4',
      nickname: 'Charlie',
      isHost: false,
      isReady: true,
      isOnline: false
    }
  ]

  const currentPlayers = players.length > 0 ? players : mockPlayers
  const isHost = currentPlayer?.isHost || currentPlayers.find(p => p.isCurrentUser)?.isHost
  const allPlayersReady = currentPlayers.every(p => p.isReady)
  const canStartGame = isHost && allPlayersReady && currentPlayers.length >= 3
  const readyCount = currentPlayers.filter(p => p.isReady).length

  // Handle game status updates
  useEffect(() => {
    if (gameStatus) {
      updatePlayers(gameStatus.players)
      setGamePhase(gameStatus.phase)
      
      // Redirect if game starts
      if (gameStatus.phase === 'playing') {
        navigate(`/main/game/${roomId}`)
      }
    }
  }, [gameStatus, roomId, navigate, updatePlayers, setGamePhase])

  const handleCopyCode = async () => {
    if (sessionCode) {
      try {
        await navigator.clipboard.writeText(sessionCode)
        toast({
          title: "Code copied!",
          description: "Session code copied to clipboard",
        })
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy the code manually",
          variant: "destructive"
        })
      }
    }
  }

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/main/join?code=${sessionCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Liar Game!',
          text: `Join my game with code: ${sessionCode}`,
          url: shareUrl
        })
      } catch (error) {
        // User cancelled or share failed
        handleCopyCode()
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        })
      } catch (error) {
        handleCopyCode()
      }
    }
  }

  const handleToggleReady = async () => {
    try {
      const newReadyState = !currentPlayer?.isReady
      await setReadyMutation.mutateAsync({ ready: newReadyState })
      
      toast({
        title: newReadyState ? "You're ready!" : "Ready status removed",
        description: newReadyState ? "Waiting for other players" : "Mark as ready when you're set to play"
      })
    } catch (error: any) {
      toast({
        title: "Failed to update ready status",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleStartGame = async () => {
    if (!canStartGame) return
    
    try {
      await startGameMutation.mutateAsync(gameId!)
      toast({
        title: "Game starting!",
        description: "Get ready to receive your topics"
      })
    } catch (error: any) {
      toast({
        title: "Failed to start game",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleUpdateSettings = () => {
    updateGameSettings(newSettings)
    setIsSettingsOpen(false)
    toast({
      title: "Settings updated!",
      description: "Game settings have been applied"
    })
  }

  const handleLeaveGame = () => {
    navigate('/main')
    toast({
      title: "Left game",
      description: "You have left the lobby"
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load game lobby. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold">Game Lobby</h1>
          {gamePhase === 'waiting' && (
            <Badge variant="secondary">Waiting</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {canStartGame 
            ? "All players ready! Host can start the game" 
            : allPlayersReady 
            ? "Need at least 3 players to start" 
            : "Waiting for players to be ready..."
          }
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({currentPlayers.length}/{maxPlayers})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {readyCount} ready
                  </Badge>
                  {isHost && (
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence>
                  {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 4 }).map((_, i) => (
                      <PlayerCardSkeleton key={`skeleton-${i}`} />
                    ))
                  ) : (
                    currentPlayers.map((player) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <LobbyPlayerCard 
                          player={player}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Ready Status Alert */}
          {!allPlayersReady && currentPlayers.length >= 3 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {readyCount} of {currentPlayers.length} players are ready. 
                {!currentPlayer?.isReady && " Mark yourself as ready to continue."}
              </AlertDescription>
            </Alert>
          )}

          {currentPlayers.length < 3 && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Need at least 3 players to start the game. Share the session code to invite more friends!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Game Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Game Settings
                </CardTitle>
                {isHost && (
                  <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Game Settings</DialogTitle>
                        <DialogDescription>
                          Adjust the game settings before starting
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="maxPlayersEdit">Max Players</Label>
                          <Select
                            value={newSettings.maxPlayers.toString()}
                            onValueChange={(value) => setNewSettings(prev => ({
                              ...prev,
                              maxPlayers: parseInt(value)
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 Players</SelectItem>
                              <SelectItem value="4">4 Players</SelectItem>
                              <SelectItem value="5">5 Players</SelectItem>
                              <SelectItem value="6">6 Players</SelectItem>
                              <SelectItem value="8">8 Players</SelectItem>
                              <SelectItem value="10">10 Players</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="timeLimitEdit">Discussion Time</Label>
                          <Select
                            value={newSettings.timeLimit.toString()}
                            onValueChange={(value) => setNewSettings(prev => ({
                              ...prev,
                              timeLimit: parseInt(value)
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="60">1 minute</SelectItem>
                              <SelectItem value="90">1.5 minutes</SelectItem>
                              <SelectItem value="120">2 minutes</SelectItem>
                              <SelectItem value="180">3 minutes</SelectItem>
                              <SelectItem value="300">5 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="totalRoundsEdit">Total Rounds</Label>
                          <Select
                            value={newSettings.totalRounds.toString()}
                            onValueChange={(value) => setNewSettings(prev => ({
                              ...prev,
                              totalRounds: parseInt(value)
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Round</SelectItem>
                              <SelectItem value="3">3 Rounds</SelectItem>
                              <SelectItem value="5">5 Rounds</SelectItem>
                              <SelectItem value="7">7 Rounds</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsSettingsOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateSettings}
                          className="flex-1"
                        >
                          Apply
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Max Players:</span>
                <span className="font-medium">{maxPlayers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discussion Time:</span>
                <span className="font-medium">{Math.floor(timeLimit / 60)} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Rounds:</span>
                <span className="font-medium">{totalRounds}</span>
              </div>
            </CardContent>
          </Card>

          {/* Session Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-sm">Session Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="text-3xl font-mono font-bold tracking-wider">
                {sessionCode || 'ABC123'}
              </div>
              <p className="text-xs text-muted-foreground">
                Share this code with friends
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Game</DialogTitle>
                      <DialogDescription>
                        Invite friends to join your game
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="shareCode">Session Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="shareCode"
                            value={sessionCode || 'ABC123'}
                            readOnly
                            className="text-center font-mono"
                          />
                          <Button
                            variant="outline"
                            onClick={handleCopyCode}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shareLink">Share Link</Label>
                        <div className="flex gap-2">
                          <Input
                            id="shareLink"
                            value={`${window.location.origin}/main/join?code=${sessionCode}`}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            onClick={handleShareLink}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setIsShareOpen(false)}
                      className="w-full mt-4"
                    >
                      Done
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Ready Toggle for non-hosts */}
        {!isHost && (
          <Button
            variant={currentPlayer?.isReady ? "outline" : "default"}
            onClick={handleToggleReady}
            disabled={setReadyMutation.isPending}
            className="sm:order-1"
          >
            {setReadyMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : currentPlayer?.isReady ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            {currentPlayer?.isReady ? "Ready!" : "Mark as Ready"}
          </Button>
        )}

        {/* Start Game for hosts */}
        {isHost && (
          <Button
            size="lg"
            onClick={handleStartGame}
            disabled={!canStartGame || startGameMutation.isPending}
            className="sm:order-1"
          >
            {startGameMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {startGameMutation.isPending ? "Starting..." : "Start Game"}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleLeaveGame}
          className="sm:order-2"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave Game
        </Button>
      </div>
    </div>
  )
}