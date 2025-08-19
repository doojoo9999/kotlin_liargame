import React, {useCallback, useMemo} from 'react'
import {Alert, Box, CircularProgress, Container, Typography} from '../../components/ui'

// Custom hooks
import useAdminStats from './hooks/useAdminStats'
import useGameRooms from './hooks/useGameRooms'
import useAllPlayers from './hooks/useAllPlayers'
import useAdminMonitorWs from './hooks/useAdminMonitorWs'
import useAutoRefresh from './hooks/useAutoRefresh'

// Components
import StatsCards from './components/StatsCards'
import GameRoomsTable from './components/GameRoomsTable'
import PlayersList from './components/PlayersList'
import ConnectionStatus from './components/ConnectionStatus'

// Utils
import {debugLog} from '../../utils/logger'

// TODO: Get API_BASE_URL from environment or config
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' && window.API_BASE_URL) ||
    'http://localhost:20021'


function GameMonitoringPage() {
  // Data management hooks
  const {
    stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorMessage,
    updateStats,
    refreshStats,
    invalidateStats
  } = useAdminStats()

  const {
    gameRooms,
    isLoading: roomsLoading,
    isError: roomsError,
    error: roomsErrorMessage,
    updateGameRoom,
    removeRoom,
    updateAllRooms,
    refreshRooms,
    invalidateRooms,
    getStatusColor,
    getStatusText
  } = useGameRooms()

  const {
    players,
    isLoading: playersLoading,
    isError: playersError,
    error: playersErrorMessage,
    updatePlayer,
    removePlayer,
    updateAllPlayers,
    refreshPlayers,
    invalidatePlayers
  } = useAllPlayers()

  // WebSocket callback handlers
  const handleStatsUpdate = useCallback((newStats) => {
    debugLog('Updating stats from WebSocket:', newStats)
    updateStats(newStats)
  }, [updateStats])

  const handleGameRoomUpdate = useCallback((updatedRoom) => {
    debugLog('Updating game room from WebSocket:', updatedRoom)
    if (updatedRoom) {
      updateGameRoom(updatedRoom)
    } else {
      // Fallback: refresh all rooms
      refreshRooms()
    }
  }, [updateGameRoom, refreshRooms])

  const handlePlayerUpdate = useCallback((playerData, updateType) => {
    debugLog('Updating players from WebSocket:', playerData, updateType)
    if (playerData === null) {
      // Fallback: refresh all players
      refreshPlayers()
    } else if (updateType === 'single' && playerData.length === 1) {
      // Single player update
      updatePlayer(playerData[0])
    } else {
      // Full player list update
      updateAllPlayers(playerData)
    }
  }, [updatePlayer, updateAllPlayers, refreshPlayers])

  const handleRoomTerminated = useCallback((gameNumber) => {
    debugLog('Room terminated from WebSocket:', gameNumber)
    removeRoom(gameNumber)
    // Also refresh stats since active games count changed
    invalidateStats()
  }, [removeRoom, invalidateStats])

  // WebSocket connection
  const {
    isConnected: wsConnected,
    connectionError: wsError
  } = useAdminMonitorWs({
    onStatsUpdate: handleStatsUpdate,
    onGameRoomUpdate: handleGameRoomUpdate,
    onPlayerUpdate: handlePlayerUpdate,
    onRoomTerminated: handleRoomTerminated,
    apiBaseUrl: API_BASE_URL
  })

  // Auto-refresh functionality
  const refreshFunctions = useMemo(() => [
    refreshStats,
    refreshRooms,
    refreshPlayers
  ], [refreshStats, refreshRooms, refreshPlayers])

  useAutoRefresh({
    refreshFunctions,
    intervalMs: 30000, // 30 seconds
    enabled: true
  })

  // Loading state
  const isLoading = statsLoading || roomsLoading || playersLoading
  const hasError = statsError || roomsError || playersError
  const errorMessage = statsErrorMessage || roomsErrorMessage || playersErrorMessage

  if (isLoading) {
    return (
      <Container maxWidth="lg" style={{ marginTop: '32px', marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" style={{ marginTop: '32px', marginBottom: '32px' }}>
      <Typography variant="h4" gutterBottom>
        게임 모니터링
      </Typography>

      {/* Connection Status */}
      <ConnectionStatus 
        isConnected={wsConnected}
        connectionError={wsError}
      />

      {/* Error Display */}
      {hasError && (
        <Alert severity="error" style={{ marginBottom: '24px' }}>
          {errorMessage?.message || errorMessage || '데이터를 불러오는데 실패했습니다.'}
        </Alert>
      )}

      {/* Statistics Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <Box $display="flex" $gap="24px" $flexWrap="wrap">
        {/* Game Rooms Table */}
        <Box $flex="2" $minWidth="400px">
          <GameRoomsTable
            gameRooms={gameRooms}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </Box>

        {/* Players List */}
        <Box $flex="1" $minWidth="300px">
          <PlayersList players={players} />
        </Box>
      </Box>
    </Container>
  )
}

export default GameMonitoringPage