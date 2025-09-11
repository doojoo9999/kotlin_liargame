import React, {useEffect, useState} from 'react';
import {useAdminStore} from '@/stores/adminStore';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    GameController2,
    LogOut,
    RefreshCw,
    Trash2,
    Users,
    UserX,
    XCircle
} from 'lucide-react';
import {toast} from 'sonner';

interface AdminDashboardProps {
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    adminNickname,
    statistics,
    activeGames,
    players,
    profanityRequests,
    pendingContent,
    statisticsLoading,
    gamesLoading,
    playersLoading,
    profanityLoading,
    contentLoading,
    isLoading,
    error,
    fetchStatistics,
    fetchActiveGames,
    fetchPlayers,
    fetchProfanityRequests,
    fetchPendingContent,
    terminateGame,
    kickPlayer,
    grantAdminRole,
    approveProfanityRequest,
    rejectProfanityRequest,
    approveAllContent,
    cleanupStaleGames,
    cleanupDisconnectedPlayers,
    cleanupEmptyGames,
    logout,
    clearError
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Load initial data
    fetchStatistics();
    fetchActiveGames();
    fetchPlayers();
    fetchProfanityRequests();
    fetchPendingContent();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  const handleCleanupAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
      const result = await action();
      toast.success(result.message || successMessage);
    } catch (error) {
      toast.error('Cleanup operation failed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {adminNickname}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statisticsLoading ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : statistics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                    <GameController2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalGames}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.activeGames} currently active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalPlayers}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.onlinePlayers} online now
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Game Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(statistics.averageGameDuration)} min
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {profanityRequests.length + pendingContent.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requiring attention
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No statistics available
              </div>
            )}

            {/* Popular Subjects */}
            {statistics?.popularSubjects && (
              <Card>
                <CardHeader>
                  <CardTitle>Popular Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.popularSubjects.map((subject, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{subject.subject}</span>
                        <Badge variant="secondary">{subject.count} games</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Active Games</h2>
              <Button onClick={fetchActiveGames} disabled={gamesLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {gamesLoading ? (
              <div className="text-center py-8">Loading games...</div>
            ) : (
              <div className="grid gap-4">
                {activeGames.map((game) => (
                  <Card key={game.gameNumber}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">Game #{game.gameNumber}</h3>
                          <p className="text-sm text-gray-600">
                            Host: {game.hostName} | Players: {game.playerCount}/{game.maxPlayers}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {formatDate(game.createdAt)} | 
                            Last Activity: {formatDate(game.lastActivity)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(game.gameState)}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => terminateGame(game.gameNumber)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {activeGames.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No active games
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Players</h2>
              <Button onClick={fetchPlayers} disabled={playersLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {playersLoading ? (
              <div className="text-center py-8">Loading players...</div>
            ) : (
              <div className="grid gap-4">
                {players.map((player) => (
                  <Card key={player.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{player.nickname}</h3>
                          <p className="text-sm text-gray-600">
                            Games: {player.gamesPlayed} | Win Rate: {(player.winRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            Last Seen: {formatDate(player.lastSeen)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {player.isOnline ? (
                            <Badge variant="default">Online</Badge>
                          ) : (
                            <Badge variant="secondary">Offline</Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => grantAdminRole(player.id)}
                            disabled={isLoading}
                          >
                            Grant Admin
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {players.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No players found
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Profanity Requests */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profanity Requests</CardTitle>
                  <Button onClick={fetchProfanityRequests} disabled={profanityLoading}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {profanityLoading ? (
                  <div className="text-center py-4">Loading requests...</div>
                ) : (
                  <div className="space-y-2">
                    {profanityRequests.map((request) => (
                      <div key={request.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">{request.word}</span>
                          <p className="text-sm text-gray-600">
                            Requested by: {request.requestedBy}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveProfanityRequest(request.id)}
                            disabled={profanityLoading}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectProfanityRequest(request.id)}
                            disabled={profanityLoading}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {profanityRequests.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No pending profanity requests
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Content */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pending Content</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={fetchPendingContent} disabled={contentLoading}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={approveAllContent} 
                      disabled={contentLoading || pendingContent.length === 0}
                    >
                      Approve All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="text-center py-4">Loading content...</div>
                ) : (
                  <div className="space-y-2">
                    {pendingContent.map((content) => (
                      <div key={content.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{content.type}</Badge>
                            <span className="font-medium">{content.content}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Submitted by: {content.submittedBy} on {formatDate(content.submittedAt)}
                          </p>
                        </div>
                        {getStatusBadge(content.status)}
                      </div>
                    ))}
                    {pendingContent.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No pending content
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <h2 className="text-lg font-semibold">System Maintenance</h2>
            
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cleanup Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => handleCleanupAction(
                      cleanupStaleGames,
                      'Stale games cleaned up successfully'
                    )}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Stale Games
                  </Button>
                  
                  <Button
                    onClick={() => handleCleanupAction(
                      cleanupDisconnectedPlayers,
                      'Disconnected players cleaned up successfully'
                    )}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Cleanup Disconnected Players
                  </Button>
                  
                  <Button
                    onClick={() => handleCleanupAction(
                      cleanupEmptyGames,
                      'Empty games cleaned up successfully'
                    )}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Empty Games
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};