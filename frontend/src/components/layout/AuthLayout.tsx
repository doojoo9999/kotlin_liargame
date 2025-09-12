import {Outlet} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {queryClient} from '@/lib/queryClient'
import {Toaster} from '@/components/ui/toaster'
import {ThemeProvider} from '@/components/common/ThemeProvider'

export function AuthLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="liar-game-theme">
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
