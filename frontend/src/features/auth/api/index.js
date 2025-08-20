import apiClient from '@/shared/api/apiClient';

/**
 * Logs in the user with the provided nickname.
 * @param {string} nickname The user's nickname.
 * @returns {Promise<any>} The response from the server.
 */
export const login = async (nickname) => {
  // The actual endpoint might be different, e.g., /api/auth/login
  const response = await apiClient.post('/login', { nickname });
  return response.data;
};
