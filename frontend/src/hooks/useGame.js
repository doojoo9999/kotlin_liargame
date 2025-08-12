import {useAuthStore} from '../stores/authStore';
import {useRoomStore} from '../stores/roomStore';
import {useGameStore} from '../stores/gameStore';
import {useSocketStore} from '../stores/socketStore';
import {useMutation, useQueryClient} from '@tanstack/react-query';

// Mutations (importing from the actual mutation files)
import {login, logout} from '../api/mutations/authMutations';
import {createRoom, joinRoom, leaveRoom, startGame} from '../api/mutations/roomMutations';
import {addSubject, addWord} from '../api/mutations/contentMutations';
import {castSurvivalVote, castVote, guessWord, submitDefense, submitHint,} from '../api/mutations/gameMutations';

/**
 * A comprehensive hook that integrates all stores and business logic for the Liar Game.
 * It provides a single, unified interface for components to interact with the application state.
 */
export const useGame = () => {
  const queryClient = useQueryClient();

  // Get states and actions from all stores
  const auth = useAuthStore();
  const room = useRoomStore();
  const game = useGameStore();
  const socket = useSocketStore();

  // --- AUTH MUTATIONS ---
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      auth.login({ userId: data.userId, nickname: data.nickname });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      auth.logout();
      socket.disconnect();
      queryClient.clear();
    },
    onError: () => {
      // Force logout on client even if API fails
      auth.logout();
      socket.disconnect();
      queryClient.clear();
    },
  });

  // --- ROOM MUTATIONS ---
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (newRoomData) => {
      room.setCurrentRoom(newRoomData);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: (variables) => joinRoom(variables.gameNumber, variables.password),
    onSuccess: (joinedRoomData) => {
      room.setCurrentRoom(joinedRoomData);
    },
  });

  const leaveRoomMutation = useMutation({
    mutationFn: (gameNumber) => leaveRoom(gameNumber),
    onSuccess: () => {
      room.leaveRoom();
      game.resetGameState();
      socket.disconnect();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  // --- GAME ACTION MUTATIONS ---
  const startGameMutation = useMutation({
    mutationFn: (gameNumber) => startGame(gameNumber),
    // Success is handled by WebSocket updates
  });

  const submitHintMutation = useMutation({
    mutationFn: (variables) => submitHint(variables.gameNumber, variables.hint),
  });

  const castVoteMutation = useMutation({
    mutationFn: (variables) => castVote(variables.gameNumber, variables.targetPlayerId),
  });

  const submitDefenseMutation = useMutation({
    mutationFn: (variables) => submitDefense(variables.gameNumber, variables.defenseText),
  });

  const castSurvivalVoteMutation = useMutation({
    mutationFn: (variables) => castSurvivalVote(variables.gameNumber, variables.survival),
  });

  const guessWordMutation = useMutation({
    mutationFn: (variables) => guessWord(variables.gameNumber, variables.guessedWord),
  });

  // --- CONTENT MUTATIONS ---
  const addSubjectMutation = useMutation({
    mutationFn: addSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });

  const addWordMutation = useMutation({
    mutationFn: (variables) => addWord(variables.subject, variables.word),
  });

  // --- WEBSOCKET ACTIONS ---
  const sendChatMessage = (message) => {
    if (room.currentRoom?.gameNumber && message.trim()) {
      socket.publish('/app/chat.send', {
        gameNumber: room.currentRoom.gameNumber,
        content: message.trim(),
      });
    }
  };

  // Combine all states and actions into a single object
  return {
    // States
    ...auth,
    ...room,
    ...game,
    isSocketConnected: socket.isConnected,

    // Actions & Mutations
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    createRoom: createRoomMutation.mutate,
    isCreatingRoom: createRoomMutation.isPending,
    createRoomError: createRoomMutation.error,

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

    // WebSocket-related actions
    connectSocket: socket.connect,
    disconnectSocket: socket.disconnect,
    subscribe: socket.subscribe,
    sendChatMessage,
  };
};
