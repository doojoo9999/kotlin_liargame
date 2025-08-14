import {ActionTypes} from '../state/gameActions.js'

// WebSocket Event Handlers
// This module contains only event handler functions for WebSocket messages

export const createChatMessageHandler = (dispatch) => {
  return (message) => {
    console.log('[DEBUG_LOG] Received chat message via WebSocket:', message)
    dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message })
  }
}

export const createGameUpdateHandler = (dispatch) => {
  return (update) => {
    console.log('[DEBUG_LOG] Received game update:', update)
    
    // Handle PLAYER_JOINED and PLAYER_LEFT events
    if (update.type === 'PLAYER_JOINED' || update.type === 'PLAYER_LEFT') {
      // Update room players if available
      if (update.roomData && update.roomData.players) {
        dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: update.roomData.players })
      }
      
      // Update current room information with roomData
      if (update.roomData) {
        const updatedRoom = {
          gameNumber: update.roomData.gameNumber,
          title: update.roomData.title,
          host: update.roomData.host,
          currentPlayers: update.roomData.currentPlayers,
          maxPlayers: update.roomData.maxPlayers,
          subject: update.roomData.subject,
          subjects: update.roomData.subjects || [],
          state: update.roomData.state,
          players: update.roomData.players || []
        }
        
        console.log('[DEBUG_LOG] Updating currentRoom with roomData (including subjects):', updatedRoom)
        dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: updatedRoom })
      }
      
      // Update room in the room list as well
      if (update.roomData) {
        dispatch({ 
          type: ActionTypes.UPDATE_ROOM_IN_LIST, 
          payload: {
            gameNumber: update.roomData.gameNumber,
            currentPlayers: update.roomData.currentPlayers,
            maxPlayers: update.roomData.maxPlayers,
            title: update.roomData.title,
            subject: update.roomData.subject,
            subjects: update.roomData.subjects || [], // Include subjects array
            state: update.roomData.state
          }
        })
      }
    }
  }
}

export const createPlayerUpdateHandler = (dispatch) => {
  return (players) => {
    console.log('[DEBUG_LOG] Received player update:', players)
    dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: players })
  }
}

export const createModeratorMessageHandler = (dispatch) => {
  return (message) => {
    const moderatorMessage = JSON.parse(message.body)
    console.log('[DEBUG_LOG] Moderator message received:', moderatorMessage)
    
    // 사회자 메시지 상태 업데이트
    dispatch({ 
      type: ActionTypes.SET_MODERATOR_MESSAGE, 
      payload: moderatorMessage.content 
    })
    
    // 3초 후 메시지 숨기기
    setTimeout(() => {
      dispatch({ 
        type: ActionTypes.SET_MODERATOR_MESSAGE, 
        payload: null 
      })
    }, 3000)
  }
}

export const createTurnChangeHandler = (dispatch) => {
  return (message) => {
    const turnMessage = JSON.parse(message.body)
    console.log('[DEBUG_LOG] Turn change received:', turnMessage)
    
    dispatch({ 
      type: ActionTypes.SET_CURRENT_TURN_PLAYER, 
      payload: turnMessage.currentSpeakerId 
    })
  }
}