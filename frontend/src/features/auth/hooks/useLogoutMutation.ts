import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useUserStore} from '../../../shared/stores/userStore';
import {logout} from '../api/logout';

export const useLogoutMutation = () => {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      console.log('Logout successful');
      clearUser();
      // Clear all react-query cache on logout
      queryClient.clear();
      navigate('/login');
    },
    onError: (error) => {
      // Even if logout API fails, clear client-side state as a fallback
      console.error('Logout failed:', error);
      clearUser();
      queryClient.clear();
      navigate('/login');
    },
  });
};
