import apiClient from '@/shared/api/apiClient';

/**
 * Submits the accused player's defense.
 * @param {object} defenseData The defense data.
 * @param {number|string} defenseData.gameNumber The ID of the game room.
 * @param {string} defenseData.defenseText The text of the defense.
 * @returns {Promise<any>} The server response.
 */
export const submitDefense = async (defenseData) => {
  const response = await apiClient.post('/api/v1/game/submit-defense', defenseData);
  return response.data;
};
