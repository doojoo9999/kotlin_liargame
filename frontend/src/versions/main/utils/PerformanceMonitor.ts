interface PerformanceMetrics {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
}

interface WebSocketMetrics {
  connectionTime: number
  messageLatency: number
  reconnectionCount: number
  messagesPerSecond: number
}

interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

// 성능 이슈 타입 정의
interface PerformanceIssue {
  type: 'slow-render' | 'memory-leak' | 'network-error' | 'bundle-size' | 'custom';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}
  private wsMetrics: Partial<WebSocketMetrics> = {}
  private observer: PerformanceObserver | null = null
  private startTime = Date.now()

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  public initialize(): void {
    this.observeWebVitals()
    this.observeMemoryUsage()
    this.observeNavigationTiming()
  }

  public recordWebSocketConnection(connectionTime: number): void {
    this.wsMetrics.connectionTime = connectionTime
  }

  public recordMessageLatency(latency: number): void {
    this.wsMetrics.messageLatency = latency
  }

  public recordReconnection(): void {
    this.wsMetrics.reconnectionCount = (this.wsMetrics.reconnectionCount || 0) + 1
  }

  public recordMessageRate(messagesPerSecond: number): void {
    this.wsMetrics.messagesPerSecond = messagesPerSecond
  }

  public getMetrics(): {
    performance: Partial<PerformanceMetrics>
    webSocket: Partial<WebSocketMetrics>
    sessionDuration: number
  } {
    return {
      performance: this.metrics,
      webSocket: this.wsMetrics,
      sessionDuration: Date.now() - this.startTime
    }
  }

  public reportIssue(type: string, data: PerformanceIssue): void {
    // In production, this would send to monitoring service
    if (import.meta.env.DEV) {
      console.warn(`[Performance Issue] ${type}:`, data)
    } else {
      // Send to monitoring service like Sentry, DataDog, etc.
      this.sendToMonitoringService(type, data)
    }
  }

  public generateReport(): string {
    const metrics = this.getMetrics()
    const report = {
      timestamp: new Date().toISOString(),
      session_duration: metrics.sessionDuration,
      core_web_vitals: {
        lcp: metrics.performance.lcp,
        fid: metrics.performance.fid,
        cls: metrics.performance.cls,
        fcp: metrics.performance.fcp
      },
      websocket_metrics: metrics.webSocket,
      page_info: {
        url: window.location.href,
        user_agent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    }

    return JSON.stringify(report, null, 2)
  }

  public dispose(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  private observeWebVitals(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processPerformanceEntry(entry)
        })
      })

      // Observe Core Web Vitals
      this.observer.observe({
        entryTypes: ['paint', 'navigation', 'measure', 'largest-contentful-paint']
      })
    }

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // FID (First Input Delay)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-input') {
            this.metrics.fid = entry.processingStart - entry.startTime
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    }

    // CLS (Cumulative Layout Shift)
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.metrics.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.reportMemoryUsage({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
      }, 30000) // Every 30 seconds
    }
  }

  private observeNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        const entry = navEntries[0]
        this.metrics.fcp = entry.responseStart - entry.requestStart
        this.metrics.ttfb = entry.responseStart - entry.requestStart
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'paint') {
      if (entry.name === 'first-contentful-paint') {
        this.metrics.fcp = entry.startTime
      }
    }
  }

  private reportMemoryUsage(memory: MemoryMetrics): void {
    const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

    if (memoryUsagePercent > 80) {
      console.warn('[Performance] High memory usage detected:', memoryUsagePercent.toFixed(2) + '%')
      this.reportIssue('HIGH_MEMORY_USAGE', {
        usage: memoryUsagePercent,
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit
      })
    }
  }

  private sendToMonitoringService(type: string, data: any): void {
    // Implementation for production monitoring
    fetch('/api/monitoring/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        metrics: this.getMetrics()
      })
    }).catch(err => console.error('Failed to send performance data:', err))
  }
}

// Hook for React components to use performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()

  React.useEffect(() => {
    monitor.initialize()
    return () => monitor.dispose()
  }, [monitor])

  return {
    recordWebSocketConnection: monitor.recordWebSocketConnection.bind(monitor),
    recordMessageLatency: monitor.recordMessageLatency.bind(monitor),
    recordReconnection: monitor.recordReconnection.bind(monitor),
    recordMessageRate: monitor.recordMessageRate.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    generateReport: monitor.generateReport.bind(monitor)
  }
}

export { PerformanceMonitor }
