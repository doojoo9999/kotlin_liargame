/**
 * Player-related WebSocket event handlers
 * Handles player joins/leaves, status updates, and player state changes
 */

import {normalizePlayerData, normalizePlayersList} from '../dataTransformers.js';

/**
 * Creates player event handlers with access to dispatch function
 * @param {Function} dispatch - Redux-style dispatch function for state updates
 * @returns {Object} Object containing player event handlers
 */
export const createPlayerEventHandlers = (dispatch) => {
  if (typeof dispatch !== 'function') {
    throw new Error('[playerEventHandlers] dispatch must be a function');
  }

  /**
   * Handles player joining a room
   * @param {Object} playerData - Player join data
   */
  const handlePlayerJoin = (playerData) => {
    try {
      console.log('[DEBUG_LOG] Player joined:', playerData);
      
      const normalizedPlayer = normalizePlayerData(playerData.player || playerData);
      if (!normalizedPlayer) {
        console.warn('[DEBUG_LOG] Failed to normalize player join data:', playerData);
        return;
      }

      // Add player to room players list
      dispatch({
        type: 'UPDATE_PLAYER_IN_ROOM',
        payload: normalizedPlayer
      });

      // If this is a complete players list update
      if (playerData.players && Array.isArray(playerData.players)) {
        const normalizedPlayers = normalizePlayersList(playerData.players);
        dispatch({
          type: 'SET_ROOM_PLAYERS',
          payload: normalizedPlayers
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player join:', error, playerData);
    }
  };

  /**
   * Handles player leaving a room
   * @param {Object} playerData - Player leave data
   */
  const handlePlayerLeave = (playerData) => {
    try {
      console.log('[DEBUG_LOG] Player left:', playerData);
      
      const playerId = playerData.playerId || playerData.player?.id || playerData.id;
      if (!playerId) {
        console.warn('[DEBUG_LOG] No player ID found in leave data:', playerData);
        return;
      }

      // Remove player from room players list by updating the list
      // This requires getting current players and filtering out the leaving player
      // We'll dispatch a special action for this
      dispatch({
        type: 'REMOVE_PLAYER_FROM_ROOM',
        payload: playerId
      });

      // If this includes updated players list
      if (playerData.players && Array.isArray(playerData.players)) {
        const normalizedPlayers = normalizePlayersList(playerData.players);
        dispatch({
          type: 'SET_ROOM_PLAYERS',
          payload: normalizedPlayers
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player leave:', error, playerData);
    }
  };

  /**
   * Handles player status updates (ready, alive, etc.)
   * @param {Object} updateData - Player status update data
   */
  const handlePlayerStatusUpdate = (updateData) => {
    try {
      console.log('[DEBUG_LOG] Player status update:', updateData);
      
      const normalizedPlayer = normalizePlayerData(updateData.player || updateData);
      if (!normalizedPlayer) {
        console.warn('[DEBUG_LOG] Failed to normalize player status update:', updateData);
        return;
      }

      // Update specific player in room
      dispatch({
        type: 'UPDATE_PLAYER_IN_ROOM',
        payload: normalizedPlayer
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player status update:', error, updateData);
    }
  };

  /**
   * Handles complete room players list update
   * @param {Object} playersData - Complete players list data
   */
  const handleRoomPlayersUpdate = (playersData) => {
    try {
      console.log('[DEBUG_LOG] Room players update:', playersData);
      
      let players = playersData.players || playersData;
      if (!Array.isArray(players)) {
        console.warn('[DEBUG_LOG] Players data is not an array:', players);
        return;
      }

      const normalizedPlayers = normalizePlayersList(players);
      dispatch({
        type: 'SET_ROOM_PLAYERS',
        payload: normalizedPlayers
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room players update:', error, playersData);
    }
  };

  /**
   * Handles player ready state changes
   * @param {Object} readyData - Player ready state data
   */
  const handlePlayerReady = (readyData) => {
    try {
      console.log('[DEBUG_LOG] Player ready state change:', readyData);
      
      const playerId = readyData.playerId || readyData.player?.id || readyData.id;
      const isReady = readyData.isReady !== undefined ? readyData.isReady : readyData.ready;
      
      if (!playerId) {
        console.warn('[DEBUG_LOG] No player ID found in ready data:', readyData);
        return;
      }

      // Update player ready status
      dispatch({
        type: 'UPDATE_PLAYER_IN_ROOM',
        payload: {
          id: playerId,
          isReady: isReady
        }
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player ready:', error, readyData);
    }
  };

  /**
   * Handles player role assignments
   * @param {Object} roleData - Player role assignment data
   */
  const handlePlayerRoleAssignment = (roleData) => {
    try {
      console.log('[DEBUG_LOG] Player role assignment:', roleData);
      
      // If this is for the current player
      if (roleData.isCurrentPlayer || roleData.playerId === roleData.currentPlayerId) {
        dispatch({
          type: 'SET_PLAYER_ROLE',
          payload: roleData.role
        });

        if (roleData.assignedWord) {
          dispatch({
            type: 'SET_ASSIGNED_WORD',
            payload: roleData.assignedWord
          });
        }
      }

      // Update player in room with role (if visible to current player)
      if (roleData.playerId && roleData.role && roleData.isVisible) {
        dispatch({
          type: 'UPDATE_PLAYER_IN_ROOM',
          payload: {
            id: roleData.playerId,
            role: roleData.role
          }
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player role assignment:', error, roleData);
    }
  };

  /**
   * Handles player vote updates
   * @param {Object} voteData - Player vote data
   */
  const handlePlayerVote = (voteData) => {
    try {
      console.log('[DEBUG_LOG] Player vote update:', voteData);
      
      const playerId = voteData.playerId || voteData.voterId;
      const votedFor = voteData.votedFor || voteData.targetId;
      
      if (playerId) {
        // Update player's vote in room
        dispatch({
          type: 'UPDATE_PLAYER_IN_ROOM',
          payload: {
            id: playerId,
            votedFor: votedFor
          }
        });
      }

      // If this is current player's vote
      if (voteData.isCurrentPlayer || voteData.isMyVote) {
        dispatch({
          type: 'SET_MY_VOTE',
          payload: votedFor
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player vote:', error, voteData);
    }
  };

  /**
   * Handles player survival vote updates
   * @param {Object} survivalVoteData - Player survival vote data
   */
  const handlePlayerSurvivalVote = (survivalVoteData) => {
    try {
      console.log('[DEBUG_LOG] Player survival vote update:', survivalVoteData);
      
      const playerId = survivalVoteData.playerId || survivalVoteData.voterId;
      const survivalVote = survivalVoteData.survivalVote || survivalVoteData.vote;
      
      if (playerId) {
        // Update player's survival vote
        dispatch({
          type: 'UPDATE_PLAYER_IN_ROOM',
          payload: {
            id: playerId,
            survivalVote: survivalVote
          }
        });
      }

      // If this is current player's survival vote
      if (survivalVoteData.isCurrentPlayer || survivalVoteData.isMyVote) {
        dispatch({
          type: 'SET_MY_SURVIVAL_VOTE',
          payload: survivalVote
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player survival vote:', error, survivalVoteData);
    }
  };

  /**
   * Handles player elimination/death
   * @param {Object} eliminationData - Player elimination data
   */
  const handlePlayerElimination = (eliminationData) => {
    try {
      console.log('[DEBUG_LOG] Player elimination:', eliminationData);
      
      const playerId = eliminationData.playerId || eliminationData.eliminatedPlayerId;
      
      if (playerId) {
        // Mark player as not alive
        dispatch({
          type: 'UPDATE_PLAYER_IN_ROOM',
          payload: {
            id: playerId,
            isAlive: false
          }
        });
      }

      // If complete players list is provided
      if (eliminationData.players && Array.isArray(eliminationData.players)) {
        const normalizedPlayers = normalizePlayersList(eliminationData.players);
        dispatch({
          type: 'SET_ROOM_PLAYERS',
          payload: normalizedPlayers
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player elimination:', error, eliminationData);
    }
  };

  /**
   * Handles player disconnection
   * @param {Object} disconnectionData - Player disconnection data
   */
  const handlePlayerDisconnection = (disconnectionData) => {
    try {
      console.log('[DEBUG_LOG] Player disconnection:', disconnectionData);
      
      const playerId = disconnectionData.playerId || disconnectionData.player?.id;
      
      if (playerId) {
        // Update player status to show disconnection
        dispatch({
          type: 'UPDATE_PLAYER_IN_ROOM',
          payload: {
            id: playerId,
            isConnected: false,
            disconnectedAt: Date.now()
          }
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player disconnection:', error, disconnectionData);
    }
  };

  /**
   * Handles player reconnection
   * @param {Object} reconnectionData - Player reconnection data
   */
  const handlePlayerReconnection = (reconnectionData) => {
    try {
      console.log('[DEBUG_LOG] Player reconnection:', reconnectionData);
      
      const normalizedPlayer = normalizePlayerData(reconnectionData.player || reconnectionData);
      if (normalizedPlayer) {
        // Update player with reconnection status
        dispatch({
          type: 'UPDATE_PLAYER_IN_ROOM',
          payload: {
            ...normalizedPlayer,
            isConnected: true,
            disconnectedAt: null
          }
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling player reconnection:', error, reconnectionData);
    }
  };

  // Return all player event handlers
  return {
    handlePlayerJoin,
    handlePlayerLeave,
    handlePlayerStatusUpdate,
    handleRoomPlayersUpdate,
    handlePlayerReady,
    handlePlayerRoleAssignment,
    handlePlayerVote,
    handlePlayerSurvivalVote,
    handlePlayerElimination,
    handlePlayerDisconnection,
    handlePlayerReconnection
  };
};

/**
 * Utility function to find player in list by ID
 * @param {Array} players - Array of players
 * @param {string} playerId - Player ID to find
 * @returns {Object|null} Found player or null
 */
export const findPlayerById = (players, playerId) => {
  if (!Array.isArray(players) || !playerId) {
    return null;
  }

  return players.find(player => player.id === playerId) || null;
};

/**
 * Utility function to count alive players
 * @param {Array} players - Array of players
 * @returns {number} Number of alive players
 */
export const countAlivePlayers = (players) => {
  if (!Array.isArray(players)) {
    return 0;
  }

  return players.filter(player => player.isAlive !== false).length;
};

/**
 * Utility function to count ready players
 * @param {Array} players - Array of players
 * @returns {number} Number of ready players
 */
export const countReadyPlayers = (players) => {
  if (!Array.isArray(players)) {
    return 0;
  }

  return players.filter(player => player.isReady === true).length;
};

/**
 * Utility function to find the host player
 * @param {Array} players - Array of players
 * @returns {Object|null} Host player or null
 */
export const findHostPlayer = (players) => {
  if (!Array.isArray(players)) {
    return null;
  }

  return players.find(player => player.isHost === true) || null;
};

export default createPlayerEventHandlers;