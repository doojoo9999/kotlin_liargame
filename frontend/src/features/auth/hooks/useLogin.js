import {useMutation} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {login as loginApi} from '@/features/auth/api';
import {useAuthStore} from '@/stores/authStore';

export const useLogin = (options = {}) => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (nickname) => loginApi(nickname),
    ...options,
    onSuccess: (data, variables, context) => {
      const user = { nickname: variables };
      login(user);
      
      console.log('Login successful, navigating to lobby...');
      navigate('/lobby');

      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Login failed:', error);
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
