"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useMemo, useCallback } from "react";

interface OptimizedSwiperProps {
  children: React.ReactNode;
  slidesPerView?: number;
  spaceBetween?: number;
  autoplay?: boolean;
  navigation?: boolean;
  loop?: boolean;
}

const OptimizedSwiper: React.FC<OptimizedSwiperProps> = ({
  children,
  slidesPerView = 3,
  spaceBetween = 20,
  autoplay = true,
  navigation = true,
  loop = true,
}) => {
  // Tối ưu hóa autoplay settings
  const autoplaySettings = useMemo(() => {
    if (!autoplay) return false;
    return {
      delay: 15000,
      disableOnInteraction: true,
      pauseOnMouseEnter: true,
      stopOnLastSlide: false,
    };
  }, [autoplay]);

  // Tối ưu hóa navigation
  const navigationSettings = useMemo(() => {
    if (!navigation) return false;
    return {
      nextEl: ".swiper-next",
      prevEl: ".swiper-prev",
    };
  }, [navigation]);

  // Tối ưu hóa breakpoints
  const breakpoints = useMemo(() => ({
    0: {
      slidesPerView: Math.min(2, slidesPerView),
      slidesPerGroup: Math.min(2, slidesPerView),
      spaceBetween: Math.min(10, spaceBetween),
    },
    640: {
      slidesPerView: Math.min(3, slidesPerView),
      slidesPerGroup: Math.min(3, slidesPerView),
      spaceBetween: Math.min(20, spaceBetween),
    },
    768: {
      slidesPerView: Math.min(4, slidesPerView),
      slidesPerGroup: Math.min(4, slidesPerView),
      spaceBetween,
    },
    1024: {
      slidesPerView: Math.min(5, slidesPerView),
      slidesPerGroup: Math.min(5, slidesPerView),
      spaceBetween,
    },
  }), [slidesPerView, spaceBetween]);

  // Tối ưu hóa modules
  const modules = useMemo(() => {
    const mods = [];
    if (navigation) mods.push(Navigation);
    if (autoplay) mods.push(Autoplay);
    return mods;
  }, [navigation, autoplay]);

  // Tối ưu hóa event handlers
  const onSwiper = useCallback((swiper: any) => {
    // Tối ưu hóa swiper instance
    if (swiper && swiper.autoplay) {
      swiper.autoplay.stop();
      setTimeout(() => {
        if (swiper.autoplay) {
          swiper.autoplay.start();
        }
      }, 1000);
    }
  }, []);

  return (
    <Swiper
      modules={modules}
      navigation={navigationSettings}
      spaceBetween={spaceBetween}
      loop={loop}
      speed={800}
      cssMode={false}
      autoplay={autoplaySettings}
      // Tối ưu hóa performance
      updateOnWindowResize={false}
      observer={false}
      observeParents={false}
      // Tối ưu hóa memory
      breakpoints={breakpoints}
      onSwiper={onSwiper}
      className="optimized-swiper"
    >
      {children}
    </Swiper>
  );
};

export default OptimizedSwiper; 