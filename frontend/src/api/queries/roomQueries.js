import apiClient from '../apiClient';

export const getAllRooms = async () => {
  const response = await apiClient.get('/game/rooms');
  return response.gameRooms || [];
};

export const getRoomInfo = async (gameNumber) => {
  const response = await apiClient.get(`/game/${gameNumber}`);
  return response;
};

export const getRoomDetails = async (gameNumber) => {
  const response = await apiClient.get(`/game/${gameNumber}`);
  return response;
};

export const getRoomPlayers = async (gameNumber) => {
  const response = await apiClient.get(`/game/${gameNumber}`);
  return response.players || [];
};

export const recoverGameState = async (gameNumber) => {
  const response = await apiClient.get(`/game/recover-state/${gameNumber}`);
  return response;
};
