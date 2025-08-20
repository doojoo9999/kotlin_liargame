import apiClient from '@/shared/api/apiClient';

/**
 * Casts a vote for a player suspected of being the liar.
 * @param {object} voteData The vote data.
 * @param {number|string} voteData.gameNumber The ID of the game room.
 * @param {number|string} voteData.targetPlayerId The ID of the player being voted for.
 * @returns {Promise<any>} The server response.
 */
export const castVote = async (voteData) => {
  const response = await apiClient.post('/api/v1/game/cast-vote', voteData);
  return response.data;
};
