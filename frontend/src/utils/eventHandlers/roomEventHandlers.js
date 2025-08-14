/**
 * Room-related WebSocket event handlers
 * Handles room updates, creation/deletion, state changes, and room information
 */

import {normalizeRoomData, normalizeRoomsList} from '../dataTransformers.js';

/**
 * Creates room event handlers with access to dispatch function
 * @param {Function} dispatch - Redux-style dispatch function for state updates
 * @returns {Object} Object containing room event handlers
 */
export const createRoomEventHandlers = (dispatch) => {
  if (typeof dispatch !== 'function') {
    throw new Error('[roomEventHandlers] dispatch must be a function');
  }

  /**
   * Handles room information updates
   * @param {Object} roomData - Room update data
   */
  const handleRoomUpdate = (roomData) => {
    try {
      console.log('[DEBUG_LOG] Room update received:', roomData);
      
      const normalizedRoom = normalizeRoomData(roomData.room || roomData);
      if (!normalizedRoom) {
        console.warn('[DEBUG_LOG] Failed to normalize room update data:', roomData);
        return;
      }

      // Update current room if this is the room we're in
      if (roomData.isCurrentRoom || roomData.updateCurrentRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: normalizedRoom
        });
      }

      // Update room in the rooms list
      dispatch({
        type: 'UPDATE_ROOM_IN_LIST',
        payload: normalizedRoom
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room update:', error, roomData);
    }
  };

  /**
   * Handles room state changes (WAITING, PLAYING, etc.)
   * @param {Object} stateData - Room state change data
   */
  const handleRoomStateChange = (stateData) => {
    try {
      console.log('[DEBUG_LOG] Room state change:', stateData);
      
      const roomId = stateData.roomId || stateData.gameNumber;
      const newState = stateData.state || stateData.gameState;
      
      if (!roomId || !newState) {
        console.warn('[DEBUG_LOG] Missing room ID or state in room state change:', stateData);
        return;
      }

      // Update current room state if this is our room
      if (stateData.isCurrentRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: {
            ...stateData.currentRoom,
            state: newState
          }
        });
      }

      // Update room state in rooms list
      dispatch({
        type: 'UPDATE_ROOM_IN_LIST',
        payload: {
          gameNumber: roomId,
          state: newState,
          ...stateData.additionalRoomData
        }
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room state change:', error, stateData);
    }
  };

  /**
   * Handles new room creation notifications
   * @param {Object} roomData - New room data
   */
  const handleRoomCreated = (roomData) => {
    try {
      console.log('[DEBUG_LOG] New room created:', roomData);
      
      const normalizedRoom = normalizeRoomData(roomData.room || roomData);
      if (!normalizedRoom) {
        console.warn('[DEBUG_LOG] Failed to normalize new room data:', roomData);
        return;
      }

      // Add room to the rooms list (this will be handled by updating the full list)
      // For now, we could trigger a refresh of the rooms list
      // or implement an ADD_ROOM action
      dispatch({
        type: 'ADD_ROOM_TO_LIST',
        payload: normalizedRoom
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room creation:', error, roomData);
    }
  };

  /**
   * Handles room deletion notifications
   * @param {Object} deletionData - Room deletion data
   */
  const handleRoomDeleted = (deletionData) => {
    try {
      console.log('[DEBUG_LOG] Room deleted:', deletionData);
      
      const roomId = deletionData.roomId || deletionData.gameNumber;
      if (!roomId) {
        console.warn('[DEBUG_LOG] No room ID in room deletion data:', deletionData);
        return;
      }

      // Remove room from rooms list
      dispatch({
        type: 'REMOVE_ROOM_FROM_LIST',
        payload: roomId
      });

      // If this was our current room, clear it
      if (deletionData.wasCurrentRoom || deletionData.clearCurrentRoom) {
        dispatch({
          type: 'CLEAR_CURRENT_ROOM',
          payload: null
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room deletion:', error, deletionData);
    }
  };

  /**
   * Handles complete rooms list updates
   * @param {Object} roomsData - Complete rooms list data
   */
  const handleRoomsListUpdate = (roomsData) => {
    try {
      console.log('[DEBUG_LOG] Rooms list update:', roomsData);
      
      let rooms = roomsData.rooms || roomsData;
      if (!Array.isArray(rooms)) {
        console.warn('[DEBUG_LOG] Rooms data is not an array:', rooms);
        return;
      }

      const normalizedRooms = normalizeRoomsList(rooms);
      dispatch({
        type: 'SET_ROOM_LIST',
        payload: normalizedRooms
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling rooms list update:', error, roomsData);
    }
  };

  /**
   * Handles room player count changes
   * @param {Object} countData - Player count update data
   */
  const handleRoomPlayerCountUpdate = (countData) => {
    try {
      console.log('[DEBUG_LOG] Room player count update:', countData);
      
      const roomId = countData.roomId || countData.gameNumber;
      const playerCount = countData.playerCount || countData.currentPlayers;
      
      if (!roomId || playerCount === undefined) {
        console.warn('[DEBUG_LOG] Missing room ID or player count:', countData);
        return;
      }

      // Update room player count in list
      dispatch({
        type: 'UPDATE_ROOM_IN_LIST',
        payload: {
          gameNumber: roomId,
          currentPlayers: playerCount,
          playerCount: playerCount
        }
      });

      // Update current room if this is our room
      if (countData.isCurrentRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: {
            ...countData.currentRoom,
            currentPlayers: playerCount,
            playerCount: playerCount
          }
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room player count update:', error, countData);
    }
  };

  /**
   * Handles room settings updates
   * @param {Object} settingsData - Room settings update data
   */
  const handleRoomSettingsUpdate = (settingsData) => {
    try {
      console.log('[DEBUG_LOG] Room settings update:', settingsData);
      
      const roomId = settingsData.roomId || settingsData.gameNumber;
      const settings = settingsData.settings || settingsData;
      
      if (!roomId) {
        console.warn('[DEBUG_LOG] No room ID in settings update:', settingsData);
        return;
      }

      // Update room settings in current room
      if (settingsData.isCurrentRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: {
            ...settingsData.currentRoom,
            ...settings
          }
        });
      }

      // Update room in list with new settings
      dispatch({
        type: 'UPDATE_ROOM_IN_LIST',
        payload: {
          gameNumber: roomId,
          ...settings
        }
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room settings update:', error, settingsData);
    }
  };

  /**
   * Handles room password changes
   * @param {Object} passwordData - Room password change data
   */
  const handleRoomPasswordChange = (passwordData) => {
    try {
      console.log('[DEBUG_LOG] Room password change:', passwordData);
      
      const roomId = passwordData.roomId || passwordData.gameNumber;
      const hasPassword = passwordData.hasPassword;
      
      if (!roomId || hasPassword === undefined) {
        console.warn('[DEBUG_LOG] Missing room ID or password status:', passwordData);
        return;
      }

      // Update room password status
      dispatch({
        type: 'UPDATE_ROOM_IN_LIST',
        payload: {
          gameNumber: roomId,
          hasPassword: hasPassword
        }
      });

      // Update current room if this is our room
      if (passwordData.isCurrentRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: {
            ...passwordData.currentRoom,
            hasPassword: hasPassword
          }
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room password change:', error, passwordData);
    }
  };

  /**
   * Handles room host changes
   * @param {Object} hostData - Room host change data
   */
  const handleRoomHostChange = (hostData) => {
    try {
      console.log('[DEBUG_LOG] Room host change:', hostData);
      
      const roomId = hostData.roomId || hostData.gameNumber;
      const newHost = hostData.newHost || hostData.host;
      
      if (!roomId || !newHost) {
        console.warn('[DEBUG_LOG] Missing room ID or new host:', hostData);
        return;
      }

      // Update room host in list
      dispatch({
        type: 'UPDATE_ROOM_IN_LIST',
        payload: {
          gameNumber: roomId,
          host: newHost
        }
      });

      // Update current room if this is our room
      if (hostData.isCurrentRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: {
            ...hostData.currentRoom,
            host: newHost
          }
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room host change:', error, hostData);
    }
  };

  /**
   * Handles room join success
   * @param {Object} joinData - Room join success data
   */
  const handleRoomJoinSuccess = (joinData) => {
    try {
      console.log('[DEBUG_LOG] Successfully joined room:', joinData);
      
      const normalizedRoom = normalizeRoomData(joinData.room || joinData);
      if (normalizedRoom) {
        dispatch({
          type: 'SET_CURRENT_ROOM',
          payload: normalizedRoom
        });

        // Switch to room page
        dispatch({
          type: 'SET_CURRENT_PAGE',
          payload: 'room'
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room join success:', error, joinData);
    }
  };

  /**
   * Handles room join failure
   * @param {Object} errorData - Room join error data
   */
  const handleRoomJoinError = (errorData) => {
    try {
      console.error('[DEBUG_LOG] Failed to join room:', errorData);
      
      // Set error state
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'room',
          value: errorData.message || '방 참가에 실패했습니다'
        }
      });

      // Clear loading state
      dispatch({
        type: 'SET_LOADING',
        payload: {
          type: 'room',
          value: false
        }
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room join error:', error, errorData);
    }
  };

  /**
   * Handles room leave notifications
   * @param {Object} leaveData - Room leave data
   */
  const handleRoomLeave = (leaveData) => {
    try {
      console.log('[DEBUG_LOG] Left room:', leaveData);
      
      // Clear current room
      dispatch({
        type: 'CLEAR_CURRENT_ROOM',
        payload: null
      });

      // Switch back to lobby
      dispatch({
        type: 'SET_CURRENT_PAGE',
        payload: 'lobby'
      });

      // Clear chat messages
      dispatch({
        type: 'CLEAR_CHAT_MESSAGES',
        payload: null
      });

      // Reset game state
      dispatch({
        type: 'RESET_GAME_STATE',
        payload: null
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling room leave:', error, leaveData);
    }
  };

  // Return all room event handlers
  return {
    handleRoomUpdate,
    handleRoomStateChange,
    handleRoomCreated,
    handleRoomDeleted,
    handleRoomsListUpdate,
    handleRoomPlayerCountUpdate,
    handleRoomSettingsUpdate,
    handleRoomPasswordChange,
    handleRoomHostChange,
    handleRoomJoinSuccess,
    handleRoomJoinError,
    handleRoomLeave
  };
};

/**
 * Utility function to find room in list by ID
 * @param {Array} rooms - Array of rooms
 * @param {string|number} roomId - Room ID to find
 * @returns {Object|null} Found room or null
 */
export const findRoomById = (rooms, roomId) => {
  if (!Array.isArray(rooms) || !roomId) {
    return null;
  }

  return rooms.find(room => 
    room.gameNumber === roomId || 
    room.id === roomId
  ) || null;
};

/**
 * Utility function to check if room is full
 * @param {Object} room - Room object
 * @returns {boolean} True if room is full
 */
export const isRoomFull = (room) => {
  if (!room || typeof room !== 'object') {
    return true; // Assume full if invalid room
  }

  const currentPlayers = room.currentPlayers || room.playerCount || 0;
  const maxPlayers = room.maxPlayers || room.gameParticipants || 0;
  
  return currentPlayers >= maxPlayers;
};

/**
 * Utility function to check if room can be joined
 * @param {Object} room - Room object
 * @returns {boolean} True if room can be joined
 */
export const canJoinRoom = (room) => {
  if (!room || typeof room !== 'object') {
    return false;
  }

  // Check if room is full
  if (isRoomFull(room)) {
    return false;
  }

  // Check room state - usually only WAITING rooms can be joined
  const state = room.state || room.gameState;
  if (state && state !== 'WAITING') {
    return false;
  }

  return true;
};

/**
 * Utility function to get room display status
 * @param {Object} room - Room object
 * @returns {Object} Status object with color, text, and joinable flag
 */
export const getRoomDisplayStatus = (room) => {
  if (!room || typeof room !== 'object') {
    return {
      text: '알 수 없음',
      color: 'gray',
      canJoin: false
    };
  }

  const state = room.state || room.gameState;
  const isFullRoom = isRoomFull(room);
  
  if (isFullRoom) {
    return {
      text: '방 가득참',
      color: 'red',
      canJoin: false
    };
  }

  switch (state) {
    case 'WAITING':
      return {
        text: '대기 중',
        color: 'green',
        canJoin: true
      };
    case 'PLAYING':
    case 'SPEAKING':
    case 'VOTING':
      return {
        text: '게임 중',
        color: 'orange',
        canJoin: false
      };
    case 'FINISHED':
      return {
        text: '게임 종료',
        color: 'gray',
        canJoin: false
      };
    default:
      return {
        text: state || '알 수 없음',
        color: 'gray',
        canJoin: false
      };
  }
};

export default createRoomEventHandlers;