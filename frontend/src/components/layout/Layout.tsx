import {type CSSProperties, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {Outlet} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {queryClient} from '@/lib/queryClient'
import {Toaster} from '@/components/ui/toaster'
import {ThemeProvider} from '@/components/common/ThemeProvider'
import {Header} from './Header'
import {Footer} from './Footer'

type ShellMetrics = {
  headerHeight: number
  footerHeight: number
  contentPadding: number
}

export function Layout() {
  const headerWrapperRef = useRef<HTMLDivElement>(null)
  const footerWrapperRef = useRef<HTMLDivElement>(null)
  const contentWrapperRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<ShellMetrics>({ headerHeight: 0, footerHeight: 0, contentPadding: 0 })

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let animationFrame = 0

    const readMetrics = () => {
      animationFrame = 0
      const headerHeight = headerWrapperRef.current?.offsetHeight ?? 0
      const footerHeight = footerWrapperRef.current?.offsetHeight ?? 0
      const contentPadding = (() => {
        if (!contentWrapperRef.current) {
          return 0
        }
        const styles = window.getComputedStyle(contentWrapperRef.current)
        const paddingTop = parseFloat(styles.paddingTop) || 0
        const paddingBottom = parseFloat(styles.paddingBottom) || 0
        return paddingTop + paddingBottom
      })()

      setMetrics((prev) => {
        if (
          prev.headerHeight === headerHeight &&
          prev.footerHeight === footerHeight &&
          prev.contentPadding === contentPadding
        ) {
          return prev
        }
        return { headerHeight, footerHeight, contentPadding }
      })
    }

    const scheduleRead = () => {
      if (animationFrame) {
        return
      }
      animationFrame = window.requestAnimationFrame(readMetrics)
    }

    readMetrics()
    window.addEventListener('resize', scheduleRead)

    const observers: ResizeObserver[] = []

    if (typeof ResizeObserver !== 'undefined') {
      if (headerWrapperRef.current) {
        const observer = new ResizeObserver(scheduleRead)
        observer.observe(headerWrapperRef.current)
        observers.push(observer)
      }
      if (footerWrapperRef.current) {
        const observer = new ResizeObserver(scheduleRead)
        observer.observe(footerWrapperRef.current)
        observers.push(observer)
      }
      if (contentWrapperRef.current) {
        const observer = new ResizeObserver(scheduleRead)
        observer.observe(contentWrapperRef.current)
        observers.push(observer)
      }
    }

    return () => {
      window.removeEventListener('resize', scheduleRead)
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  const layoutStyle = useMemo(() => {
    return {
      '--app-header-height': `${Math.round(metrics.headerHeight)}px`,
      '--app-footer-height': `${Math.round(metrics.footerHeight)}px`,
      '--app-content-padding': `${Math.round(metrics.contentPadding)}px`,
    } as CSSProperties
  }, [metrics])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="liar-game-theme">
        <div
          className="flex min-h-screen flex-col bg-background"
          style={layoutStyle}
          data-app-shell="true"
        >
          <div ref={headerWrapperRef} className="shrink-0">
            <Header className="shrink-0" />
          </div>
          <main className="flex-1 overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col px-4">
              <div
                ref={contentWrapperRef}
                className="flex min-h-0 flex-1 flex-col py-6 sm:py-8"
                data-app-content="true"
              >
                <Outlet />
              </div>
            </div>
          </main>
          <div ref={footerWrapperRef} className="shrink-0">
            <Footer className="shrink-0" />
          </div>
          <Toaster />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
