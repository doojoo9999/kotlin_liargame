import apiClient from '@/shared/api/apiClient';

/**
 * Starts the game.
 * @param {number|string} gameNumber The ID of the game room.
 * @returns {Promise<any>} The updated game state after starting.
 */
export const startGame = async (gameNumber) => {
  const response = await apiClient.post('/api/v1/game/start', { gameNumber });
  return response.data;
};
