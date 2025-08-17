import React, {lazy, Suspense, useEffect, useRef, useState} from 'react'
import {useLoaderData} from 'react-router-dom'
import {ActionIcon, Alert, Box, Container, Grid, Group, Loader, Stack, Text, Title} from '@mantine/core'
import {IconBook, IconDeviceGamepad2, IconHelp, IconLogout, IconPlus, IconRefresh} from '@tabler/icons-react'
import {AnimatePresence, motion} from 'framer-motion'
import {GameRoomCard} from '../components/GameRoomCard'
import {GameLoader} from '../components/GameLoader'
import {useGame} from '../context/GameContext'
import useSubjectStore from '../stores/subjectStore'
// Import dialog components
import GameRulesDialog from '../components/lobby/dialogs/GameRulesDialog'
import HelpDialog from '../components/lobby/dialogs/HelpDialog'
import LogoutDialog from '../components/lobby/dialogs/LogoutDialog'
import CreateRoomDialog from '../components/lobby/dialogs/CreateRoomDialog'
import JoinRoomDialog from '../components/lobby/dialogs/JoinRoomDialog'
import AddContentDialog from '../components/lobby/dialogs/AddContentDialog'
// Import custom animated components
import {MotionMenuButton} from '../components/MotionMenuButton'

const MotionContainer = motion.create(Container)
const MotionGrid = motion.create(Grid)

// --- 성능 최적화를 위해 무거운 컴포넌트 지연 로딩 ---
const AnimatedBackground = lazy(() => import('../components/AnimatedBackground').then(module => ({ default: module.AnimatedBackground })));
const FloatingGamepadIcons = lazy(() => import('../components/FloatingGamepadIcons').then(module => ({ default: module.FloatingGamepadIcons })));

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
  const [joinPassword, setJoinPassword] = useState('')
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [addContentOpen, setAddContentOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [gameRulesDialogOpen, setGameRulesDialogOpen] = useState(false)


  // CreateRoomDialog form state
  const [roomForm, setRoomForm] = useState({
    title: '',
    maxPlayers: 4,
    gTotalRounds: 3,
    selectedSubjectIds: [],
    gameMode: 'LIARS_KNOW',
    hasPassword: false,
    password: ''
  })

  // Game configuration
  const gameConfig = {
    game: {
      minPlayers: 3,
      maxPlayers: 12,
      minRounds: 1,
      maxRounds: 10
    }
  }


  // Form handler for CreateRoomDialog
  const handleRoomFormChange = (field, value) => {
    setRoomForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Submit handler for CreateRoomDialog
  const handleCreateRoomSubmit = async () => {
    try {
      // 제목이 비어있으면 기본값 사용
      const finalTitle = roomForm.title.trim() || `${currentUser?.nickname || 'Guest'}님의 방`
      console.log('[DEBUG_LOG] Creating room with form data:', { ...roomForm, title: finalTitle })
      const result = await createRoom({
        title: finalTitle,
        maxPlayers: roomForm.maxPlayers,
        totalRounds: roomForm.gTotalRounds,
        selectedSubjectIds: roomForm.selectedSubjectIds,
        gameMode: roomForm.gameMode,
        hasPassword: roomForm.hasPassword,
        password: roomForm.hasPassword ? roomForm.password : undefined
      })
      console.log('[DEBUG_LOG] Create room result:', result)

      // Reset form and close dialog on success
      setCreateRoomOpen(false)
      setRoomForm({
        title: '',
        maxPlayers: 4,
        gTotalRounds: 3,
        selectedSubjectIds: [],
        gameMode: 'LIARS_KNOW',
        hasPassword: false,
        password: ''
      })

      if (result && result.gameNumber) {
        console.log('[DEBUG_LOG] Navigating to created game room:', result.gameNumber)
        window.location.href = `/game/${result.gameNumber}`
      }
    } catch (error) {
      console.error('[ERROR] Failed to create room:', error)
    }
  }


  // Reset room form when dialog closes
  const handleCreateRoomClose = () => {
    setCreateRoomOpen(false)
    setRoomForm({
      title: '',
      maxPlayers: 4,
      gTotalRounds: 3,
      selectedSubjectIds: [],
      gameMode: 'LIARS_KNOW',
      hasPassword: false,
      password: ''
    })
  }

  // Handle password change for join room
  const handlePasswordChange = (password) => {
    setJoinPassword(password)
  }

  // Submit handler for JoinRoomDialog
  const handleJoinRoomSubmit = async () => {
    try {
      console.log('[DEBUG_LOG] Joining room:', selectedRoom?.gameNumber, 'with password:', joinPassword ? '***' : 'none')
      const result = await joinRoom(selectedRoom?.gameNumber, joinPassword)
      console.log('[DEBUG_LOG] Join room with password result:', result)

      // Close dialog on success
      setJoinRoomOpen(false)
      setSelectedRoom(null)
      setJoinPassword('')

      if (result && result.gameNumber) {
        console.log('[DEBUG_LOG] Navigating to game room with password:', result.gameNumber)
        window.location.href = `/game/${result.gameNumber}`
      }
    } catch (error) {
      console.error('[ERROR] Failed to join room:', error)
    }
  }

  // Reset join room form when dialog closes
  const handleJoinRoomClose = () => {
    setJoinRoomOpen(false)
    setSelectedRoom(null)
    setJoinPassword('')
  }

  // Initialize subjects with preloaded data
  useEffect(() => {
    // This effect now correctly handles initialization to prevent infinite loops.
    // It runs only if subjects have not been initialized yet.
    if (subjectsInitialized.current) {
      return; // Stop if already initialized.
    }

    // If the store is empty and there's no preloaded data, then fetch.
    if ((!subjects || subjects.length === 0) && (!preloadedSubjects || preloadedSubjects.length === 0)) {
      console.log('[DEBUG_LOG] No subjects found in store or preloader. Fetching from API...');
      fetchSubjects();
    }
    subjectsInitialized.current = true; // Mark as initialized to prevent any future re-fetches by this effect.
  }, [preloadedSubjects, subjects, fetchSubjects]); // Dependencies are kept for correctness, but the logic inside prevents re-runs.
  
  // Show loader errors if any
  const hasLoaderErrors = loaderErrors?.rooms || loaderErrors?.subjects

  const handleJoinRoom = async (room) => {
    try {
      console.log('[DEBUG_LOG] handleJoinRoom called with room:', room)
      setSelectedRoom(room)
      if (room.hasPassword) {
        console.log('[DEBUG_LOG] Room has password, opening password dialog')
        setJoinRoomOpen(true)
      } else {
        console.log('[DEBUG_LOG] Room has no password, attempting direct join for room:', room.gameNumber)
        const result = await joinRoom(room.gameNumber)
        console.log('[DEBUG_LOG] Join room API result:', JSON.stringify(result, null, 2))

        if (result) {
          const gameNumber = result.gameNumber || result.id || room.gameNumber
          console.log('[DEBUG_LOG] Extracted game number for navigation:', gameNumber)

          if (gameNumber) {
            console.log('[DEBUG_LOG] Navigating to game room:', gameNumber)
            window.location.href = `/game/${gameNumber}`
          } else {
            console.error('[ERROR] No game number found in result:', result)
          }
        } else {
          console.error('[ERROR] No result returned from joinRoom')
        }
      }
    } catch (error) {
      console.error('[ERROR] Failed to join room:', error)
      console.error('[ERROR] Error details:', error.message, error.stack)
    }
  }
  
  return (
    <Box style={{
      minHeight: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-start', // 콘텐츠를 상단에 정렬
      justifyContent: 'center'
    }}>
      {/* --- 살아 숨 쉬는 동적 배경 적용 --- */}
      <Suspense fallback={null}>
        <AnimatedBackground />
        <FloatingGamepadIcons />
      </Suspense>

      <MotionContainer size="xl" py="xl" style={{ zIndex: 10, width: '100%' }}>
        {/* 
          Show loader errors if any 
        */}
        {hasLoaderErrors && (
          <Alert color="red" mb="md">
            {loaderErrors.rooms && `방 목록 로드 오류: ${loaderErrors.rooms}. `}
            {loaderErrors.subjects && `주제 목록 로드 오류: ${loaderErrors.subjects}. `}
            기본 기능은 계속 사용 가능합니다.
          </Alert>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Group gap="sm">
                <IconDeviceGamepad2 size={40} color="#ffffff" />
                <Title 
                  order={1}
                  style={{ 
                    color: '#ffffff', 
                    textShadow: '2px 2px 10px rgba(0, 0, 0, 0.8)',
                    fontWeight: 'bold'
                  }}
                >
                  게임 로비
                </Title>
              </Group>
              <Text 
                size="lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: '1px 1px 6px rgba(0, 0, 0, 0.7)',
                  fontWeight: 500
                }}
              >
                안녕하세요, {currentUser?.nickname}님! 🎮
              </Text>
            </Stack>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <ActionIcon 
                size="lg" 
                variant="gradient" 
                gradient={{ from: 'cyan', to: 'violet' }}
                onClick={() => fetchRooms?.()}
                disabled={loading.rooms}
                radius="md"
              >
                <IconRefresh size={20} />
              </ActionIcon>
            </motion.div>
          </Group>
        </motion.div>

        {/* --- 플로팅 커맨드 센터 (Floating Command Center) --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '12px', // 패딩을 줄여 더 컴팩트하게
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '2rem',
            marginTop: '1rem'
          }}
        >
          <Group justify="center" gap="md">
            <MotionMenuButton size="medium" onClick={() => setCreateRoomOpen?.(true)} icon={IconPlus} gradient={{ from: 'orange', to: 'red' }}>
              방 만들기
            </MotionMenuButton>
            <MotionMenuButton size="medium" onClick={() => setAddContentOpen(true)} icon={IconBook} gradient={{ from: 'teal', to: 'lime', deg: 105 }}>
              콘텐츠 추가
            </MotionMenuButton>
            <MotionMenuButton size="medium" onClick={() => setHelpDialogOpen?.(true)} icon={IconHelp} gradient={{ from: 'blue', to: 'cyan' }}>
              도움말
            </MotionMenuButton>
            <MotionMenuButton size="medium" onClick={() => setLogoutDialogOpen?.(true)} icon={IconLogout} gradient={{ from: 'grape', to: 'pink' }}>
              로그아웃
            </MotionMenuButton>
          </Group>
        </motion.div>

        {/* Room Grid */}
        <AnimatePresence>
          {loading.rooms ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '4rem' }}
            >
              <Loader size="xl" variant="bars" color="white" />
              <Text mt="md" c="white">방 목록을 불러오는 중...</Text>
            </motion.div>
          ) : (
            <MotionGrid
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {roomList?.length === 0 ? (
                <Grid.Col span={12}>
                  <Text ta="center" c="white" size="xl" mt="xl">
                    현재 생성된 방이 없습니다. 새로운 방을 만들어보세요! 🚀
                  </Text>
                </Grid.Col>
              ) : (
                roomList?.map((room, index) => (
                  <Grid.Col key={room.gameNumber} span={{ base: 12, sm: 6, md: 4 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <GameRoomCard room={room} onJoin={handleJoinRoom} />
                    </motion.div>
                  </Grid.Col>
                ))
              )}
            </MotionGrid>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error.rooms && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert color="red" mt="md">
              {error.rooms}
            </Alert>
          </motion.div>
        )}
      </MotionContainer>

      {/* Dialog Components */}
      <GameRulesDialog 
        open={gameRulesDialogOpen} 
        onClose={() => setGameRulesDialogOpen(false)} 
      />
      
      <HelpDialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)} 
      />
      
      <LogoutDialog 
        open={logoutDialogOpen} 
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={logout}
        currentUser={currentUser}
      />
      
      <CreateRoomDialog 
        open={createRoomOpen} 
        onClose={handleCreateRoomClose}
        subjects={subjects}
        config={gameConfig}
        currentUser={currentUser}
        roomForm={roomForm}
        onFormChange={handleRoomFormChange}
        onSubmit={handleCreateRoomSubmit}
        isLoading={loading.room}
      />
      
      <JoinRoomDialog 
        open={joinRoomOpen} 
        onClose={handleJoinRoomClose}
        selectedRoom={selectedRoom}
        joinPassword={joinPassword}
        onPasswordChange={handlePasswordChange}
        onSubmit={handleJoinRoomSubmit}
        isLoading={loading.room}
      />
      
      <AddContentDialog 
        opened={addContentOpen} 
        onClose={() => setAddContentOpen(false)}
        subjects={subjects || []}
        addSubject={addSubject}
        addWord={addWord}
      />
    </Box>
  )
}

export default LobbyPageWithLoader