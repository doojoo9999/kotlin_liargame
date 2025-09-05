import * as React from "react"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"

interface MainProviderProps {
  children: React.ReactNode
}

// Main Version용 QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      cacheTime: 1000 * 60 * 10, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function MainProvider({ children }: MainProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
