import React from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {BrowserRouter} from 'react-router-dom'
import {ThemeProvider} from './ThemeProvider'
import {GameProvider} from './GameProvider'
import {NotificationProvider} from './NotificationProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
})

interface MainProvidersProps {
  children: React.ReactNode
}

export function MainProviders({ children }: MainProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="liargame-theme">
          <NotificationProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </NotificationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
