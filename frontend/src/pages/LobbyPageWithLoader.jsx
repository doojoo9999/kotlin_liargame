import React, {useEffect, useRef, useState} from 'react'
import {useLoaderData} from 'react-router-dom'
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
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
    Add as AddIcon,
    HelpOutline as HelpIcon,
    InfoOutlined as InfoIcon,
    Lock as LockIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    People as PeopleIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material'
import {useGame} from '../context/GameContext'
import useSubjectStore from '../stores/subjectStore'

function LobbyPageWithLoader() {
  // Get preloaded data from router loader
  const loaderData = useLoaderData()
  const { rooms: preloadedRooms, subjects: preloadedSubjects, errors: loaderErrors } = loaderData || {}
  
  const {
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

  // Use preloaded rooms data or fall back to context roomList
  const roomList = preloadedRooms || []

  // Modal states
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [addContentOpen, setAddContentOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  // Initialize subjects with preloaded data
  useEffect(() => {
    if (preloadedSubjects && !subjectsInitialized.current) {
      // Use preloaded subjects data if available
      subjectsInitialized.current = true
    } else if (!subjects || subjects.length === 0) {
      // Fallback to fetching if no preloaded data
      fetchSubjects()
    }
  }, [preloadedSubjects, subjects, fetchSubjects])

  // Show loader errors if any
  const hasLoaderErrors = loaderErrors?.rooms || loaderErrors?.subjects
  
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Show loader errors if any */}
      {hasLoaderErrors && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loaderErrors.rooms && `방 목록 로드 오류: ${loaderErrors.rooms}. `}
          {loaderErrors.subjects && `주제 목록 로드 오류: ${loaderErrors.subjects}. `}
          기본 기능은 계속 사용 가능합니다.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            게임 로비
          </Typography>
          <Typography variant="body1" color="text.secondary">
            안녕하세요, <strong>{currentUser?.nickname}</strong>님! 
            {roomList?.length > 0 ? ` 현재 ${roomList.length}개의 방이 있습니다.` : ' 새로운 방을 만들어보세요!'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchRooms}
            disabled={loading.rooms}
            size="small"
          >
            새로고침
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => setHelpDialogOpen(true)}
            size="small"
          >
            도움말
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => setGameRulesDialogOpen(true)}
            size="small"
          >
            게임 규칙
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setLogoutDialogOpen(true)}
            size="small"
          >
            로그아웃
          </Button>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateRoomOpen(true)}
          size="large"
          sx={{ minWidth: 140 }}
        >
          방 만들기
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => setAddContentOpen(true)}
          size="large"
          sx={{ minWidth: 140 }}
        >
          콘텐츠 추가
        </Button>
      </Box>

      {/* Rooms Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>방 번호</TableCell>
                <TableCell>방 제목</TableCell>
                <TableCell>방장</TableCell>
                <TableCell align="center">인원</TableCell>
                <TableCell>주제</TableCell>
                <TableCell>상태</TableCell>
                <TableCell align="center">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading.rooms ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      방 목록을 불러오는 중...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : roomList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      현재 생성된 방이 없습니다. 새로운 방을 만들어보세요!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roomList.map((room, index) => (
                  <TableRow key={room.gameNumber || index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{room.gameNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {room.hasPassword && <LockIcon fontSize="small" color="action" />}
                        <Typography variant="body1">
                          {room.title || room.gameName || '제목 없음'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {room.host || room.gameOwner || '알 수 없음'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {room.currentPlayers || room.playerCount || 0}/{room.maxPlayers || room.gameParticipants || 4}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {room.subject || '미정'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={room.state || room.gameState || 'WAITING'}
                        size="small"
                        color={
                          (room.state === 'WAITING' || room.gameState === 'WAITING') ? 'success' :
                          (room.state === 'PLAYING' || room.gameState === 'PLAYING') ? 'warning' : 'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LoginIcon />}
                        onClick={() => {
                          setSelectedRoom(room)
                          setJoinRoomOpen(true)
                        }}
                        disabled={loading.room}
                      >
                        입장
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Error Display */}
      {error.rooms && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.rooms}
        </Alert>
      )}

      {/* Note: Dialogs and modals implementation would go here for full functionality */}
    </Container>
  )
}

export default LobbyPageWithLoader