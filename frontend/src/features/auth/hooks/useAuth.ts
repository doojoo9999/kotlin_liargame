import {useQuery} from '@tanstack/react-query';

interface UserInfo {
  authenticated: boolean;
  userId?: number;
  nickname?: string;
  sessionId?: string;
}

interface AuthResponse {
  userId: number;
  nickname: string;
  sessionId: string;
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

    const data: AuthResponse = await response.json();
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
    retry: 2, // Retry twice on failure for better reliability
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    gcTime: 1000 * 60 * 10, // 10 minutes
    throwOnError: false,
    retryOnMount: true,
    networkMode: 'online'
  });
};
