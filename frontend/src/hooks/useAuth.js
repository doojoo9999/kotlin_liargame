import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
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
      navigate('/lobby');
    },
    onError: (error) => {
      console.error("Login failed:", error);
      // Error handling is managed in the component with snackbars
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      storeLogout();
      queryClient.clear(); // Clear all query cache on logout
      navigate('/login');
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
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
