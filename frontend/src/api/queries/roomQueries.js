import apiClient from '../apiClient';

/**
 * Fetches a list of all available game rooms.
 * The response data from the server is expected to be { "gameRooms": [...] }.
 * This function extracts the nested array and ensures a fallback to an empty array.
 * @returns {Promise<Array<object>>} A promise that resolves to a list of rooms.
 */
export const getAllRooms = async () => {
  // apiClient is configured to return response.data directly.
  const data = await apiClient.get('/game/rooms');
  return data.gameRooms || [];
};

/**
 * Fetches the detailed information for a single game room.
 * @param {string} gameNumber - The ID of the room to fetch.
 * @returns {Promise<object>} A promise that resolves to the room details.
 */
export const getRoomDetails = async (gameNumber) => {
  const response = await apiClient.get(`/game/${gameNumber}`);
  return response; // The interceptor already returns response.data
};
