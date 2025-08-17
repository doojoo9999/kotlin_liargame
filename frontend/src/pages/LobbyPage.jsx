// --- ARCHITECTURE FIX: Force overwrite on 2024-05-21 to resolve persistent import errors ---
import React, {lazy, Suspense, useEffect} from 'react';
import {Alert, Box, Container} from '@mantine/core';
import {useGame} from '../context/GameContext';
import useSubjectStore from '../stores/subjectStore';
import config from '../config/environment';

// Correctly imported components
import LobbyHeader from '../components/lobby/LobbyHeader';
import RoomListTable from '../components/lobby/RoomListTable';
import HelpDialog from '../components/lobby/dialogs/HelpDialog';
import GameRulesDialog from '../components/lobby/dialogs/GameRulesDialog';
import CreateRoomDialog from '../components/lobby/dialogs/CreateRoomDialog';
import JoinRoomDialog from '../components/lobby/dialogs/JoinRoomDialog';
import LogoutDialog from '../components/lobby/dialogs/LogoutDialog';
import AddContentDialog from '../components/lobby/dialogs/AddContentDialog';

// Correctly imported custom hooks
import {useLobbyDialogs} from '../hooks/useLobbyDialogs';
import {useRoomForm} from '../hooks/useRoomForm';
import {useContentForm} from '../hooks/useContentForm';
import {useContentActions} from '../hooks/useContentActions';

// Lazy load heavy visual components
const AnimatedBackground = lazy(() => import('../components/AnimatedBackground').then(module => ({ default: module.AnimatedBackground })));
const FloatingGamepadIcons = lazy(() => import('../components/FloatingGamepadIcons').then(module => ({ default: module.FloatingGamepadIcons })));

function LobbyPage() {
  const {
    roomList,
    currentUser,
    loading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    logout,
    navigateToRoom
  } = useGame();

  const {
    subjects,
    loading: subjectLoading,
    fetchSubjects,
    addSubject,
    addWord
  } = useSubjectStore();

  useEffect(() => {
    fetchRooms();
    fetchSubjects();
  }, [fetchRooms, fetchSubjects]);

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
  } = useLobbyDialogs();

  const { roomForm, joinPassword, handleRoomFormChange, setJoinPassword, setDefaultTitle } = useRoomForm({ subjects, currentUser });
  const { contentForm, handleContentFormChange } = useContentForm();
  const { handleAddSubject, handleAddWord } = useContentActions({ addSubject, addWord, subjects });

  const handleCreateRoom = async () => {
    try {
      const roomToCreate = { ...roomForm, title: roomForm.title || `${currentUser?.nickname || '플레이어'}의 방` };
      const newRoom = await createRoom(roomToCreate);
      closeCreateRoomDialog();
      //showSnackbar('방이 성공적으로 생성되었습니다.', 'success');
      if (newRoom && newRoom.id) {
        navigateToRoom(newRoom.id);
      }
    } catch (e) {
      console.error("Failed to create room", e);
      //showSnackbar(e.message || '방 생성에 실패했습니다.', 'error');
    }
  };

  const handleJoinRoom = async (roomToJoin) => {
    try {
      if (roomToJoin.hasPassword) {
        openJoinRoomDialog(roomToJoin);
      } else {
        await joinRoom(roomToJoin.id);
      }
    } catch (e) {
      console.error("Failed to join room", e);
      //showSnackbar(e.message || '방 입장에 실패했습니다.', 'error');
    }
  };

  const handleJoinRoomWithPassword = async () => {
    try {
      await joinRoom(selectedRoom.id, joinPassword);
      closeJoinRoomDialog();
    } catch (e) {
      console.error("Failed to join room with password", e);
      showSnackbar(e.message || '방 입장에 실패했습니다.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    closeLogoutDialog();
  };

  const handleOpenCreateRoom = () => {
    setDefaultTitle();
    openCreateRoomDialog();
  };

  return (
    <Box style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '2rem' }}>
      <Suspense fallback={null}>
        <AnimatedBackground />
        <FloatingGamepadIcons />
      </Suspense>
      
      <Container size="lg" style={{ py: 4, zIndex: 10, width: '100%' }}>
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

        {error.rooms && <Alert title="Error" color="red" style={{ marginBottom: '1.5rem' }}>{error.rooms}</Alert>}

        <RoomListTable
          roomList={roomList}
          loading={loading.rooms}
          error={error.rooms}
          onJoinRoom={handleJoinRoom}
          onRefreshRooms={fetchRooms}
        />

        {createRoomOpen && <CreateRoomDialog open={createRoomOpen} onClose={closeCreateRoomDialog} subjects={subjects} config={config} currentUser={currentUser} roomForm={roomForm} onFormChange={handleRoomFormChange} onSubmit={handleCreateRoom} isLoading={loading.room} />}
        {joinRoomOpen && <JoinRoomDialog open={joinRoomOpen} onClose={closeJoinRoomDialog} selectedRoom={selectedRoom} joinPassword={joinPassword} onPasswordChange={setJoinPassword} onSubmit={handleJoinRoomWithPassword} isLoading={loading.room} />}
        <LogoutDialog
          open={logoutDialogOpen}
          onClose={closeLogoutDialog}
          onConfirm={handleLogout}
          currentUser={currentUser}
        />
        {addContentOpen && <AddContentDialog opened={addContentOpen} onClose={closeAddContentDialog} subjects={subjects} addSubject={handleAddSubject} addWord={handleAddWord} loading={subjectLoading} />}
        {helpDialogOpen && <HelpDialog open={helpDialogOpen} onClose={closeHelpDialog} />}
        {gameRulesDialogOpen && <GameRulesDialog open={gameRulesDialogOpen} onClose={closeGameRulesDialog} />}
        <SnackbarNotification open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={hideSnackbar} />
      </Container>
    </Box>
  );
}

export default LobbyPage;