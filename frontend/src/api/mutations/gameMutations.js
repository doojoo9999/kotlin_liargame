import apiClient from '../apiClient';

/**
 * @file API mutations for in-game actions.
 * All functions are updated to match backend payload specifications.
 */

/**
 * Submits a hint for the current turn.
 * @param {string} gameNumber - The ID of the game room.
 * @param {string} hint - The hint text.
 * @returns {Promise<any>}
 */
export const submitHint = (gameNumber, hint) => {
  return apiClient.post('/game/hint', { gameNumber, hint });
};

/**
 * Casts a vote for a player suspected of being the liar.
 * @param {string} gameNumber - The ID of the game room.
 * @param {string} targetPlayerId - The session ID of the player being voted for.
 * @returns {Promise<any>}
 */
export const castVote = (gameNumber, targetPlayerId) => {
  return apiClient.post('/game/vote', { gameNumber, targetPlayerId });
};

/**
 * Submits a defense statement when accused.
 * @param {string} gameNumber - The ID of the game room.
 * @param {string} defenseText - The defense statement.
 * @returns {Promise<any>}
 */
export const submitDefense = (gameNumber, defenseText) => {
  return apiClient.post('/game/submit-defense', { gameNumber, defenseText });
};

/**
 * Casts a final vote on whether the accused player should survive.
 * @param {string} gameNumber - The ID of the game room.
 * @param {boolean} survival - True for spare, false for eliminate.
 * @returns {Promise<any>}
 */
export const castSurvivalVote = (gameNumber, survival) => {
  return apiClient.post('/game/survival-vote', { gameNumber, survival });
};

/**
 * Submits a final guess for the secret word if the player is the liar.
 * @param {string} gameNumber - The ID of the game room.
 * @param {string} guessedWord - The word being guessed.
 * @returns {Promise<any>}
 */
export const guessWord = (gameNumber, guessedWord) => {
  return apiClient.post('/game/guess-word', { gameNumber, guessedWord });
};
