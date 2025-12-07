'use client';

import { useEffect, useState } from 'react';

interface FontOptimizerProps {
  children: React.ReactNode;
}

/**
 * FontOptimizer Component
 * Tối ưu hóa việc load font để tránh chặn render và cải thiện LCP
 */
export default function FontOptimizer({ children }: FontOptimizerProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Kiểm tra xem font đã được load chưa
    const checkFontsLoaded = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setFontsLoaded(true);
        });
      } else {
        // Fallback cho các trình duyệt không hỗ trợ Font Loading API
        setTimeout(() => {
          setFontsLoaded(true);
        }, 100);
      }
    };

    // Kiểm tra font loading
    checkFontsLoaded();

    // Thêm class để tối ưu hóa CSS
    document.documentElement.classList.add('font-loading');
    
    if (fontsLoaded) {
      document.documentElement.classList.remove('font-loading');
      document.documentElement.classList.add('font-loaded');
    }
  }, [fontsLoaded]);

  // Preload critical fonts
  useEffect(() => {
    // Preload Inter font từ Google Fonts
    const interLink = document.createElement('link');
    interLink.rel = 'preload';
    interLink.as = 'font';
    interLink.type = 'font/woff2';
    interLink.crossOrigin = 'anonymous';
    interLink.href = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
    document.head.appendChild(interLink);

    // Preload Satoshi font local
    const satoshiLink = document.createElement('link');
    satoshiLink.rel = 'preload';
    satoshiLink.as = 'font';
    satoshiLink.type = 'font/woff2';
    satoshiLink.href = '/fonts/Satoshi-Regular.woff2';
    document.head.appendChild(satoshiLink);

    // Cleanup - kiểm tra element có tồn tại trước khi xóa
    return () => {
      // Kiểm tra và xóa interLink nếu còn tồn tại
      if (interLink && interLink.parentNode === document.head) {
        try {
          document.head.removeChild(interLink);
        } catch (error) {
          // Element đã bị xóa hoặc không còn trong DOM
          console.warn('Failed to remove interLink:', error);
        }
      }
      
      // Kiểm tra và xóa satoshiLink nếu còn tồn tại
      if (satoshiLink && satoshiLink.parentNode === document.head) {
        try {
          document.head.removeChild(satoshiLink);
        } catch (error) {
          // Element đã bị xóa hoặc không còn trong DOM
          console.warn('Failed to remove satoshiLink:', error);
        }
      }
    };
  }, []);

  return (
    <div className={`font-optimizer ${fontsLoaded ? 'fonts-loaded' : 'fonts-loading'}`}>
      {children}
    </div>
  );
} 