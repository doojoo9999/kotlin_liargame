import {create} from 'zustand';

const initialState = {
    gameStatus: 'WAITING',
    currentRound: 0,
    playerRole: null,
    assignedWord: null,
    gameTimer: 0,
    votingResults: null,
    gameResults: null,
    accusedPlayerId: null,
    defendingPlayerId: null,
    chatMessages: [],
    roomPlayers: [],
    currentTurnPlayerId: null,
    moderatorMessage: null,
};

const useGameStore = create((set, get) => ({
    ...initialState,

    // Action to update the entire game state from a socket message
    setGameState: (gameState) => {
        set({
            gameStatus: gameState.gameStatus,
            currentRound: gameState.currentRound,
            roomPlayers: gameState.players,
            currentTurnPlayerId: gameState.currentTurnPlayerId,
            accusedPlayerId: gameState.accusedPlayerId,
            // other state updates from the gameState object can be added here
        });
    },

    // Action to add a new chat message
    addChatMessage: (message) => {
        set(state => ({ chatMessages: [...state.chatMessages, message] }));
    },

    // Action to set a moderator message and clear it after a delay
    setModeratorMessage: (message) => {
        set({ moderatorMessage: message });
        setTimeout(() => {
            set({ moderatorMessage: null });
        }, 4000);
    },

    // Action to reset the game state for a new game or when leaving a room
    resetGameState: () => {
        set(initialState);
    },
}));

export default useGameStore;
