import apiClient from '@/shared/api/apiClient';

/**
 * Creates a new game room.
 * @param {object} roomData The data for the new room.
 * @param {string} roomData.roomName The name of the room.
 * @param {string|null} roomData.password The password for the room (optional).
 * @param {number} roomData.maxPlayers The maximum number of players.
 * @param {number} roomData.rounds The number of rounds.
 * @param {string} roomData.subject The game subject.
 * @returns {Promise<any>} The response from the server, likely containing the new room's ID.
 */
export const createRoom = async (roomData) => {
  // Based on GameController.kt, the endpoint is likely /game-rooms
  const response = await apiClient.post('/game-rooms', roomData);
  return response.data;
};
