import {useQuery} from '@tanstack/react-query';

interface UserInfo {
  authenticated: boolean;
  userId?: number;
  nickname?: string;
  sessionId?: string;
}

const fetchCurrentUser = async (): Promise<UserInfo> => {
  try {
    const response = await fetch('/api/v1/auth/me', {
      credentials: 'include',
      method: 'GET'
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return {
      authenticated: true,
      userId: data.userId,
      nickname: data.nickname,
      sessionId: data.sessionId
    };
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    return { authenticated: false };
  }
};

export const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
