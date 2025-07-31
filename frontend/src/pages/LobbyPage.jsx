import React, {useEffect, useState} from 'react'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import {
    Add as AddIcon,
    Lock as LockIcon,
    Login as LoginIcon,
    People as PeopleIcon,
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material'
import {useGame} from '../context/GameContext'

/**
 * LobbyPage component - Main lobby interface for viewing and managing game rooms
 * Features:
 * - Display list of available game rooms
 * - Create new game rooms
 * - Join existing rooms
 * - Refresh room list
 */
function LobbyPage() {
  const {
    roomList,
    subjects,
    loading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    fetchSubjects
  } = useGame()

  // Modal states
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Form states for room creation
  const [roomForm, setRoomForm] = useState({
    title: '',
    maxPlayers: 8,
    password: '',
    subjectId: 1,
    hasPassword: false,
    gameMode: 'LIAR_KNOWS' // 'LIAR_KNOWS' | 'LIAR_DIFFERENT_ANSWER'
  })

  // Form state for joining room
  const [joinPassword, setJoinPassword] = useState('')

  // Load subjects on component mount
  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects()
    }
  }, [subjects.length, fetchSubjects])

  // Handle room creation form changes
  const handleRoomFormChange = (field, value) => {
    setRoomForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle room creation
  const handleCreateRoom = async () => {
    try {
      const roomData = {
        title: roomForm.title,
        maxPlayers: roomForm.maxPlayers,
        subjectId: roomForm.subjectId,
        ...(roomForm.hasPassword && { password: roomForm.password })
      }

      await createRoom(roomData)
      setCreateRoomOpen(false)
      
      // Reset form
      setRoomForm({
        title: '',
        maxPlayers: 8,
        password: '',
        subjectId: 1,
        hasPassword: false,
        gameMode: 'LIAR_KNOWS'
      })
    } catch (error) {
      console.error('Failed to create room:', error)
    }
  }

  // Handle room join
  const handleJoinRoom = async () => {
    try {
      await joinRoom(selectedRoom.gameNumber, joinPassword)
      setJoinRoomOpen(false)
      setJoinPassword('')
      setSelectedRoom(null)
    } catch (error) {
      console.error('Failed to join room:', error)
    }
  }

  // Open join room dialog
  const openJoinDialog = (room) => {
    setSelectedRoom(room)
    setJoinRoomOpen(true)
  }

  // Get room state color
  const getRoomStateColor = (state) => {
    switch (state) {
      case 'WAITING':
        return 'success'
      case 'IN_PROGRESS':
        return 'warning'
      case 'FINISHED':
        return 'default'
      default:
        return 'default'
    }
  }

  // Get room state text
  const getRoomStateText = (state) => {
    switch (state) {
      case 'WAITING':
        return '대기 중'
      case 'IN_PROGRESS':
        return '진행 중'
      case 'FINISHED':
        return '종료'
      default:
        return state
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          라이어 게임 로비
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchRooms}
            disabled={loading.rooms}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateRoomOpen(true)}
          >
            방 만들기
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error.rooms && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.rooms}
        </Alert>
      )}

      {/* Room List */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>방 제목</TableCell>
                <TableCell>방장</TableCell>
                <TableCell align="center">인원</TableCell>
                <TableCell align="center">주제</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">비밀방</TableCell>
                <TableCell align="center">입장</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading.rooms ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : roomList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      생성된 방이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roomList.map((room) => (
                  <TableRow key={room.gameNumber} hover>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {room.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{room.host}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <PeopleIcon fontSize="small" />
                        {room.playerCount}/{room.maxPlayers}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={room.subject} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getRoomStateText(room.state)}
                        color={getRoomStateColor(room.state)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {room.hasPassword && (
                        <Tooltip title="비밀방">
                          <LockIcon fontSize="small" color="action" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={room.state === 'WAITING' ? <LoginIcon /> : <PlayIcon />}
                        onClick={() => openJoinDialog(room)}
                        disabled={room.state === 'FINISHED' || room.playerCount >= room.maxPlayers}
                      >
                        {room.state === 'WAITING' ? '입장' : '관전'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Room Dialog */}
      <Dialog open={createRoomOpen} onClose={() => setCreateRoomOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 방 만들기</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="방 제목"
              value={roomForm.title}
              onChange={(e) => handleRoomFormChange('title', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="최대 인원"
              type="number"
              value={roomForm.maxPlayers}
              onChange={(e) => handleRoomFormChange('maxPlayers', parseInt(e.target.value))}
              inputProps={{ min: 3, max: 12 }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>주제</InputLabel>
              <Select
                value={roomForm.subjectId}
                onChange={(e) => handleRoomFormChange('subjectId', e.target.value)}
                label="주제"
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>게임 모드</InputLabel>
              <Select
                value={roomForm.gameMode}
                onChange={(e) => handleRoomFormChange('gameMode', e.target.value)}
                label="게임 모드"
              >
                <MenuItem value="LIAR_KNOWS">라이어가 자신이 라이어인 것을 아는 모드</MenuItem>
                <MenuItem value="LIAR_DIFFERENT_ANSWER">라이어가 시민과 다른 답을 보는 모드</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={roomForm.hasPassword}
                  onChange={(e) => handleRoomFormChange('hasPassword', e.target.checked)}
                />
              }
              label="비밀방으로 설정"
            />

            {roomForm.hasPassword && (
              <TextField
                label="비밀번호"
                type="password"
                value={roomForm.password}
                onChange={(e) => handleRoomFormChange('password', e.target.value)}
                fullWidth
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoomOpen(false)}>취소</Button>
          <Button
            onClick={handleCreateRoom}
            variant="contained"
            disabled={!roomForm.title || loading.room}
          >
            {loading.room ? <CircularProgress size={20} /> : '방 만들기'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={joinRoomOpen} onClose={() => setJoinRoomOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>방 입장</DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedRoom.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                방장: {selectedRoom.host} | 인원: {selectedRoom.playerCount}/{selectedRoom.maxPlayers}
              </Typography>
              
              {selectedRoom.hasPassword && (
                <TextField
                  label="비밀번호"
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  required
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinRoomOpen(false)}>취소</Button>
          <Button
            onClick={handleJoinRoom}
            variant="contained"
            disabled={loading.room || (selectedRoom?.hasPassword && !joinPassword)}
          >
            {loading.room ? <CircularProgress size={20} /> : '입장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default LobbyPage