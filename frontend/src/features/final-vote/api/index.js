import apiClient from '@/shared/api/apiClient';

/**
 * Casts a final judgment vote (execute or let live).
 * @param {object} voteData The final vote data.
 * @param {number|string} voteData.gameNumber The ID of the game room.
 * @param {boolean} voteData.voteForExecution True to execute, false to let live.
 * @returns {Promise<any>} The server response.
 */
export const castFinalVote = async (voteData) => {
  const response = await apiClient.post('/api/v1/game/cast-final-judgment', voteData);
  return response.data;
};
