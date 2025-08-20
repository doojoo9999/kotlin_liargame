import React from 'react';
import {BrowserRouter} from 'react-router-dom';
import {MantineProvider} from '@mantine/core';
import {Notifications} from '@mantine/notifications';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {theme} from '@/app/styles/theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Default to false for better UX
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const AppProvider = ({ children }) => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>
          <Notifications />
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </MantineProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
};
