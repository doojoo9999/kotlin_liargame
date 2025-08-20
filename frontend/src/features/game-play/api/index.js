import apiClient from '@/shared/api/apiClient';

/**
 * Fetches the current state of a game room.
 * @param {number|string} gameNumber The ID of the game room.
 * @returns {Promise<any>} The current game state.
 */
export const getGameState = async (gameNumber) => {
  const response = await apiClient.get(`/api/v1/game/${gameNumber}`);
  return response.data;
};
