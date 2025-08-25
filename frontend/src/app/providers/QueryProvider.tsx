import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 10 * 60 * 1000,   // 10분 (구 cacheTime)
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
                // 401, 403 에러는 재시도하지 않음
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    return false;
                }
                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});