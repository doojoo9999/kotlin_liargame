import apiClient from '../apiClient';

export const addSubject = async (name) => {
  const response = await apiClient.post('/subjects/applysubj', { name });
  return response;
};

export const addWord = async (subject, word) => {
  const response = await apiClient.post('/words/applyw', { subject, word });
  return response;
};
