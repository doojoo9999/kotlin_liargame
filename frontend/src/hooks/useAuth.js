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
        title: 'Welcome!',
        message: `Successfully logged in as ${data.nickname}. You will be redirected to the lobby.`,
        color: 'green',
      });
      navigate('/lobby');
    },
    onError: (error) => {
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.status === 409) {
        errorMessage = 'This nickname is already in use.';
      } else if (error.response?.status === 400) {
        errorMessage = 'The nickname is invalid (e.g., too short, too long, special characters).';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      notifications.show({
        title: 'Login Failed',
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
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
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
