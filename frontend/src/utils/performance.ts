// Performance optimization utilities

// Lazy loading utilities
export const lazy = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return React.lazy(() => 
    importFunc().catch((error) => {
      console.error('Lazy loading failed:', error);
      // Return a fallback component if import fails
      return { default: fallback || (() => React.createElement('div', null, 'Loading failed')) };
    })
  );
};

// Image optimization utilities
export const optimizeImage = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
} = {}) => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If using a service like Cloudinary or similar
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  
  return `${src}?${params.toString()}`;
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): T => {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// Memory management utilities
export class MemoryManager {
  private static observers = new Set<IntersectionObserver>();
  private static resizeObservers = new Set<ResizeObserver>();
  
  static createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.observers.add(observer);
    return observer;
  }
  
  static createResizeObserver(
    callback: ResizeObserverCallback
  ): ResizeObserver {
    const observer = new ResizeObserver(callback);
    this.resizeObservers.add(observer);
    return observer;
  }
  
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.resizeObservers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.resizeObservers.clear();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();
  
  static mark(name: string) {
    if ('performance' in window) {
      performance.mark(name);
      this.measurements.set(name, performance.now());
    }
  }
  
  static measure(name: string, startMark: string, endMark?: string) {
    if ('performance' in window) {
      const end = endMark || `${startMark}-end`;
      this.mark(end);
      performance.measure(name, startMark, end);
      
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        console.log(`${name}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    }
    return 0;
  }
  
  static getMetrics() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        // Core Web Vitals
        FCP: this.getFCP(),
        LCP: this.getLCP(),
        FID: this.getFID(),
        CLS: this.getCLS(),
        
        // Navigation timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domComplete: navigation.domComplete - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        
        // Resource timing
        resourceCount: performance.getEntriesByType('resource').length,
        
        // Memory (if available)
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit,
        } : null,
      };
    }
    return null;
  }
  
  private static getFCP(): number | null {
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      return fcpEntry ? fcpEntry.startTime : null;
    } catch {
      return null;
    }
  }
  
  private static getLCP(): number | null {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      } else {
        resolve(null);
      }
    }) as any;
  }
  
  private static getFID(): number | null {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0];
          if (firstInput) {
            resolve(firstInput.processingStart - firstInput.startTime);
            observer.disconnect();
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
        
        // Fallback timeout
        setTimeout(() => resolve(null), 10000);
      } else {
        resolve(null);
      }
    }) as any;
  }
  
  private static getCLS(): number | null {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after page load
        window.addEventListener('beforeunload', () => {
          observer.disconnect();
          resolve(clsValue);
        });
      } else {
        resolve(null);
      }
    }) as any;
  }
}

// Virtual scrolling utilities
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// React performance hooks
export const useDebounced = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

export const useThrottled = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = React.useRef(throttle(callback, delay));
  
  React.useEffect(() => {
    throttledCallback.current = throttle(callback, delay);
  }, [callback, delay]);
  
  return throttledCallback.current;
};

// Image lazy loading hook
export const useLazyImage = (src: string, options: IntersectionObserverInit = {}) => {
  const [imageSrc, setImageSrc] = React.useState<string | undefined>(undefined);
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);
  
  React.useEffect(() => {
    let observer: IntersectionObserver | undefined;
    
    if (imageRef && imageSrc !== src) {
      if ('IntersectionObserver' in window) {
        observer = MemoryManager.createIntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setImageSrc(src);
                observer!.unobserve(imageRef);
              }
            });
          },
          options
        );
        
        observer.observe(imageRef);
      } else {
        // Fallback for older browsers
        setImageSrc(src);
      }
    }
    
    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, src, options]);
  
  return [setImageRef, imageSrc] as const;
};

// Bundle splitting helper
export const loadChunk = async (chunkName: string) => {
  try {
    PerformanceMonitor.mark(`chunk-${chunkName}-start`);
    
    const module = await import(/* @vite-ignore */ `./${chunkName}`);
    
    PerformanceMonitor.measure(
      `chunk-${chunkName}`,
      `chunk-${chunkName}-start`
    );
    
    return module;
  } catch (error) {
    console.error(`Failed to load chunk: ${chunkName}`, error);
    throw error;
  }
};

// React import needed for the utilities
import React from 'react';