import apiClient from '../apiClient';

export const getAllSubjects = async () => {
  const response = await apiClient.get('/subjects/listsubj');
  return response || [];
};

export const getChatHistory = async (gameNumber, limit = 50) => {
  const response = await apiClient.get('/chat/history', {
    params: {
      gameNumber: parseInt(gameNumber),
      limit: limit,
    },
  });
  return response || [];
};
