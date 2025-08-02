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
  Slider,
  Snackbar,
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
  Logout as LogoutIcon,
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {useGame} from '../context/GameContext'
import config from '../config/environment'

function LobbyPage() {
  const {
    roomList,
    subjects,
    currentUser,
    loading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    fetchSubjects,
    addSubject,
    addWord,
    logout
  } = useGame()

  // Modal states
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [addContentOpen, setAddContentOpen] = useState(false)

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success' | 'error' | 'warning' | 'info'
  })

  // Form states for room creation
  const [roomForm, setRoomForm] = useState({
    title: '',
    maxPlayers: config.game.minPlayers,
    gTotalRounds: config.game.defaultRounds,
    password: '',
    subjectId: 1,
    hasPassword: false,
    gameMode: 'LIAR_KNOWS' // 'LIAR_KNOWS' | 'LIAR_DIFFERENT_ANSWER'
  })

  // Form state for joining room
  const [joinPassword, setJoinPassword] = useState('')

  // Form states for adding content
  const [contentForm, setContentForm] = useState({
    newSubject: '',
    selectedSubject: '',
    newWord: ''
  })

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

  // Handle content form changes
  const handleContentFormChange = (field, value) => {
    setContentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Validate form data
  const validateFormData = (data) => {
    const errors = []
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('방 제목을 입력해주세요.')
    }
    
    if (data.maxPlayers < 3 || data.maxPlayers > 15) {
      errors.push('참가자는 3명에서 15명 사이로 설정해주세요.')
    }
    
    if (data.gTotalRounds < 1 || data.gTotalRounds > 10) {
      errors.push('라운드는 1라운드에서 10라운드 사이로 설정해주세요.')
    }
    
    if (!data.subjectId) {
      errors.push('주제를 하나 이상 선택해주세요.')
    }
    
    return errors
  }

  // Handle room creation
  const handleCreateRoom = async () => {
    const validationErrors = validateFormData(roomForm)
    
    if (validationErrors.length > 0) {
      showSnackbar(validationErrors.join('\n'), 'error')
      return
    }

    try {
      const roomData = {
        gName: roomForm.title,
        gParticipants: roomForm.maxPlayers,
        gTotalRounds: roomForm.gTotalRounds,
        gPassword: roomForm.hasPassword ? roomForm.password : null,
        subjectIds: roomForm.subjectId ? [roomForm.subjectId] : null,
        useRandomSubjects: !roomForm.subjectId,
        randomSubjectCount: !roomForm.subjectId ? 1 : null
      }

      console.log('[DEBUG_LOG] Creating room with data:', roomData)
      await createRoom(roomData)
      setCreateRoomOpen(false)
      showSnackbar('방이 성공적으로 생성되었습니다.', 'success')
      
      // Reset form
      setRoomForm({
        title: '',
        maxPlayers: 6,
        gTotalRounds: 3,
        password: '',
        subjectId: 1,
        hasPassword: false,
        gameMode: 'LIAR_KNOWS'
      })
    } catch (error) {
      console.error('Failed to create room:', error)
      
      // 에러 메시지 파싱 및 사용자 친화적 메시지 표시
      let errorMessage = '방 생성에 실패했습니다.'
      
      if (error.response?.data?.message) {
        const backendError = error.response.data.message
        if (backendError.includes('참가자는')) {
          errorMessage = '참가자 수는 3명에서 15명 사이로 설정해주세요.'
        } else if (backendError.includes('라운드')) {
          errorMessage = '라운드 수를 확인해주세요.'
        }
      }
      
      showSnackbar(errorMessage, 'error')
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

  // Handle logout
  const handleLogout = () => {
    console.log('[DEBUG_LOG] User logging out:', currentUser?.nickname)
    logout()
    setLogoutDialogOpen(false)
  }

  // Handle adding subject
  const handleAddSubject = async () => {
    if (!contentForm.newSubject.trim()) {
      showSnackbar('주제를 입력해주세요.', 'error')
      return
    }

    // Check if subject already exists
    const existingSubject = subjects.find(s => s.name.toLowerCase() === contentForm.newSubject.trim().toLowerCase())
    if (existingSubject) {
      showSnackbar('이미 존재하는 주제입니다.', 'error')
      return
    }

    try {
      await addSubject(contentForm.newSubject.trim())
      showSnackbar('주제가 성공적으로 추가되었습니다.', 'success')
      setContentForm(prev => ({ ...prev, newSubject: '' }))
    } catch (error) {
      showSnackbar('주제 추가에 실패했습니다.', 'error')
    }
  }

  // Handle adding word
  const handleAddWord = async () => {
    if (!contentForm.selectedSubject) {
      showSnackbar('주제를 선택해주세요.', 'error')
      return
    }

    if (!contentForm.newWord.trim()) {
      showSnackbar('답안을 입력해주세요.', 'error')
      return
    }

    try {
      const selectedSubjectName = subjects.find(s => s.id === contentForm.selectedSubject)?.name
      await addWord(selectedSubjectName, contentForm.newWord.trim())
      showSnackbar('답안이 성공적으로 추가되었습니다.', 'success')
      setContentForm(prev => ({ ...prev, newWord: '' }))
    } catch (error) {
      showSnackbar('답안 추가에 실패했습니다.', 'error')
    }
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
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            라이어 게임 로비
          </Typography>
          {currentUser && (
            <Typography variant="body2" color="text.secondary">
              환영합니다, {currentUser.nickname}님!
            </Typography>
          )}
        </Box>
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
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddContentOpen(true)}
          >
            주제/답안 추가
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setLogoutDialogOpen(true)}
          >
            로그아웃
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
            
            <Box sx={{ px: 2, py: 1 }}>
              <Typography gutterBottom>
                참가자 수: {roomForm.maxPlayers}명
              </Typography>
              <Slider
                value={roomForm.maxPlayers}
                onChange={(e, value) => handleRoomFormChange('maxPlayers', value)}
                min={config.game.minPlayers}
                max={config.game.maxPlayers}
                step={1}
                marks={[
                  { value: config.game.minPlayers, label: `${config.game.minPlayers}명` },
                  { value: Math.floor((config.game.minPlayers + config.game.maxPlayers) / 2), label: `${Math.floor((config.game.minPlayers + config.game.maxPlayers) / 2)}명` },
                  { value: config.game.maxPlayers, label: `${config.game.maxPlayers}명` }
                ]}
                valueLabelDisplay="auto"
                sx={{ mt: 2, mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                최소 {config.game.minPlayers}명, 최대 {config.game.maxPlayers}명까지 설정 가능합니다.
              </Typography>
            </Box>

            <Box sx={{ px: 2, py: 1 }}>
              <Typography gutterBottom>
                라운드 수: {roomForm.gTotalRounds}라운드
              </Typography>
              <Slider
                value={roomForm.gTotalRounds}
                onChange={(e, value) => handleRoomFormChange('gTotalRounds', value)}
                min={config.game.minRounds}
                max={config.game.maxRounds}
                step={1}
                marks={[
                  { value: config.game.minRounds, label: `${config.game.minRounds}` },
                  { value: config.game.defaultRounds, label: `${config.game.defaultRounds}` },
                  { value: Math.floor((config.game.minRounds + config.game.maxRounds) / 2), label: `${Math.floor((config.game.minRounds + config.game.maxRounds) / 2)}` },
                  { value: config.game.maxRounds, label: `${config.game.maxRounds}` }
                ]}
                valueLabelDisplay="auto"
                sx={{ mt: 2, mb: 1 }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>주제</InputLabel>
              <Select
                value={roomForm.subjectId}
                onChange={(e) => handleRoomFormChange('subjectId', e.target.value)}
                label="주제"
                variant="outlined"
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
                variant="outlined"
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>로그아웃</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 로그아웃하시겠습니까?
            {currentUser && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'medium' }}>
                {currentUser.nickname}님의 세션이 종료됩니다.
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleLogout}
            color="error"
            variant="contained"
          >
            로그아웃
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Content Dialog */}
      <Dialog open={addContentOpen} onClose={() => setAddContentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>주제/답안 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Subject Addition Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                새 주제 추가
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="주제 이름"
                  value={contentForm.newSubject}
                  onChange={(e) => handleContentFormChange('newSubject', e.target.value)}
                  placeholder="예: 음식, 동물, 직업"
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleAddSubject}
                  disabled={loading.subjects || !contentForm.newSubject.trim()}
                  sx={{ minWidth: '100px' }}
                >
                  {loading.subjects ? <CircularProgress size={20} /> : '추가'}
                </Button>
              </Box>
            </Box>

            {/* Word Addition Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                답안 추가
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>주제 선택</InputLabel>
                  <Select
                    value={contentForm.selectedSubject}
                    onChange={(e) => handleContentFormChange('selectedSubject', e.target.value)}
                    label="주제 선택"
                    variant="outlined"
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="답안"
                    value={contentForm.newWord}
                    onChange={(e) => handleContentFormChange('newWord', e.target.value)}
                    placeholder="답안을 입력하세요"
                    fullWidth
                    disabled={!contentForm.selectedSubject}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddWord}
                    disabled={loading.subjects || !contentForm.selectedSubject || !contentForm.newWord.trim()}
                    sx={{ minWidth: '100px' }}
                  >
                    {loading.subjects ? <CircularProgress size={20} /> : '추가'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddContentOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default LobbyPage