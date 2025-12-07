// Performance optimization utilities

// Debounce function để giảm số lần gọi function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function để giới hạn tần suất gọi function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy load component
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  // Note: Use React.lazy() directly in components
  return importFunc;
}

// Intersection Observer để lazy load
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  return new IntersectionObserver(callback, options);
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalImages = [
    '/images/bgfs.png',
    '/images/fs.png',
    '/images/khungfl.png'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Optimize images loading
export function optimizeImageLoading() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.classList.remove('lazy');
        imageObserver?.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver?.observe(img));
}

// Reduce layout thrashing
export function batchDOMUpdates(updates: (() => void)[]) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// Memory management
export function cleanupEventListeners() {
  // Cleanup global event listeners when component unmounts
  return () => {
    // Remove any global event listeners
  };
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => void) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
  } else {
    fn();
  }
} 