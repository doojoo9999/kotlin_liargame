import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {useAuthStore} from '../stores/authStore';
import {login as loginApi, logout as logoutApi} from '../api/mutations/authMutations';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      storeLogin({ userId: data.userId, nickname: data.nickname });
      notifications.show({
        title: '환영합니다!',
        message: `${data.nickname}님, 성공적으로 로그인되었습니다. 로비로 이동합니다.`,
        color: 'green',
      });
      navigate('/lobby');
    },
    onError: (error) => {
      let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';
      if (error.response?.status === 409) {
        errorMessage = '이미 사용 중인 닉네임입니다.';
      } else if (error.response?.status === 400) {
        errorMessage = '닉네임이 유효하지 않습니다 (너무 짧거나, 길거나, 특수문자를 포함). ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      notifications.show({
        title: '로그인 실패',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      storeLogout();
      queryClient.clear();
      navigate('/login');
      notifications.show({
        title: '로그아웃',
        message: '성공적으로 로그아웃되었습니다.',
        color: 'blue',
      });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if API fails, force logout on client
      storeLogout();
      queryClient.clear();
      navigate('/login');
    }
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
