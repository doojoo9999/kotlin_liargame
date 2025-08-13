import {create} from 'zustand';
import {normalizePlayerData} from '../utils/normalizers';

/**
 * @typedef {import('../models/Player').Player} Player
 */

/**
 * Zustand store for managing the state of an active game session.
 */
export const useGameStore = create((set) => ({
  // Game state
  gameStatus: 'WAITING',
  currentRound: 0,
  gameTimer: 0,
  moderatorMessage: null,
  gameResults: null,

  // Player state
  /** @type {Player[]} */
  roomPlayers: [],
  currentTurnPlayerId: null,
  accusedPlayerId: null,

  // Current user-specific state
  playerRole: null,
  assignedWord: null,
  myVote: null,

  // Chat state
  chatMessages: [],

  /**
   * A comprehensive action to update the entire game state at once.
   * Ensures partial updates don't wipe existing state.
   * @param {object} newGameState - The new game state data.
   */
  setGameState: (newGameState) =>
    set((state) => ({
      ...state,
      ...newGameState,
      // Ensure nested player data is also normalized if present
      ...(newGameState.roomPlayers && {
        roomPlayers: newGameState.roomPlayers.map(normalizePlayerData),
      }),
    })),

  /**
   * Adds a new chat message to the list.
   * @param {object} message - The chat message object.
   */
  addChatMessage: (message) =>
    set((state) => ({
      ...state,
      chatMessages: [...state.chatMessages, message],
    })),

  /**
   * Resets the game state to its initial values.
   */
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
