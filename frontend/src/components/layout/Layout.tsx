import {Outlet} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {queryClient} from '@/lib/queryClient'
import {Toaster} from '@/components/ui/toaster'
import {ThemeProvider} from '@/components/common/ThemeProvider'
import {Header} from './Header'
import {Footer} from './Footer'

export function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="liar-game-theme">
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Outlet />
          </main>
          <Footer />
          <Toaster />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}