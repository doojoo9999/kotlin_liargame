import apiClient from '@/shared/api/apiClient';

/**
 * Fetches the list of all available game rooms.
 * @returns {Promise<any>} The list of game rooms.
 */
export const getRooms = async () => {
  const response = await apiClient.get('/api/v1/game/rooms');
  return response.data;
};
