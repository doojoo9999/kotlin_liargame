// 번들 최적화 설정
export const bundleOptimization = {
  // Code splitting 설정
  codeSplitting: {
    chunks: 'all' as const,
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all' as const,
        priority: 10,
        reuseExistingChunk: true,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all' as const,
        priority: 5,
        reuseExistingChunk: true,
        enforce: true,
      },
      animations: {
        test: /[\\/](framer-motion|lottie-web)[\\/]/,
        name: 'animations',
        chunks: 'all' as const,
        priority: 8,
      },
      accessibility: {
        test: /[\\/]accessibility[\\/]/,
        name: 'accessibility',
        chunks: 'all' as const,
        priority: 7,
      }
    }
  },

  // Tree shaking 최적화
  treeShaking: {
    usedExports: true,
    sideEffects: false,
    optimization: {
      providedExports: true,
      usedExports: true,
      sideEffects: false,
      innerGraph: true,
      mangleExports: 'size',
    }
  },

  // 압축 설정
  compression: {
    gzip: true,
    brotli: true,
    threshold: 10240,
    algorithm: 'gzip',
    compressionOptions: {
      level: 9,
      chunkSize: 1024,
    }
  },

  // 빌드 최적화
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari12'],
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', '@radix-ui/react-dialog'],
          'utils': ['clsx', 'tailwind-merge'],
        },
      },
    },
  }
};

// 런타임 최적화 유틸리티
export class RuntimeOptimizer {
  private performanceObserver?: PerformanceObserver;
  private memoryThreshold = 50 * 1024 * 1024; // 50MB
  private fpsThreshold = 30;

  constructor() {
    this.setupPerformanceMonitoring();
  }

  // 리소스 우선순위 설정
  setPriority(selector: string, priority: 'high' | 'low') {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element.tagName === 'LINK' || element.tagName === 'SCRIPT') {
        element.setAttribute('fetchpriority', priority);
      }
    });
  }

  // 사용 통계 수집
  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      // 로딩 시간
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,

      // 페인트 시간
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

      // 메모리 사용량
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null,

      // 연결 정보
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        rtt: (navigator as any).connection.rtt,
        downlink: (navigator as any).connection.downlink,
      } : null
    };
  }

  destroy() {
    this.performanceObserver?.disconnect();
  }

  private setupPerformanceMonitoring() {
    // Performance Observer 설정
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.analyzePerformance(entries);
      });

      this.performanceObserver.observe({
        entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint']
      });
    }

    // 메모리 모니터링
    if ('memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 10000); // 10초마다 체크
    }
  }

  private analyzePerformance(entries: PerformanceEntryList) {
    entries.forEach(entry => {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          if (entry.startTime > 4000) {
            console.warn('LCP is slow:', entry.startTime);
            this.optimizeLCP();
          }
          break;
        case 'paint':
          if (entry.name === 'first-contentful-paint' && entry.startTime > 2000) {
            console.warn('FCP is slow:', entry.startTime);
            this.optimizeFCP();
          }
          break;
      }
    });
  }

  private checkMemoryUsage() {
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize > this.memoryThreshold) {
      console.warn('High memory usage detected:', memory.usedJSHeapSize);
      this.triggerGarbageCollection();
    }
  }

  private optimizeLCP() {
    // LCP 최적화: 이미지 우선순위 조정
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img, index) => {
      if (index < 3) {
        img.removeAttribute('loading');
        img.setAttribute('fetchpriority', 'high');
      }
    });
  }

  private optimizeFCP() {
    // FCP 최적화: 중요하지 않은 리소스 지연 로드
    const nonCriticalElements = document.querySelectorAll('[data-non-critical]');
    nonCriticalElements.forEach(element => {
      element.setAttribute('style', 'display: none;');
      setTimeout(() => {
        element.removeAttribute('style');
      }, 1000);
    });
  }

  private triggerGarbageCollection() {
    // 수동 가비지 컬렉션 트리거 (가능한 경우)
    if ('gc' in window) {
      (window as any).gc();
    }

    // 캐시 정리
    this.clearCaches();
  }

  private clearCaches() {
    // 이미지 캐시 정리
    const images = document.querySelectorAll('img[data-cached]');
    images.forEach(img => img.removeAttribute('data-cached'));

    // 비활성 리스너 정리
    this.cleanupInactiveListeners();
  }

  private cleanupInactiveListeners() {
    // 이벤트 리스너 정리 로직
    window.dispatchEvent(new CustomEvent('cleanup-listeners'));
  }
}

// 전역 최적화 인스턴스
export const runtimeOptimizer = new RuntimeOptimizer();
