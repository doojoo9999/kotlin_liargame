import * as gameApi from './gameApi'
import gameStompClient from '../socket/gameStompClient'

// Authentication API functions
// This module handles only authentication-related API calls

export const loginUser = async (nickname) => {
  const result = await gameApi.login(nickname)
  const userData = {
    id: result.userId,
    nickname: nickname
  }
  
  localStorage.setItem('userData', JSON.stringify(userData))
  return userData
}

export const logoutUser = () => {
  // Disconnect WebSocket if connected
  if (gameStompClient.isClientConnected()) {
    gameStompClient.disconnect()
  }

  // Remove user data from localStorage
  localStorage.removeItem('userData')
  
  return true
}