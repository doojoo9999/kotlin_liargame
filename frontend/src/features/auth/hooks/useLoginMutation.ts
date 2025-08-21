import {useMutation} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useUserStore} from '../../../shared/stores/userStore';
import type {User} from '../api/login';
import {login} from '../api/login';

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: login,
    onSuccess: (data: User) => {
      console.log('Login successful:', data);
      setUser(data.nickname);
      navigate('/');
    },
    onError: (error) => {
      // TODO: Show user-friendly error notification
      console.error('Login failed:', error);
    },
  });
};
