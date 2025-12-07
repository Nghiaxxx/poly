"use client";
import Image from "next/image";

export interface Banner {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
}

interface SectionBannerProps {
  banners: Banner[];
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
}

const SectionBanner: React.FC<SectionBannerProps> = ({
  banners,
  currentSlide,
  setCurrentSlide,
}) => {
  if (!banners || banners.length === 0) return null;
  return (
    <div className="w-screen overflow-hidden pt-16">
      <div
        className="relative w-full group overflow-hidden aspect-[1920/720]"
        style={{ minHeight: 130, maxHeight: 425 }}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{
            width: `${banners.length * 100}%`,
            transform: `translateX(-${currentSlide * (100 / banners.length)}%)`,
          }}
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="w-full flex-shrink-0 relative h-full"
              style={{ width: `${100 / banners.length}%` }}
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            </div>
          ))}
        </div>
        {/* Nút chuyển slide banner */}
        <button
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 rounded-full p-1 sm:p-2 shadow z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={() =>
            setCurrentSlide(
              currentSlide === 0 ? banners.length - 1 : currentSlide - 1
            )
          }
          aria-label="Previous slide"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="text-gray-600 sm:w-[28px] sm:h-[28px]"
          >
            <path
              d="M15 19l-7-7 7-7"
              stroke="#484848"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 rounded-full p-1 sm:p-2 shadow z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={() =>
            setCurrentSlide(
              currentSlide === banners.length - 1 ? 0 : currentSlide + 1
            )
          }
          aria-label="Next slide"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="text-gray-600 sm:w-[28px] sm:h-[28px]"
          >
            <path
              d="M9 5l7 7-7 7"
              stroke="#484848"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Dots nằm đè lên banner */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full mx-1 ${
                idx === currentSlide ? "bg-blue-600" : "bg-gray-300"
              }`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionBanner;
