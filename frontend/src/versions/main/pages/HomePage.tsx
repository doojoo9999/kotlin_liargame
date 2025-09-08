import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Separator} from '@/components/ui/separator'
import {Filter, Play, Plus, RefreshCw, Search, Users} from 'lucide-react'
import {useCreateGame, useJoinGame} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'
import type {GameRoom} from '../components'
import {GameCard, GameCardSkeleton} from '../components'

export function MainHomePage() {
  const [sessionCode, setSessionCode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  
  // Create game form state
  const [createForm, setCreateForm] = useState({
    gameName: '',
    maxPlayers: 6,
    timeLimit: 120,
    totalRounds: 3,
    isPrivate: false
  })

  const navigate = useNavigate()
  const { toast } = useToast()
  
  const createGameMutation = useCreateGame()
  const joinGameMutation = useJoinGame()

  // Mock room data for now - will be replaced with real API
  const mockRooms: GameRoom[] = [
    {
      id: '1',
      name: 'Friday Night Fun',
      sessionCode: 'ABC123',
      hostName: 'Alice',
      currentPlayers: 3,
      maxPlayers: 6,
      timeLimit: 120,
      totalRounds: 3,
      status: 'waiting',
      isPrivate: false
    },
    {
      id: '2', 
      name: 'Quick Game',
      sessionCode: 'XYZ789',
      hostName: 'Bob',
      currentPlayers: 6,
      maxPlayers: 6,
      timeLimit: 90,
      totalRounds: 2,
      status: 'playing',
      isPrivate: false
    },
    {
      id: '3',
      name: 'Family Game Night',
      sessionCode: 'FAM456',
      hostName: 'Charlie',
      currentPlayers: 2,
      maxPlayers: 8,
      timeLimit: 180,
      totalRounds: 5,
      status: 'waiting',
      isPrivate: true
    }
  ]

  // Load rooms (mock implementation)
  const loadRooms = async () => {
    setIsLoadingRooms(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setGameRooms(mockRooms)
    setIsLoadingRooms(false)
  }

  useEffect(() => {
    loadRooms()
  }, [])

  // Filter rooms based on search and status
  const filteredRooms = gameRooms.filter(room => {
    const matchesSearch = searchQuery === '' || 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.sessionCode.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || room.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleCreateGame = async () => {
    try {
      const result = await createGameMutation.mutateAsync({
        maxPlayers: createForm.maxPlayers,
        timeLimit: createForm.timeLimit,
        totalRounds: createForm.totalRounds
      })
      
      setIsCreateDialogOpen(false)
      navigate(`/main/login?action=create&gameId=${result.gameId}&sessionCode=${result.sessionCode}`)
      
      toast({
        title: "Game Created!",
        description: `Session code: ${result.sessionCode}`,
      })
    } catch (error: any) {
      toast({
        title: "Failed to create game",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleJoinGame = () => {
    if (!sessionCode.trim()) {
      toast({
        title: "Session code required",
        description: "Please enter a valid session code",
        variant: "destructive",
      })
      return
    }
    
    navigate(`/main/login?action=join&sessionCode=${sessionCode.trim()}`)
  }

  const handleJoinRoom = (roomId: string, roomSessionCode: string) => {
    navigate(`/main/login?action=join&gameId=${roomId}&sessionCode=${roomSessionCode}`)
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Liar Game
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Can you spot the liar among your friends? Create or join a game to find out!
        </p>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="browse">Browse Games</TabsTrigger>
          <TabsTrigger value="quick">Quick Join</TabsTrigger>
        </TabsList>

        {/* Browse Games Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="playing">Playing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRooms}
                disabled={isLoadingRooms}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Game
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Game</DialogTitle>
                    <DialogDescription>
                      Set up your game room and invite friends to join
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="gameName">Game Name (Optional)</Label>
                      <Input
                        id="gameName"
                        placeholder="Enter a fun game name..."
                        value={createForm.gameName}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          gameName: e.target.value
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxPlayers">Max Players</Label>
                        <Select 
                          value={createForm.maxPlayers.toString()}
                          onValueChange={(value) => setCreateForm(prev => ({
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
                        <Label htmlFor="totalRounds">Rounds</Label>
                        <Select 
                          value={createForm.totalRounds.toString()}
                          onValueChange={(value) => setCreateForm(prev => ({
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

                    <div>
                      <Label htmlFor="timeLimit">Discussion Time</Label>
                      <Select 
                        value={createForm.timeLimit.toString()}
                        onValueChange={(value) => setCreateForm(prev => ({
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

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={createForm.isPrivate}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          isPrivate: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <Label htmlFor="isPrivate" className="text-sm">
                        Private game (not shown in public list)
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateGame}
                      disabled={createGameMutation.isPending}
                      className="flex-1"
                    >
                      {createGameMutation.isPending ? 'Creating...' : 'Create Game'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Room Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{filteredRooms.length} games found</span>
            <span>{filteredRooms.filter(r => r.status === 'waiting').length} waiting for players</span>
            <span>{filteredRooms.filter(r => r.status === 'playing').length} in progress</span>
          </div>

          {/* Room List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {isLoadingRooms ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <GameCardSkeleton key={`skeleton-${i}`} />
                ))
              ) : filteredRooms.length > 0 ? (
                // Room cards
                filteredRooms.map((room) => (
                  <GameCard
                    key={room.id}
                    room={room}
                    onJoin={handleJoinRoom}
                    disabled={joinGameMutation.isPending}
                  />
                ))
              ) : (
                // No rooms message
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12"
                >
                  <div className="text-muted-foreground space-y-2">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No games found</p>
                    <p className="text-sm">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'Try adjusting your search filters' 
                        : 'Be the first to create a game!'
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Quick Join Tab */}
        <TabsContent value="quick" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-center">Join with Code</CardTitle>
                <CardDescription className="text-center">
                  Enter a session code to join a friend's game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter session code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinGame()
                    }
                  }}
                />
                <Button 
                  className="w-full"
                  onClick={handleJoinGame}
                  disabled={joinGameMutation.isPending || !sessionCode.trim()}
                >
                  {joinGameMutation.isPending ? 'Joining...' : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Join Game
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      {/* How to Play Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Play className="h-5 w-5" />
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold">1</div>
                <p className="font-medium">Get Your Topic</p>
                <p className="text-muted-foreground">Everyone gets a topic, except one person gets "LIAR"</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold">2</div>
                <p className="font-medium">Discuss & Deceive</p>
                <p className="text-muted-foreground">Talk about your topic while the liar tries to blend in</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold">3</div>
                <p className="font-medium">Vote & Win</p>
                <p className="text-muted-foreground">Vote for who you think is the liar. Can you spot them?</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}