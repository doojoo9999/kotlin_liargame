import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter} from 'react-router-dom';

// Light Version 전용 컴포넌트들
const LightRouter = React.lazy(() => import('./router/LightRouter'));

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      refetchOnWindowFocus: false,
    },
  },
});

const LightApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="light-version">
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Loading Light Version...</p>
                </div>
              </div>
            }
          >
            <LightRouter />
          </React.Suspense>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default LightApp;
