import apiClient from '../apiClient';

export const createRoom = async (roomData) => {
  const response = await apiClient.post('/game/create', roomData);
  return response;
};

export const joinRoom = async (gameNumber, password = '') => {
  const response = await apiClient.post('/game/join', { gameNumber, password });
  return response;
};

export const leaveRoom = async (gameNumber) => {
  const response = await apiClient.post('/game/leave', { gameNumber: parseInt(gameNumber) });
  return response;
};

export const startGame = async (gameNumber) => {
  const response = await apiClient.post('/game/start', { gameNumber });
  return response;
};
