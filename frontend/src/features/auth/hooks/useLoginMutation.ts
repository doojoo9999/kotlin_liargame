import {useMutation} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useNotifications} from '../../../shared/hooks/useNotifications';
import {useUserStore} from '../../../shared/stores/userStore';
import type {User} from '../api/login';
import {login} from '../api/login';
import {isAxiosError} from 'axios';

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);
  const { showError } = useNotifications();

  return useMutation({
    mutationFn: login,
    onSuccess: (data: User) => {
      console.log('Login successful:', data);
      setUser(data.nickname);
      navigate('/');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      if (isAxiosError(error) && error.response) {
        // Assuming the backend sends an error message in a standard format
        errorMessage = error.response.data?.message || error.message;
      }
      showError('로그인 실패', errorMessage);
    },
  });
};
