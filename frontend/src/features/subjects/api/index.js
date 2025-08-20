import apiClient from '@/shared/api/apiClient';

/**
 * Fetches the list of all available game subjects.
 * @returns {Promise<any>} The list of game subjects.
 */
export const getSubjects = async () => {
  const response = await apiClient.get('/api/v1/subjects');
  return response.data;
};
