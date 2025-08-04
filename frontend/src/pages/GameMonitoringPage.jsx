import React, {useCallback, useEffect, useState} from 'react'
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import {
    Games as GamesIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Stop as StopIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import axios from 'axios'
import adminStompClient from '../utils/stompClient'

function GameMonitoringPage() {
    // State management
    const [stats, setStats] = useState({
        totalPlayers: 0,
        activeGames: 0,
        totalGames: 0,
        playersInLobby: 0
    })
    const [gameRooms, setGameRooms] = useState([])
    const [allPlayers, setAllPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [wsConnected, setWsConnected] = useState(false)

    // API base URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021'

    // Fetch statistics data
    const fetchStats = useCallback(async () => {
        try {
            // Authorization 헤더 제거, withCredentials가 세션 처리
            const response = await axios.get(`${API_BASE_URL}/api/v1/admin/stats`)
            setStats(response.data)
        } catch (error) {
            console.error('[DEBUG_LOG] Failed to fetch stats:', error)
            setError('통계 데이터를 불러오는데 실패했습니다.')
        }
    }, [API_BASE_URL])

    // Fetch game rooms data
    const fetchGameRooms = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/game/rooms`)
            setGameRooms(response.data.gameRooms || [])
        } catch (error) {
            console.error('[DEBUG_LOG] Failed to fetch game rooms:', error)
            setError('게임방 데이터를 불러오는데 실패했습니다.')
        }
    }, [API_BASE_URL])

    // Fetch all players data
    const fetchAllPlayers = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/admin/players`)
            setAllPlayers(response.data.players || [])
        } catch (error) {
            console.error('[DEBUG_LOG] Failed to fetch players:', error)
            setError('플레이어 데이터를 불러오는데 실패했습니다.')
        }
    }, [API_BASE_URL])

    // Force terminate game room
    const forceTerminateRoom = async (gameNumber) => {
        try {
            await axios.post(`${API_BASE_URL}/api/v1/admin/terminate-room`, 
                { gameNumber }
            )
            // Refresh data after termination
            await fetchGameRooms()
            await fetchStats()
        } catch (error) {
            console.error('[DEBUG_LOG] Failed to terminate room:', error)
            setError('게임방 강제 종료에 실패했습니다.')
        }
    }

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError(null)
            
            try {
                await Promise.all([
                    fetchStats(),
                    fetchGameRooms(),
                    fetchAllPlayers()
                ])
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to load initial data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [fetchStats, fetchGameRooms, fetchAllPlayers])

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats()
            fetchGameRooms()
            fetchAllPlayers()
        }, 30000)

        return () => clearInterval(interval)
    }, [fetchStats, fetchGameRooms, fetchAllPlayers])

    // WebSocket connection and real-time updates
    useEffect(() => {
        const connectWebSocket = async () => {
            try {
                console.log('[DEBUG_LOG] Connecting to admin monitoring WebSocket')
                await adminStompClient.connect(API_BASE_URL)
                setWsConnected(true)

                // Subscribe to admin monitoring topic
                adminStompClient.subscribe('/topic/admin/monitor', (data) => {
                    console.log('[DEBUG_LOG] Received admin monitoring update:', data)
                    
                    // Handle different types of real-time updates
                    switch (data.type) {
                        case 'STATS_UPDATE':
                            setStats(prevStats => ({
                                ...prevStats,
                                ...data.stats
                            }))
                            break
                        case 'GAME_ROOM_UPDATE':
                            // Update specific game room or refresh all
                            if (data.gameRoom) {
                                setGameRooms(prevRooms => {
                                    const updatedRooms = prevRooms.filter(room => room.gameNumber !== data.gameRoom.gameNumber)
                                    if (data.gameRoom.status !== 'ENDED') {
                                        updatedRooms.push(data.gameRoom)
                                    }
                                    return updatedRooms
                                })
                            } else {
                                // Refresh all game rooms
                                fetchGameRooms()
                            }
                            break
                        case 'PLAYER_UPDATE':
                            // Update player list
                            if (data.players) {
                                setAllPlayers(data.players)
                            } else {
                                fetchAllPlayers()
                            }
                            break
                        case 'ROOM_TERMINATED':
                            // Remove terminated room and refresh stats
                            setGameRooms(prevRooms => 
                                prevRooms.filter(room => room.gameNumber !== data.gameNumber)
                            )
                            fetchStats()
                            break
                        default:
                            console.log('[DEBUG_LOG] Unknown admin monitoring update type:', data.type)
                    }
                })

                console.log('[DEBUG_LOG] Admin monitoring WebSocket connected and subscribed')
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to connect admin monitoring WebSocket:', error)
                setWsConnected(false)
                setError('실시간 업데이트 연결에 실패했습니다. 페이지를 새로고침해주세요.')
            }
        }

        connectWebSocket()

        // Cleanup on unmount
        return () => {
            console.log('[DEBUG_LOG] Disconnecting admin monitoring WebSocket')
            adminStompClient.unsubscribe('/topic/admin/monitor')
            adminStompClient.disconnect()
            setWsConnected(false)
        }
    }, [API_BASE_URL, fetchStats, fetchGameRooms, fetchAllPlayers])

    // Get status color for game rooms
    const getStatusColor = (status) => {
        switch (status) {
            case 'WAITING': return 'warning'
            case 'IN_PROGRESS': return 'success'
            case 'FINISHED': return 'default'
            default: return 'default'
        }
    }

    // Get status text in Korean
    const getStatusText = (status) => {
        switch (status) {
            case 'WAITING': return '대기중'
            case 'IN_PROGRESS': return '진행중'
            case 'FINISHED': return '종료됨'
            default: return status
        }
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                게임 모니터링
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        현재 접속자
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.totalPlayers}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <GamesIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        진행중인 게임
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.activeGames}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        총 게임 수
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.totalGames}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        로비 대기자
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.playersInLobby}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Game Rooms List */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            실시간 게임방 목록
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>방 번호</TableCell>
                                        <TableCell>방 이름</TableCell>
                                        <TableCell>참가자</TableCell>
                                        <TableCell>상태</TableCell>
                                        <TableCell>비밀번호</TableCell>
                                        <TableCell>관리</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {gameRooms.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                현재 진행중인 게임방이 없습니다.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        gameRooms.map((room) => (
                                            <TableRow key={room.gameNumber}>
                                                <TableCell>{room.gameNumber}</TableCell>
                                                <TableCell>{room.gameName}</TableCell>
                                                <TableCell>
                                                    {room.playerCount}/{room.maxPlayers}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={getStatusText(room.status)}
                                                        color={getStatusColor(room.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {room.hasPassword ? '🔒' : '🔓'}
                                                </TableCell>
                                                <TableCell>
                                                    {room.status !== 'FINISHED' && (
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            startIcon={<StopIcon />}
                                                            onClick={() => forceTerminateRoom(room.gameNumber)}
                                                        >
                                                            강제 종료
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Players List */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            접속 중인 플레이어
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {allPlayers.length === 0 ? (
                                <ListItem>
                                    <ListItemText 
                                        primary="접속 중인 플레이어가 없습니다."
                                        sx={{ textAlign: 'center' }}
                                    />
                                </ListItem>
                            ) : (
                                allPlayers.map((player, index) => (
                                    <ListItem key={player.id || index}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                {player.nickname?.charAt(0) || 'U'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={player.nickname || '익명'}
                                            secondary={`ID: ${player.id || 'N/A'} | 상태: ${player.status || '로비'}`}
                                        />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}

export default GameMonitoringPage