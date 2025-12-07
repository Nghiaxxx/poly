// React performance optimization utilities

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Tối ưu hóa event handlers
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  return useCallback(callback, deps);
}

// Tối ưu hóa expensive calculations
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: any[]
): T {
  return useMemo(factory, deps);
}

// Tối ưu hóa refs
export function useOptimizedRef<T>(initialValue: T) {
  return useRef<T>(initialValue);
}

// Tối ưu hóa effect cleanup
export function useOptimizedEffect(
  effect: () => void | (() => void),
  deps: any[]
) {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}

// Tối ưu hóa component rendering
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic nếu cần
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}

// Tối ưu hóa list rendering
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
      },
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
}

// Tối ưu hóa image loading
export function useOptimizedImage(src: string, fallback?: string) {
  const [imageSrc, setImageSrc] = useState(fallback || src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setError(false);
    };
    
    img.onerror = () => {
      if (fallback) {
        setImageSrc(fallback);
        setIsLoading(false);
      } else {
        setError(true);
        setIsLoading(false);
      }
    };
  }, [src, fallback]);

  return { imageSrc, isLoading, error };
}

// Tối ưu hóa debounced state
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSetValue = useCallback((newValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setValue(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, debouncedSetValue];
}

// Tối ưu hóa intersection observer
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
} 