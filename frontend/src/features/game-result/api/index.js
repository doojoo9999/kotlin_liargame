import apiClient from '@/shared/api/apiClient';

/**
 * Fetches the result of a finished game.
 * @param {number|string} gameNumber The ID of the game room.
 * @returns {Promise<any>} The game result data.
 */
export const getGameResult = async (gameNumber) => {
  const response = await apiClient.get(`/api/v1/game/result/${gameNumber}`);
  return response.data;
};
