import {MantineProvider} from '@mantine/core';
import {Notifications} from '@mantine/notifications';
import {QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {queryClient} from '../../shared/api/queryClient';
import {GlobalStyles} from '../styles/GlobalStyles';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <GlobalStyles />
        <Notifications />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
