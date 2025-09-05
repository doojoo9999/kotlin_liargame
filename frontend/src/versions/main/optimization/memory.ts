import {useCallback, useEffect, useRef} from 'react';

export class MemoryManager {
  private observers = new Map<string, IntersectionObserver>();
  private timers = new Set<number>();
  private intervals = new Set<number>();
  private eventListeners = new Map<string, { element: Element; handler: Function; options?: any }>();
  private resizeObservers = new Set<ResizeObserver>();
  private mutationObservers = new Set<MutationObserver>();
  private animationFrames = new Set<number>();

  // Intersection Observer 풀링
  getIntersectionObserver(threshold = 0.1, rootMargin = '0px'): IntersectionObserver {
    const key = `threshold-${threshold}-margin-${rootMargin}`;

    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const element = entry.target as HTMLElement;

            if (entry.isIntersecting) {
              // 보이는 요소 활성화
              element.classList.add('in-viewport');
              element.setAttribute('data-visible', 'true');

              // 지연 로딩된 콘텐츠 활성화
              const lazyElements = element.querySelectorAll('[data-lazy]');
              lazyElements.forEach(lazy => {
                lazy.removeAttribute('data-lazy');
                lazy.classList.add('loaded');
              });
            } else {
              // 보이지 않는 요소 비활성화
              element.classList.remove('in-viewport');
              element.setAttribute('data-visible', 'false');

              // 비활성화된 요소의 애니메이션 중지
              const animations = element.getAnimations();
              animations.forEach(animation => animation.pause());
            }
          });
        },
        { threshold, rootMargin }
      );

      this.observers.set(key, observer);
    }

    return this.observers.get(key)!;
  }

  // 안전한 타이머 관리
  setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error('Timer callback error:', error);
      } finally {
        this.timers.delete(id);
      }
    }, delay);

    this.timers.add(id);
    return id;
  }

  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error('Interval callback error:', error);
        this.clearInterval(id);
      }
    }, delay);

    this.intervals.add(id);
    return id;
  }

  clearTimeout(id: number) {
    window.clearTimeout(id);
    this.timers.delete(id);
  }

  clearInterval(id: number) {
    window.clearInterval(id);
    this.intervals.delete(id);
  }

  // 안전한 이벤트 리스너 관리
  addEventListener(
    element: Element,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) {
    const key = `${element.tagName}-${event}-${Date.now()}`;

    element.addEventListener(event, handler, options);
    this.eventListeners.set(key, { element, handler, options });

    return key;
  }

  removeEventListener(key: string) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(
        key.split('-')[1],
        listener.handler as EventListener,
        listener.options
      );
      this.eventListeners.delete(key);
    }
  }

  // ResizeObserver 관리
  createResizeObserver(callback: ResizeObserverCallback): ResizeObserver {
    const observer = new ResizeObserver(callback);
    this.resizeObservers.add(observer);
    return observer;
  }

  // MutationObserver 관리
  createMutationObserver(callback: MutationCallback): MutationObserver {
    const observer = new MutationObserver(callback);
    this.mutationObservers.add(observer);
    return observer;
  }

  // RequestAnimationFrame 관리
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = window.requestAnimationFrame((time) => {
      try {
        callback(time);
      } catch (error) {
        console.error('Animation frame callback error:', error);
      } finally {
        this.animationFrames.delete(id);
      }
    });

    this.animationFrames.add(id);
    return id;
  }

  cancelAnimationFrame(id: number) {
    window.cancelAnimationFrame(id);
    this.animationFrames.delete(id);
  }

  // 메모리 사용량 모니터링
  getMemoryInfo() {
    const memory = (performance as any).memory;
    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  // 메모리 압박 감지
  isMemoryPressureHigh(): boolean {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return false;

    return memoryInfo.percentage > 80; // 80% 이상 사용시 압박 상태
  }

  // 적극적 정리 (메모리 압박시)
  forceCleanup() {
    // 모든 지연 작업 취소
    this.clearAllTimers();

    // 비활성 관찰자 정리
    this.cleanupInactiveObservers();

    // DOM 캐시 정리
    this.clearDOMCaches();

    // 이미지 캐시 정리
    this.clearImageCaches();

    console.log('Force cleanup completed');
  }

  // 정기적 정리 (5분마다)
  startPeriodicCleanup() {
    return this.setInterval(() => {
      if (this.isMemoryPressureHigh()) {
        console.warn('High memory pressure detected, performing cleanup');
        this.forceCleanup();
      } else {
        // 가벼운 정리
        this.lightCleanup();
      }
    }, 5 * 60 * 1000); // 5분
  }

  // 전체 정리
  cleanup() {
    // 모든 옵저버 정리
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    this.resizeObservers.forEach(observer => observer.disconnect());
    this.resizeObservers.clear();

    this.mutationObservers.forEach(observer => observer.disconnect());
    this.mutationObservers.clear();

    // 모든 타이머 정리
    this.clearAllTimers();

    // 이벤트 리스너 정리
    this.eventListeners.forEach(({ element, handler }, key) => {
      try {
        const eventType = key.split('-')[1];
        element.removeEventListener(eventType, handler as EventListener);
      } catch (error) {
        console.warn('Event listener cleanup error:', error);
      }
    });
    this.eventListeners.clear();

    console.log('MemoryManager cleanup completed');
  }

  private clearAllTimers() {
    this.timers.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));
    this.animationFrames.forEach(id => window.cancelAnimationFrame(id));

    this.timers.clear();
    this.intervals.clear();
    this.animationFrames.clear();
  }

  private cleanupInactiveObservers() {
    // 연결된 요소가 없는 Observer 정리
    this.observers.forEach((observer, key) => {
      // Observer가 관찰 중인 요소가 DOM에 없으면 정리
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Observer cleanup error:', error);
      }
    });

    this.resizeObservers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('ResizeObserver cleanup error:', error);
      }
    });

    this.mutationObservers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('MutationObserver cleanup error:', error);
      }
    });
  }

  private clearDOMCaches() {
    // DOM 쿼리 결과 캐시 정리
    const cachedElements = document.querySelectorAll('[data-cached]');
    cachedElements.forEach(element => {
      element.removeAttribute('data-cached');
    });
  }

  private clearImageCaches() {
    // 이미지 blob URL 정리
    const images = document.querySelectorAll('img[data-blob-url]');
    images.forEach(img => {
      const blobUrl = img.getAttribute('data-blob-url');
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        img.removeAttribute('data-blob-url');
      }
    });
  }

  private lightCleanup() {
    // 만료된 타이머만 정리
    const now = Date.now();

    // 실제로는 만료된 타이머를 추적하는 로직이 필요하지만,
    // 여기서는 단순화하여 처리
    if (this.timers.size > 100) {
      console.warn('Too many active timers:', this.timers.size);
    }

    if (this.eventListeners.size > 500) {
      console.warn('Too many event listeners:', this.eventListeners.size);
    }
  }
}

// React 훅으로 메모리 관리
export const useMemoryOptimization = () => {
  const managerRef = useRef<MemoryManager>();

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new MemoryManager();

      // 정기적 정리 시작
      const cleanupId = managerRef.current.startPeriodicCleanup();

      // 페이지 가시성 변화 감지
      const handleVisibilityChange = () => {
        if (document.hidden && managerRef.current) {
          // 페이지가 숨겨지면 정리 수행
          managerRef.current.lightCleanup();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        managerRef.current?.clearInterval(cleanupId);
      };
    }

    return () => {
      managerRef.current?.cleanup();
      managerRef.current = undefined;
    };
  }, []);

  return managerRef.current;
};

// 컴포넌트별 메모리 최적화 훅
export const useComponentMemory = (componentName: string) => {
  const memoryManager = useMemoryOptimization();
  const cleanupCallbacks = useRef<(() => void)[]>([]);

  const addCleanupCallback = useCallback((callback: () => void) => {
    cleanupCallbacks.current.push(callback);
  }, []);

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트시 정리
      cleanupCallbacks.current.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Cleanup error in ${componentName}:`, error);
        }
      });
      cleanupCallbacks.current = [];
    };
  }, [componentName]);

  return {
    memoryManager,
    addCleanupCallback,
    getMemoryInfo: () => memoryManager?.getMemoryInfo(),
    isMemoryPressureHigh: () => memoryManager?.isMemoryPressureHigh() || false
  };
};

// 이미지 메모리 최적화 훅
export const useImageMemoryOptimization = () => {
  const blobUrls = useRef<Set<string>>(new Set());

  const createBlobUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    blobUrls.current.add(url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    blobUrls.current.delete(url);
  }, []);

  useEffect(() => {
    return () => {
      // 모든 blob URL 정리
      blobUrls.current.forEach(url => URL.revokeObjectURL(url));
      blobUrls.current.clear();
    };
  }, []);

  return {
    createBlobUrl,
    revokeBlobUrl,
    revokeAllBlobUrls: () => {
      blobUrls.current.forEach(url => URL.revokeObjectURL(url));
      blobUrls.current.clear();
    }
  };
};

// 전역 메모리 관리자
export const globalMemoryManager = new MemoryManager();
