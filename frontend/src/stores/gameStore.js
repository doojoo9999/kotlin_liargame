import {create} from 'zustand';

export const useGameStore = create((set, get) => ({
  // Game state
  gameStatus: 'WAITING', // WAITING, SPEAKING, VOTING, DEFENSE, FINISHED, etc.
  currentRound: 0,
  gameTimer: 0,
  moderatorMessage: null,
  gameResults: null, // { winner: 'LIAR' | 'CITIZEN', message: string }

  // Player state
  roomPlayers: [],
  currentTurnPlayerId: null,
  accusedPlayerId: null,

  // Current user-specific state
  playerRole: null, // LIAR, CITIZEN
  assignedWord: null,
  myVote: null,

  // Chat state
  chatMessages: [],

  // Actions
  setGameStatus: (status) => set({ gameStatus: status }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setGameTimer: (timer) => set({ gameTimer: timer }),
  setModeratorMessage: (message) => set({ moderatorMessage: message }),
  setGameResults: (results) => set({ gameResults: results }),

  setRoomPlayers: (players) => set({ roomPlayers: players }),
  setCurrentTurnPlayerId: (playerId) => set({ currentTurnPlayerId: playerId }),
  setAccusedPlayerId: (playerId) => set({ accusedPlayerId: playerId }),

  setPlayerRole: (role) => set({ playerRole: role }),
  setAssignedWord: (word) => set({ assignedWord: word }),
  setMyVote: (vote) => set({ myVote: vote }),

  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  // Reset state when leaving a room or game ends
  resetGameState: () =>
    set({
      gameStatus: 'WAITING',
      currentRound: 0,
      gameTimer: 0,
      moderatorMessage: null,
      gameResults: null,
      roomPlayers: [],
      currentTurnPlayerId: null,
      accusedPlayerId: null,
      playerRole: null,
      assignedWord: null,
      myVote: null,
      chatMessages: [],
    }),
}));
