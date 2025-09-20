import React, {Suspense} from 'react';
import {ErrorBoundary} from '@/components/error/ErrorBoundary';
import {PerformanceMonitor} from '@/utils/performance';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType;
  name?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

const DefaultErrorFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8 text-red-600">
    <span>Failed to load component</span>
  </div>
);

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback: FallbackComponent = DefaultFallback,
  errorFallback: ErrorFallbackComponent = DefaultErrorFallback,
  name = 'lazy-component',
  onLoad,
  onError,
}) => {
  React.useEffect(() => {
    PerformanceMonitor.mark(`${name}-mount`);
    onLoad?.();
    
    return () => {
      PerformanceMonitor.measure(`${name}-render`, `${name}-mount`);
    };
  }, [name, onLoad]);

  return (
    <ErrorBoundary
      fallback={<ErrorFallbackComponent />}
      onError={(error) => {
        console.error(`Error in ${name}:`, error);
        onError?.(error);
      }}
    >
      <Suspense fallback={<FallbackComponent />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// HOC for lazy loading components
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<LazyWrapperProps, 'children'> = {}
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <LazyWrapper {...options}>
      <Component {...props} />
    </LazyWrapper>
  );

  WrappedComponent.displayName = `WithLazyLoading(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WrappedComponent;
}

// Optimized list component with virtual scrolling
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey,
  className = '',
  onScroll,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={getItemKey(item, visibleStart + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized image component with lazy loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  lazy = true,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState<string>(lazy ? '' : src);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!lazy) return;

    let observer: IntersectionObserver | undefined;

    const currentImg = imgRef.current;

    if (currentImg && !imageSrc) {
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setImageSrc(src);
                observer!.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1 }
        );

        observer.observe(currentImg);
      } else {
        setImageSrc(src);
      }
    }

    return () => {
      if (observer && currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, [src, imageSrc, lazy]);

  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback(() => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  }, [fallbackSrc, imageSrc, onError]);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

// Memoized components for better performance
export const MemoizedCard = React.memo<{
  title: string;
  children: React.ReactNode;
  className?: string;
}>(({ title, children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {children}
  </div>
));

export const MemoizedList = React.memo<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  getItemKey: (item: any, index: number) => string | number;
  className?: string;
}>(({ items, renderItem, getItemKey, className = '' }) => (
  <div className={className}>
    {items.map((item, index) => (
      <div key={getItemKey(item, index)}>
        {renderItem(item, index)}
      </div>
    ))}
  </div>
));
