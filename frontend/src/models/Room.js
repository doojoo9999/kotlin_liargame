/**
 * @typedef {object} Room
 * @property {number} gameNumber - The unique identifier for the room.
 * @property {string} title - The title of the room.
 * @property {string} host - The nickname of the host player.
 * @property {number} currentPlayers - The current number of players in the room.
 * @property {number} maxPlayers - The maximum number of players allowed.
 * @property {boolean} hasPassword - Indicates if the room is password-protected.
 * @property {'WAITING' | 'IN_PROGRESS' | 'FINISHED'} state - The current state of the room.
 * @property {Player[]} players - The list of players in the room.
 */

// This file is for JSDoc type definitions only and does not export anything.
export {};
