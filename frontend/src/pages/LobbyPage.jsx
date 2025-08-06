import React, {useEffect, useRef, useState} from 'react'
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
import useSubjectStore from '../stores/subjectStore'
import config from '../config/environment'

function LobbyPage() {
  const {
    roomList,
    currentUser,
    loading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    logout
  } = useGame()

  // Use subjectStore for subjects data to get real-time word count updates
  const {
    subjects,
    loading: subjectLoading,
    error: subjectError,
    fetchSubjects,
    addSubject,
    addWord
  } = useSubjectStore()

  const subjectsInitialized = useRef(false)
  const prevSubjectCount = useRef(0)

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
    selectedSubjectIds: [],
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

  useEffect(() => {
    if (!subjectsInitialized.current && subjects.length === 0 && !subjectLoading) {
      subjectsInitialized.current = true
      fetchSubjects()
    }
  }, [subjects.length, subjectLoading, fetchSubjects])

  useEffect(() => {
    // Initialize with first subject if no subjects are selected and subjects are available
    if (subjects.length > 0 && roomForm.selectedSubjectIds.length === 0) {
      setRoomForm(prev => ({
        ...prev,
        selectedSubjectIds: [subjects[0]?.id].filter(Boolean)
      }))
    }
  }, [subjects, roomForm.selectedSubjectIds.length])

  useEffect(() => {
    if (subjects.length > prevSubjectCount.current && prevSubjectCount.current > 0) {
      const newSubject = subjects[subjects.length - 1]
      showSnackbar(`새로운 주제 "${newSubject.name}"가 추가되었습니다!`, 'info')
    }
    
    prevSubjectCount.current = subjects.length
  }, [subjects.length])

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
    
    // Title is now optional - removed validation
    
    if (data.maxPlayers < 3 || data.maxPlayers > 15) {
      errors.push('참가자는 3명에서 15명 사이로 설정해주세요.')
    }
    
    if (data.gTotalRounds < 1 || data.gTotalRounds > 10) {
      errors.push('라운드는 1라운드에서 10라운드 사이로 설정해주세요.')
    }
    
    if (!data.selectedSubjectIds || data.selectedSubjectIds.length === 0) {
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
      // Use default title if none provided
      const defaultTitle = currentUser ? `${currentUser.nickname}님의 방` : '새로운 방'
      const finalTitle = roomForm.title.trim() || defaultTitle
      
      const roomData = {
        gameName: finalTitle,
        gameParticipants: roomForm.maxPlayers,
        gameTotalRounds: roomForm.gameTotalRounds,
        gamePassword: roomForm.hasPassword ? roomForm.password : null,
        subjectIds: roomForm.selectedSubjectIds.length > 0 ? roomForm.selectedSubjectIds : null,
        useRandomSubjects: roomForm.selectedSubjectIds.length === 0,
        randomSubjectCount: roomForm.selectedSubjectIds.length === 0 ? 1 : null
      }

      console.log('[DEBUG_LOG] Creating room with data:', roomData)
      await createRoom(roomData)
      setCreateRoomOpen(false)
      showSnackbar('방이 성공적으로 생성되었습니다.', 'success')
      
      // Reset form
      setRoomForm({
        title: '',
        maxPlayers: config.game.minPlayers,
        gameTotalRounds: config.game.defaultRounds,
        password: '',
        selectedSubjectIds: [],
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

  const handleJoinRoom = async () => {
    try {
      await joinRoom(selectedRoom.gameNumber, joinPassword)
      setJoinRoomOpen(false)
      setJoinPassword('')
      setSelectedRoom(null)

      setTimeout(() => {
        fetchRooms()
      }, 1000)
    } catch (error) {
      console.error('Failed to join room:', error)
    }
  }


  // Open join room dialog
  const openJoinDialog = (room) => {
    setSelectedRoom(room)
    setJoinRoomOpen(true)
  }

  // Handle opening create room dialog with default title
  const handleOpenCreateRoom = () => {
    const defaultTitle = currentUser ? `${currentUser.nickname}님의 방` : '새로운 방'
    setRoomForm(prev => ({
      ...prev,
      title: defaultTitle
    }))
    setCreateRoomOpen(true)
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

    // Check if subject already exists (safe object access)
    const existingSubject = subjects.find(s =>
      s &&
      s.name &&
      typeof s.name === 'string' &&
      s.name.toLowerCase() === contentForm.newSubject.trim().toLowerCase()
    )
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
            onClick={handleOpenCreateRoom}
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      방 목록을 불러오는 중...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error.rooms ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                      {error.rooms}
                    </Typography>
                    <Button variant="outlined" onClick={fetchRooms}>
                      다시 시도
                    </Button>
                  </TableCell>
                </TableRow>
              ) : !Array.isArray(roomList) ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                      데이터 형식 오류가 발생했습니다. 페이지를 새로고침해주세요.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => window.location.reload()} 
                      sx={{ mt: 1 }}
                    >
                      새로고침
                    </Button>
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
                        {room.playerCount || room.currentPlayers || 0}/{room.maxPlayers}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {room.subjects && room.subjects.length > 1 ? (
                        <Chip 
                          label={`${room.subjects[0]} 외 ${room.subjects.length - 1}개 주제`} 
                          size="small" 
                          variant="outlined" 
                        />
                      ) : (
                        <Chip 
                          label={room.subjects && room.subjects.length > 0 ? room.subjects[0] : room.subject} 
                          size="small" 
                          variant="outlined" 
                        />
                      )}
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
                        disabled={
                            room.state === 'FINISHED' ||
                            room.state === 'ENDED' ||
                            (parseInt(room.currentPlayers || room.playerCount || 0) >= parseInt(room.maxPlayers || 0))
                      }
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
              placeholder={currentUser ? `${currentUser.nickname}님의 방` : '방 제목을 입력하세요'}
              fullWidth
              sx={{
                '& .MuiInputBase-input::placeholder': {
                  color: '#9e9e9e',
                  opacity: 1
                }
              }}
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

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                주제 선택 (여러 개 선택 가능)
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {subjects.map((subject, index) => {
                  const wordCount = subject.wordIds ? subject.wordIds.length : (subject.word ? subject.word.length : 0)
                  const isDisabled = wordCount < 5
                  const isChecked = roomForm.selectedSubjectIds.includes(subject.id)
                  
                  const checkboxElement = (
                    <FormControlLabel
                      key={subject.id || `subject-${index}-${subject.name}`}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => {
                            const subjectId = subject.id
                            if (e.target.checked) {
                              setRoomForm(prev => ({
                                ...prev,
                                selectedSubjectIds: [...prev.selectedSubjectIds, subjectId]
                              }))
                            } else {
                              setRoomForm(prev => ({
                                ...prev,
                                selectedSubjectIds: prev.selectedSubjectIds.filter(id => id !== subjectId)
                              }))
                            }
                          }}
                          disabled={isDisabled}
                        />
                      }
                      label={`${subject.name} (${wordCount}개 단어)`}
                      sx={{ 
                        width: '100%', 
                        opacity: isDisabled ? 0.5 : 1,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  )
                  
                  if (isDisabled) {
                    return (
                      <Tooltip 
                        key={subject.id || `subject-${index}-${subject.name}`}
                        title={`이 주제는 단어가 ${wordCount}개뿐입니다. 최소 5개의 단어가 필요합니다.`}
                        placement="right"
                      >
                        <Box>{checkboxElement}</Box>
                      </Tooltip>
                    )
                  }
                  
                  return checkboxElement
                })}
                {subjects.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    사용 가능한 주제가 없습니다.
                  </Typography>
                )}
              </Box>
              {roomForm.selectedSubjectIds.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {roomForm.selectedSubjectIds.length}개 주제 선택됨 - 게임 시작 시 랜덤으로 단어가 선택됩니다.
                </Typography>
              )}
            </Box>

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
                  disabled={subjectLoading || !contentForm.newSubject.trim()}
                  sx={{ minWidth: '100px' }}
                >
                  {subjectLoading ? <CircularProgress size={20} /> : '추가'}
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
                      <MenuItem key={`room-${subject.id}-${subject.name}`} value={subject.id}>
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
                    disabled={subjectLoading || !contentForm.selectedSubject || !contentForm.newWord.trim()}
                    sx={{ minWidth: '100px' }}
                  >
                    {subjectLoading ? <CircularProgress size={20} /> : '추가'}
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