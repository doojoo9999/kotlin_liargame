/**
 * @file This file contains functions to normalize data structures from the API
 * into a consistent format used throughout the frontend application, based on the JSDoc models.
 */

/**
 * Normalizes a player object to the standard Player model.
 * @param {object} rawPlayer - The raw player data from an API response or WebSocket message.
 * @returns {Player}
 */
export const normalizePlayerData = (rawPlayer) => {
  if (!rawPlayer) return null;
  return {
    id: rawPlayer.id,
    nickname: rawPlayer.nickname,
    isHost: rawPlayer.isHost ?? false,
    isAlive: rawPlayer.isAlive ?? true,
    avatarUrl: rawPlayer.avatarUrl || null,
  };
};

/**
 * Normalizes a room object to the standard Room model.
 * This handles inconsistencies like `playerCount` vs. `currentPlayers`.
 * @param {object} rawRoom - The raw room data from an API response or WebSocket message.
 * @returns {Room}
 */
export const normalizeRoomData = (rawRoom) => {
  if (!rawRoom) return null;
  return {
    gameNumber: rawRoom.gameNumber,
    title: rawRoom.title,
    host: rawRoom.host,
    // Handle different keys for player counts and default to 0.
    currentPlayers: rawRoom.currentPlayers ?? rawRoom.playerCount ?? 0,
    maxPlayers: rawRoom.maxPlayers ?? rawRoom.gameParticipants ?? 0,
    hasPassword: rawRoom.hasPassword ?? false,
    state: rawRoom.state || 'WAITING',
    players: Array.isArray(rawRoom.players) ? rawRoom.players.map(normalizePlayerData) : [],
  };
};
