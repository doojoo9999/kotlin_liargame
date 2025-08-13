import {useAuthStore} from '../stores/authStore';
import {useRoomStore} from '../stores/roomStore';
import {useGameStore} from '../stores/gameStore';
import {useSocketStore} from '../stores/socketStore';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {notifications} from '@mantine/notifications';

// Mutations
import {login, logout} from '../api/mutations/authMutations';
import {createRoom, joinRoom, leaveRoom, startGame} from '../api/mutations/roomMutations';
import {addSubject, addWord} from '../api/mutations/contentMutations';
import {castSurvivalVote, castVote, guessWord, submitDefense, submitHint,} from '../api/mutations/gameMutations';

export const useGame = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const auth = useAuthStore();
  const room = useRoomStore();
  const game = useGameStore();
  const socket = useSocketStore();

  // --- AUTH MUTATIONS ---
  const loginMutation = useMutation({ mutationFn: login, onSuccess: (data) => {
    auth.login({ userId: data.userId, nickname: data.nickname });
    navigate('/lobby');
  }});

  const logoutMutation = useMutation({ 
    mutationFn: logout, 
    onSuccess: () => {
      auth.logout();
      socket.disconnect();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      auth.logout();
      socket.disconnect();
      queryClient.clear();
      navigate('/login');
    }
  });

  // --- ROOM & GAME MUTATIONS ---
  const createRoomMutation = useMutation({ 
    mutationFn: createRoom, 
    onSuccess: (newRoomData) => {
      room.setCurrentRoom(newRoomData);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate(`/room/${newRoomData.gameNumber}`);
    },
    onError: (error) => {
      notifications.show({ title: '방 만들기 실패', message: error.response?.data?.message || '알 수 없는 오류가 발생했습니다.', color: 'red' });
    }
  });

  const joinRoomMutation = useMutation({ 
    mutationFn: (variables) => joinRoom(variables.gameNumber, variables.password),
    onSuccess: (joinedRoomData) => {
      room.setCurrentRoom(joinedRoomData);
      navigate(`/room/${joinedRoomData.gameNumber}`);
    },
    onError: (error) => {
      notifications.show({ title: '방 입장 실패', message: error.response?.data?.message || '알 수 없는 오류가 발생했습니다.', color: 'red' });
    }
  });

  const leaveRoomMutation = useMutation({
    mutationFn: (gameNumber) => leaveRoom(gameNumber),
    onSuccess: () => {
      notifications.show({ title: '방 퇴장', message: '성공적으로 방에서 나왔습니다.', color: 'blue' });
      socket.disconnect();
      room.leaveRoom();
      game.resetGameState();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/lobby');
    },
    onError: (error) => {
      notifications.show({ title: '오류', message: '방을 나가는 중 오류가 발생했습니다. 강제로 퇴장합니다.', color: 'red' });
      socket.disconnect();
      room.leaveRoom();
      game.resetGameState();
      navigate('/lobby');
    },
  });

  const startGameMutation = useMutation({ mutationFn: startGame });
  const submitHintMutation = useMutation({ mutationFn: (variables) => submitHint(variables.gameNumber, variables.hint) });
  const castVoteMutation = useMutation({ mutationFn: (variables) => castVote(variables.gameNumber, variables.targetPlayerId) });
  const submitDefenseMutation = useMutation({ mutationFn: (variables) => submitDefense(variables.gameNumber, variables.defenseText) });
  const castSurvivalVoteMutation = useMutation({ mutationFn: (variables) => castSurvivalVote(variables.gameNumber, variables.survival) });
  const guessWordMutation = useMutation({ mutationFn: (variables) => guessWord(variables.gameNumber, variables.guessedWord) });
  const addSubjectMutation = useMutation({ mutationFn: addSubject, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }) });
  const addWordMutation = useMutation({ mutationFn: (variables) => addWord(variables.subject, variables.word) });

  const sendChatMessage = (message) => {
    if (room.currentRoom?.gameNumber && message.trim()) {
      socket.publish('/app/chat.send', {
        gameNumber: room.currentRoom.gameNumber,
        content: message.trim(),
      });
    }
  };

  return {
    // States & Actions from stores
    ...auth,
    ...room,
    ...game,
    isSocketConnected: socket.isConnected,

    // Business Logic & Mutations
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    createRoom: createRoomMutation.mutate,
    isCreatingRoom: createRoomMutation.isPending,
    joinRoom: joinRoomMutation.mutate,
    isJoiningRoom: joinRoomMutation.isPending,
    joinRoomError: joinRoomMutation.error, 
    leaveRoom: leaveRoomMutation.mutate,
    isLeavingRoom: leaveRoomMutation.isPending,
    startGame: startGameMutation.mutate,
    isStartingGame: startGameMutation.isPending,
    submitHint: submitHintMutation.mutate,
    isSubmittingHint: submitHintMutation.isPending,
    castVote: castVoteMutation.mutate,
    isCastingVote: castVoteMutation.isPending,
    submitDefense: submitDefenseMutation.mutate,
    isSubmittingDefense: submitDefenseMutation.isPending,
    castSurvivalVote: castSurvivalVoteMutation.mutate,
    isCastingSurvivalVote: castSurvivalVoteMutation.isPending,
    guessWord: guessWordMutation.mutate,
    isGuessingWord: guessWordMutation.isPending,
    addSubject: addSubjectMutation.mutate,
    isAddingSubject: addSubjectMutation.isPending,
    addWord: addWordMutation.mutate,
    isAddingWord: addWordMutation.isPending,
    connectSocket: socket.connect,
    disconnectSocket: socket.disconnect,
    initializeSubscriptions: socket.initializeSubscriptions,
    sendChatMessage,
  };
};
