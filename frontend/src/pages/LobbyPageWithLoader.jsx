import React, {useEffect, useRef, useState} from 'react'
import {useLoaderData} from 'react-router-dom'
import {ActionIcon, Alert, Box, Button, Container, Grid, Group, Loader, Stack, Text, Title} from '@mantine/core'
import {IconDeviceGamepad2, IconHelp, IconLogout, IconPlus, IconRefresh} from '@tabler/icons-react'
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

const MotionContainer = motion.create(Container)
const MotionGrid = motion.create(Grid)

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <MotionContainer size="xl" py="xl">
        {/* Show loader errors if any */}
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
          <Group justify="space-between" mb="xl">
            <Stack gap="xs">
              <Group gap="sm">
                <IconDeviceGamepad2 size={32} color="#ffffff" />
                <Title 
                  order={1} 
                  style={{ 
                    color: '#ffffff', 
                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)',
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
                  textShadow: '1px 1px 4px rgba(0, 0, 0, 0.6)',
                  fontWeight: 500
                }}
              >
                안녕하세요, {currentUser?.nickname}님! 🎮
              </Text>
            </Stack>

            <Group gap="sm">
              <ActionIcon 
                size="lg" 
                variant="gradient" 
                gradient={{ from: 'cyan', to: 'violet' }}
                onClick={() => {
                  try {
                    console.log('[DEBUG_LOG] Refresh button clicked')
                    fetchRooms?.()
                  } catch (error) {
                    console.error('[ERROR] Refresh button click failed:', error)
                  }
                }}
                disabled={loading.rooms}
              >
                <IconRefresh size={18} />
              </ActionIcon>
              
              <Button 
                leftSection={<IconPlus size={16} />}
                variant="gradient" 
                gradient={{ from: 'orange', to: 'red' }}
                size="md"
                onClick={() => {
                  try {
                    console.log('[DEBUG_LOG] Create room button clicked')
                    setCreateRoomOpen?.(true)
                  } catch (error) {
                    console.error('[ERROR] Create room button click failed:', error)
                  }
                }}
              >
                방 만들기
              </Button>

              <Button
                variant="outline"
                color="gray"
                size="md"
                leftSection={<IconHelp size={16} />}
                onClick={() => {
                  try {
                    console.log('[DEBUG_LOG] Help button clicked')
                    setHelpDialogOpen?.(true)
                  } catch (error) {
                    console.error('[ERROR] Help button click failed:', error)
                  }
                }}
              >
                도움말
              </Button>

              <Button
                variant="gradient"
                gradient={{ from: 'cyan', to: 'teal' }}
                size="md"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  try {
                    console.log('[DEBUG_LOG] Add content button clicked')
                    setAddContentOpen(true)
                  } catch (error) {
                    console.error('[ERROR] Add content button click failed:', error)
                  }
                }}
              >
                콘텐츠 추가
              </Button>

              <Button
                variant="outline"
                color="gray"
                size="md"
                leftSection={<IconLogout size={16} />}
                onClick={() => {
                  try {
                    console.log('[DEBUG_LOG] Logout button clicked')
                    setLogoutDialogOpen?.(true)
                  } catch (error) {
                    console.error('[ERROR] Logout button click failed:', error)
                  }
                }}
              >
                로그아웃
              </Button>
            </Group>
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
              <Loader size="xl" variant="bars" />
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