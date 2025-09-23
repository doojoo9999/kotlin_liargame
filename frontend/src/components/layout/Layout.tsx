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
          <Header className="shrink-0" />
          <main className="flex-1 overflow-hidden">
            <div className="mx-auto w-full max-w-screen-2xl px-4">
              <div className="flex min-h-0 flex-col overflow-y-auto py-8">
                <Outlet />
              </div>
            </div>
          </main>
          <Footer className="shrink-0" />
          <Toaster />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
