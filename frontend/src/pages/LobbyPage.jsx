import React from 'react'
import {Alert, Container} from '../components/ui'
import {useGame} from '../context/GameContext'
import useSubjectStore from '../stores/subjectStore'
import {useSubjectsQuery} from '../hooks/useSubjectsQuery'
import config from '../config/environment'
import {useCreateRoom, useJoinRoom} from '../mutations/roomMutations'

// Import separated components
import LobbyHeader from '../components/lobby/LobbyHeader'
import RoomListTable from '../components/lobby/RoomListTable'
import HelpDialog from '../components/lobby/dialogs/HelpDialog'
import GameRulesDialog from '../components/lobby/dialogs/GameRulesDialog'
import CreateRoomDialog from '../components/lobby/dialogs/CreateRoomDialog'
import JoinRoomDialog from '../components/lobby/dialogs/JoinRoomDialog'
import SnackbarNotification from '../components/lobby/SnackbarNotification'

// Import custom hooks
import {useSnackbar} from '../hooks/useSnackbar'
import {useLobbyDialogs} from '../hooks/useLobbyDialogs'
import {useRoomForm} from '../hooks/useRoomForm'
import {useContentForm} from '../hooks/useContentForm'
import {useRoomActions} from '../hooks/useRoomActions'
import {useContentActions} from '../hooks/useContentActions'

// Import utility functions

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

  // Mutation hooks
  const createRoomMutation = useCreateRoom()
  const joinRoomMutation = useJoinRoom()

  // Use React Query for subjects data - modern server state management
  const {
    data: subjects = [],
    isLoading: subjectLoading,
    error: subjectError,
    refetch: refetchSubjects
  } = useSubjectsQuery()
  
  // Keep store for mutations (addSubject, addWord) until Sprint 4
  const { addSubject, addWord } = useSubjectStore()


  // Custom hooks for state management
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar()
  const {
    createRoomOpen,
    joinRoomOpen,
    selectedRoom,
    logoutDialogOpen,
    addContentOpen,
    helpDialogOpen,
    gameRulesDialogOpen,
    openCreateRoomDialog,
    closeCreateRoomDialog,
    openJoinRoomDialog,
    closeJoinRoomDialog,
    openLogoutDialog,
    closeLogoutDialog,
    openAddContentDialog,
    closeAddContentDialog,
    openHelpDialog,
    closeHelpDialog,
    openGameRulesDialog,
    closeGameRulesDialog
  } = useLobbyDialogs()

  const {
    roomForm,
    joinPassword,
    handleRoomFormChange,
    setJoinPassword,
    resetRoomForm,
    setDefaultTitle,
    getRoomData,
    resetJoinPassword
  } = useRoomForm({ subjects, currentUser })

  const {
    contentForm,
    handleContentFormChange,
    resetNewSubject,
    resetNewWord,
    isSubjectValid,
    isWordValid
  } = useContentForm()

  // Business logic hooks
  const { handleCreateRoom, handleJoinRoom, handleLogout, handleOpenCreateRoom } = useRoomActions({
    createRoomMutation,
    joinRoomMutation,
    logout,
    fetchRooms,
    showSnackbar,
    closeCreateRoomDialog,
    closeJoinRoomDialog,
    closeLogoutDialog,
    currentUser
  })

  const { handleAddSubject, handleAddWord } = useContentActions({
    addSubject,
    addWord,
    showSnackbar,
    subjects
  })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <LobbyHeader
        currentUser={currentUser}
        loading={loading}
        onRefreshRooms={fetchRooms}
        onCreateRoom={handleOpenCreateRoom}
        onAddContent={openAddContentDialog}
        onOpenHelp={openHelpDialog}
        onOpenGameRules={openGameRulesDialog}
        onLogout={openLogoutDialog}
      />

      {/* Error Alert */}
      {error.rooms && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.rooms}
        </Alert>
      )}

      {/* Room List */}
      <RoomListTable
        roomList={roomList}
        loading={loading}
        error={error}
        onJoinRoom={openJoinRoomDialog}
        onRefreshRooms={fetchRooms}
      />

      {/* Create Room Dialog */}
      {createRoomOpen && (
        <CreateRoomDialog
          open={createRoomOpen}
          onClose={closeCreateRoomDialog}
          subjects={subjects}
          config={config}
          currentUser={currentUser}
          roomForm={roomForm}
          onFormChange={handleRoomFormChange}
          onSubmit={handleCreateRoom}
          isLoading={createRoomMutation.isPending}
        />
      )}

      {/* Join Room Dialog */}
      {joinRoomOpen && (
        <JoinRoomDialog
          open={joinRoomOpen}
          onClose={closeJoinRoomDialog}
          selectedRoom={selectedRoom}
          joinPassword={joinPassword}
          onPasswordChange={setJoinPassword}
          onSubmit={handleJoinRoom}
          isLoading={joinRoomMutation.isPending}
        />
      )}

      {/* Logout Confirmation Dialog */}
      {logoutDialogOpen && (
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
      )}

      {/* Add Content Dialog */}
      {addContentOpen && (
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
      )}

      {/* Help Dialog */}
      {helpDialogOpen && (
        <HelpDialog
          open={helpDialogOpen}
          onClose={() => setHelpDialogOpen(false)}
        />
      )}

      {/* Game Rules Dialog */}
      {gameRulesDialogOpen && (
        <GameRulesDialog
          open={gameRulesDialogOpen}
          onClose={() => setGameRulesDialogOpen(false)}
        />
      )}

      {/* Snackbar for notifications */}
      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  )
}

export default LobbyPage