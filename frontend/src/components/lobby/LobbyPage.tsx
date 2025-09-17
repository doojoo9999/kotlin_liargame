import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useGameStore} from '@/stores';
import {useAuthStore} from '@/stores/authStore';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {Clock, Crown, Gamepad2, Lock, LogOut, Play, Plus, RefreshCw, Settings, Trophy, Users} from 'lucide-react';
import {toast} from 'sonner';

interface LobbyPageProps {
  onStartGame?: (gameNumber: number) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onStartGame }) => {
  const navigate = useNavigate();
  
  // Store hooks
  const { user, logout } = useAuthStore();
  const {
    gameList,
    gameListLoading,
    gameListError,
    availableGameModes,
    isLoading,
    fetchGameList,
    fetchGameModes,
    createGame,
    joinGame
  } = useGameStore();

  // Local state
  const [selectedTab, setSelectedTab] = useState('browse');
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinGameNumber, setJoinGameNumber] = useState('');
  
  // Create game form state
  const [createGameForm, setCreateGameForm] = useState({
    gameName: '',
    gameMode: 'CLASSIC',
    maxPlayers: 6,
    timeLimit: 120,
    totalRounds: 3,
    isPrivate: false,
    password: ''
  });

  // Load data on mount
  useEffect(() => {
    fetchGameList();
    fetchGameModes();
  }, [fetchGameList, fetchGameModes]);

  // Auto-refresh game list every 30 seconds - only when focused and on browse tab
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTab === 'browse' && document.hasFocus()) {
        fetchGameList();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTab, fetchGameList]);

  const handleCreateGame = async () => {
    if (!createGameForm.gameName.trim()) {
      toast.error('Please enter a game name');
      return;
    }

    if (!user?.nickname) {
      toast.error('Please log in to create a game');
      return;
    }

    try {
      const gameData = {
        hostNickname: user.nickname,
        gameName: createGameForm.gameName,
        gameMode: createGameForm.gameMode as any,
        maxPlayers: createGameForm.maxPlayers,
        timeLimit: createGameForm.timeLimit,
        totalRounds: createGameForm.totalRounds,
        isPrivate: createGameForm.isPrivate,
        password: createGameForm.isPrivate ? createGameForm.password : undefined
      };

      const result = await createGame(gameData);
      
      toast.success('Game created successfully!');
      onStartGame?.(result.gameNumber);
      
      // Reset form
      setCreateGameForm({
        gameName: '',
        gameMode: 'CLASSIC',
        maxPlayers: 6,
        timeLimit: 120,
        totalRounds: 3,
        isPrivate: false,
        password: ''
      });
      
    } catch (error) {
      console.error('Failed to create game', error);
      toast.error('Failed to create game');
    }
  };

  const handleJoinGame = async (gameNumber?: number, password?: string) => {
    const targetGameNumber = gameNumber || parseInt(joinGameNumber);
    
    if (!targetGameNumber || isNaN(targetGameNumber)) {
      toast.error('Please enter a valid game number');
      return;
    }

    if (!user?.nickname) {
      toast.error('Please log in to join a game');
      return;
    }

    try {
      const joinData = {
        gameNumber: targetGameNumber,
        playerNickname: user.nickname,
        password
      };

      const result = await joinGame(joinData);
      
      setIsJoinDialogOpen(false);
      setJoinGameNumber('');
      toast.success('Joined game successfully!');
      onStartGame?.(result.gameNumber);
      
    } catch (error) {
      console.error('Failed to join game', error);
      toast.error('Failed to join game');
    }
  };

  const handleRefresh = () => {
    fetchGameList();
    toast.success('Game list refreshed');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGameStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="secondary">Waiting</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default">In Progress</Badge>;
      case 'ENDED':
        return <Badge variant="outline">Ended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTimeLimit = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Liar Game</h1>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Welcome, {user?.nickname}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="browse">Browse Games</TabsTrigger>
              <TabsTrigger value="create">Create Game</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Button onClick={handleRefresh} disabled={gameListLoading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${gameListLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Join Game
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Game</DialogTitle>
                    <DialogDescription>
                      Enter the game number to join an existing game
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="gameNumber">Game Number</Label>
                      <Input
                        id="gameNumber"
                        type="number"
                        value={joinGameNumber}
                        onChange={(e) => setJoinGameNumber(e.target.value)}
                        placeholder="Enter game number"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleJoinGame()} disabled={isLoading}>
                        Join Game
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Browse Games Tab */}
          <TabsContent value="browse" className="space-y-6">
            <div className="grid gap-4">
              {gameListLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">Loading games...</p>
                </div>
              ) : gameListError ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-red-600">Error: {gameListError}</p>
                    <Button onClick={handleRefresh} className="mt-4">
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : gameList.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Gamepad2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No active games found</p>
                    <Button onClick={() => setSelectedTab('create')}>
                      Create Your First Game
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                gameList.map((game) => (
                  <Card key={game.id || game.gameNumber} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{game.gameName}</h3>
                            {getGameStatusBadge(game.gameState)}
                            {game.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Crown className="h-4 w-4" />
                              <span>Host: {game.hostName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{game.currentPlayers}/{game.maxPlayers} players</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTimeLimit(game.timeLimit || 120)}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Badge variant="outline">{game.gameMode}</Badge>
                            <Badge variant="outline">{game.totalRounds} rounds</Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <Button
                            onClick={() => handleJoinGame(game.gameNumber)}
                            disabled={isLoading || game.gameState !== 'WAITING' || game.currentPlayers >= game.maxPlayers}
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Create Game Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gameName">Game Name</Label>
                    <Input
                      id="gameName"
                      value={createGameForm.gameName}
                      onChange={(e) => setCreateGameForm(prev => ({ ...prev, gameName: e.target.value }))}
                      placeholder="Enter game name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gameMode">Game Mode</Label>
                    <Select
                      value={createGameForm.gameMode}
                      onValueChange={(value) => setCreateGameForm(prev => ({ ...prev, gameMode: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(availableGameModes?.length ? availableGameModes : ['CLASSIC', 'QUICK', 'HARDCORE']).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxPlayers">Max Players</Label>
                    <Select
                      value={createGameForm.maxPlayers.toString()}
                      onValueChange={(value) => setCreateGameForm(prev => ({ ...prev, maxPlayers: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 Players</SelectItem>
                        <SelectItem value="5">5 Players</SelectItem>
                        <SelectItem value="6">6 Players</SelectItem>
                        <SelectItem value="7">7 Players</SelectItem>
                        <SelectItem value="8">8 Players</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                    <Select
                      value={createGameForm.timeLimit.toString()}
                      onValueChange={(value) => setCreateGameForm(prev => ({ ...prev, timeLimit: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="180">3 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="totalRounds">Number of Rounds</Label>
                    <Select
                      value={createGameForm.totalRounds.toString()}
                      onValueChange={(value) => setCreateGameForm(prev => ({ ...prev, totalRounds: parseInt(value) }))}
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
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreateGame} 
                    disabled={isLoading || !createGameForm.gameName.trim()}
                    className="min-w-[120px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
                  <CardTitle>Games Played</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold">--</div>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 mx-auto text-blue-500" />
                  <CardTitle>Win Rate</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold">--%</div>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <Clock className="h-12 w-12 mx-auto text-green-500" />
                  <CardTitle>Average Game Time</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold">-- min</div>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};