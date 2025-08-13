import apiClient from '../apiClient';

/**
 * @file API mutations for room management.
 * All functions are updated to match backend payload specifications.
 * Note: apiClient returns response.data via interceptor, so we return it directly.
 */

/**
 * Creates a new game room.
 * @param {object} roomData - The room configuration.
 * @param {string} roomData.gameName - The name of the room.
 * @param {number} roomData.gameParticipants - The maximum number of players.
 * @param {number} roomData.gameTotalRounds - The total number of rounds.
 * @param {string|null} roomData.gamePassword - The room's password (optional).
 * @param {number[]} roomData.subjectIds - The list of subject IDs for the game.
 * @returns {Promise<object>} The created room data.
 */
export const createRoom = async (roomData) => {
  const response = await apiClient.post('/game/create', roomData);
  return response;
};

/**
 * Joins an existing game room.
 * @param {string} gameNumber - The number of the game room to join.
 * @param {string} password - The password for the room (optional).
 * @returns {Promise<object>} The joined room data.
 */
export const joinRoom = async (gameNumber, password = '') => {
  const response = await apiClient.post('/game/join', { gameNumber, password });
  return response;
};

/**
 * Leaves the current game room.
 * @param {string} gameNumber - The number of the game room to leave.
 * @returns {Promise<any>} The result of the leave operation.
 */
export const leaveRoom = async (gameNumber) => {
  const response = await apiClient.post('/game/leave', { gameNumber: parseInt(gameNumber) });
  return response;
};

/**
 * Starts the game in the current room.
 * @param {string} gameNumber - The number of the game room to start.
 * @returns {Promise<any>} The result of the start operation.
 */
export const startGame = async (gameNumber) => {
  const response = await apiClient.post('/game/start', { gameNumber });
  return response.data;
};
