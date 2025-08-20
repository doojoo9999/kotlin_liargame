import apiClient from '@/shared/api/apiClient';

/**
 * Joins a game room.
 * @param {object} joinData The data required to join.
 * @param {number|string} joinData.gameNumber The ID of the room to join.
 * @param {string|null} joinData.password The password for the room (optional).
 * @returns {Promise<any>} The response from the server.
 */
export const joinRoom = async (joinData) => {
  const response = await apiClient.post('/api/v1/game/join', joinData);
  return response.data;
};
