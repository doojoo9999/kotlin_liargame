import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter} from 'react-router-dom';

// Main Version 전용 컴포넌트들
const MainRouter = React.lazy(() => import('./router/MainRouter'));

// QueryClient 인스턴스 생성 (더 많은 최적화 옵션)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10분 (더 긴 캐시)
      refetchOnWindowFocus: false,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});

const MainApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="main-version">
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">Loading Main Version...</p>
                  <p className="text-sm text-gray-500 mt-1">Enhanced UI Loading</p>
                </div>
              </div>
            }
          >
            <MainRouter />
          </React.Suspense>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default MainApp;
