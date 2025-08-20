import apiClient from '@/shared/api/apiClient';

/**
 * Submits a hint for the current round.
 * @param {object} hintData The hint data.
 * @param {number|string} hintData.gameNumber The ID of the game room.
 * @param {string} hintData.hint The hint text.
 * @returns {Promise<any>} The updated game state.
 */
export const giveHint = async (hintData) => {
  const response = await apiClient.post('/api/v1/game/hint', hintData);
  return response.data;
};
