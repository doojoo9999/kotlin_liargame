import {apiClient} from '../../../shared/api/apiClient';

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/v1/auth/logout');
};
