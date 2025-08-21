import {apiClient} from '../../../shared/api/apiClient';
import type {LoginFormInputs} from '../ui/schema';

// According to the backend API spec, the response might be simple.
// Let's define a basic user type for now.
export interface User {
  nickname: string;
  role: 'USER' | 'ADMIN';
}

export const login = async (data: LoginFormInputs): Promise<User> => {
  const response = await apiClient.post<User>('/api/v1/auth/login', data);
  return response.data;
};
