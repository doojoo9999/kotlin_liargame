import apiClient from '../apiClient';

export const login = async (nickname) => {
  const response = await apiClient.post('/auth/login', { nickname });
  return response;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response;
};
