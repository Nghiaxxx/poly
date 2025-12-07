"use client";
import { useEffect, useRef, useCallback } from "react";
import Lenis from "@studio-freight/lenis";

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  const raf = useCallback((time: number) => {
    if (lenisRef.current) {
      lenisRef.current.raf(time);
    }
    rafRef.current = requestAnimationFrame(raf);
  }, []);

  useEffect(() => {
    // Lazy load Lenis chỉ khi cần thiết
    const initLenis = async () => {
      try {
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
          // Tối ưu hóa performance
          lerp: 0.1,
          syncTouch: false,
          syncTouchLerp: 0.1,
        });
        
        lenisRef.current = lenis;
        rafRef.current = requestAnimationFrame(raf);
      } catch (error) {
        console.warn('Failed to initialize smooth scroll:', error);
      }
    };

    // Chỉ khởi tạo khi user scroll
    let isInitialized = false;
    const handleScroll = () => {
      if (!isInitialized) {
        initLenis();
        isInitialized = true;
        window.removeEventListener('scroll', handleScroll);
      }
    };

    // Delay initialization để giảm blocking
    const timer = setTimeout(() => {
      if (!isInitialized) {
        window.addEventListener('scroll', handleScroll, { passive: true });
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
    };
  }, [raf]);

  return <div id="smooth-scroll">{children}</div>;
} 