"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { FlashSale, FlashSaleVariantInHomepage } from "./cautrucdata";
import { getApiUrl } from "@/config/api";

interface SectionFlashSaleProps {
  flashSaleProducts: FlashSale[];
  showFlashSale: boolean;
  countdown: { days: number; hours: number; minutes: number; seconds: number };
  isRefreshingFlashSale: boolean;
  refreshFlashSaleData: () => void;
  handleFlashSaleClick: (variant: FlashSaleVariantInHomepage) => void;
  getImageUrl: (url: string | string[]) => string;
  formatCurrency: (amount: number) => string;
  loading?: boolean;
}

const SectionFlashSale: React.FC<SectionFlashSaleProps> = ({
  flashSaleProducts,
  showFlashSale,
  countdown,
  isRefreshingFlashSale,
  refreshFlashSaleData,
  handleFlashSaleClick,
  getImageUrl,
  formatCurrency,
  loading,
}) => {
  if (loading) return <div>Đang tải Flash Sale...</div>;
  if (!showFlashSale || flashSaleProducts.length === 0) return null;

  return (
    <section className="py-0 pt-10 bg-white">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-40">
        <div
          className="rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl overflow-hidden relative group"
          style={{
            backgroundColor: "#e53e3e",
            backgroundImage: `url('/images/bgfs.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Background pattern - Thêm họa tiết nền */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white opacity-5 rounded-full -mr-16 sm:-mr-32 -mt-16 sm:-mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-white opacity-5 rounded-full -ml-16 sm:-ml-32 -mb-16 sm:-mb-32 animate-pulse"></div>

          {/* Header with timer - Phần tiêu đề và đếm ngược */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 sm:mb-8 relative space-y-4 lg:space-y-0">
            {/* Ảnh FLASH SALE ở góc phải - Responsive positioning */}
            <div className="absolute top-0 right-2 sm:right-10 lg:right-20 z-10">
              <Image
                src="/images/fs.png"
                alt="FLASH SALE"
                width={96}
                height={96}
                className="h-12 sm:h-16 md:h-14 lg:h-24 w-auto object-contain"
                style={{
                  animation: "flashscale 2.2s ease-in-out infinite",
                }}
              />
            </div>

            {/* Refresh button - Hidden by default, visible on hover */}
            <button
              onClick={refreshFlashSaleData}
              disabled={isRefreshingFlashSale}
              className={`absolute top-2 left-2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300 z-10 ${isRefreshingFlashSale
                ? "opacity-100 animate-spin"
                : "opacity-0 hover:opacity-100"
              }`}
              title={
                isRefreshingFlashSale
                  ? "Refreshing..."
                  : "Refresh flash sale data"
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>

            {/* Countdown Timer - Responsive */}
            <div className="bg-opacity-20 rounded-lg px-2 sm:px-4 py-2 flex flex-col items-center w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <span className="text-white font-bold text-sm sm:text-base lg:text-[20px] text-center sm:mr-1">
                  Kết thúc sau
                </span>
                <div className="flex items-center gap-1">
                  {/* Days */}
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white text-orange-500 font-bold text-sm sm:text-base lg:text-[20px] shadow">
                    {countdown.days.toString().padStart(2, "0")}
                  </span>
                  <span className="text-white font-bold text-sm sm:text-base lg:text-[20px] mx-0.5 sm:mx-1">
                    :
                  </span>
                  {/* Hours */}
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white text-orange-500 font-bold text-sm sm:text-base lg:text-[20px] shadow">
                    {countdown.hours.toString().padStart(2, "0")}
                  </span>
                  <span className="text-white font-bold text-sm sm:text-base lg:text-[20px] mx-0.5 sm:mx-1">
                    :
                  </span>
                  {/* Minutes */}
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white text-orange-500 font-bold text-sm sm:text-base lg:text-[20px] shadow">
                    {countdown.minutes.toString().padStart(2, "0")}
                  </span>
                  <span className="text-white font-bold text-sm sm:text-base lg:text-[20px] mx-0.5 sm:mx-1">
                    :
                  </span>
                  {/* Seconds */}
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white text-orange-500 font-bold text-sm sm:text-base lg:text-[20px] shadow">
                    {countdown.seconds.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products grid - Lưới sản phẩm */}
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: ".flash-sale-next",
              prevEl: ".flash-sale-prev",
            }}
            spaceBetween={10}
            loop={true}
            speed={800}
            cssMode={false}
            autoplay={{
              delay: 20000,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
              stopOnLastSlide: false,
              // Tối ưu hóa performance
              waitForTransition: false,
            }}
            // Tối ưu hóa performance
            updateOnWindowResize={false}
            observer={false}
            observeParents={false}
            // Tối ưu hóa memory
            // Tối ưu hóa rendering
            allowTouchMove={true}
            touchStartPreventDefault={false}
            breakpoints={{
              0: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 10,
              },
              640: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                slidesPerGroup: 4,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 5,
                slidesPerGroup: 5,
                spaceBetween: 20,
              },
            }}
            className="mySwiper"
          >
            {flashSaleProducts
              .flatMap((flashSale) => flashSale.flashSaleVariants)
              .map((variant) => {
                if (!variant) return null;
                const total = variant.so_luong;
                const sold = variant.da_ban;
                const remaining = total - sold;
                return (
                  <SwiperSlide key={variant.id_variant}>
                    <div
                      onClick={() =>
                        remaining > 0 ? handleFlashSaleClick(variant) : null
                      }
                      className={`bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform block relative ${
                        remaining > 0
                          ? "hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                          : "cursor-not-allowed"
                      }`}
                      data-flash-variant={variant.id_variant}
                    >
                      {/* Ảnh sản phẩm */}
                      <div className="relative pt-[100%] overflow-hidden">
                        {/* Khung Flash Sale */}
                        <Image
                          src="/images/khungfl.png"
                          alt="Khung Flash Sale"
                          width={200}
                          height={170}
                          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none \
                            w-[150px] h-[130px] sm:w-[180px] sm:h-[150px] md:w-[200px] md:h-[170px] object-contain"
                          style={{ zIndex: 10 }}
                        />
                        {/* Badge % giảm giá bên phải */}
                        {variant.phan_tram_giam_gia && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-[#E23454] text-white text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                              -{variant.phan_tram_giam_gia}%
                            </span>
                          </div>
                        )}
                        <Image
                          src={getImageUrl(variant?.product_image || "")}
                          alt={variant?.product_name || "Sản phẩm Flash Sale"}
                          fill
                          className="object-contain p-6 sm:p-8"
                        />
                        {/* Số lượng còn lại với progress bar */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[85%] flex flex-col items-center">
                          <div className="w-full h-5 sm:h-6 rounded-full bg-gray-200 flex items-center relative overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 absolute left-0 top-0 transition-all duration-500"
                              style={{
                                width: `${(remaining / total) * 100}%`,
                              }}
                            ></div>
                            <div className="w-full h-full flex items-center justify-center z-10 relative">
                              <span className="flex items-center gap-1 text-white font-semibold text-xs sm:text-sm quantity-display">
                                {remaining > 0 ? (
                                  <>
                                    <span role="img" aria-label="fire">
                                      🔥
                                    </span>
                                    <span className="hidden sm:inline">Còn</span>{" "}
                                    {remaining}/{total}{" "}
                                    <span className="hidden sm:inline">suất</span>
                                  </>
                                ) : (
                                  <>Đã hết hàng</>
                                )}
                              </span>
                              {/* Debug info - remove in production */}
                              {process.env.NODE_ENV === "development" && (
                                <div className="absolute -bottom-8 left-0 text-xs text-white px-2 py-1 rounded opacity-50">
                                  ID: {variant.id_variant?.slice(-4)} | Sold: {sold} | Total: {total}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Thông tin sản phẩm */}
                      <div className="p-3 sm:p-5">
                        <h3 className="text-sm sm:text-[14px] mb-2 line-clamp-2 min-h-[2.5rem] text-gray-800 hover:text-red-600 font-normal leading-5" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                          {variant?.product_name}
                          {variant?.variant_details && variant.variant_details.split(" - ")[0] && variant.variant_details.split(" - ")[0] !== "undefined" && (
                            <> {variant.variant_details.split(" - ")[0]}</>
                          )}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex flex-col items-start space-y-1">
                            <span className="text-base sm:text-lg font-bold text-[#E18A23]" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                              {formatCurrency(variant.gia_flash_sale)}
                            </span>
                            {variant.gia_goc &&
                              variant.gia_flash_sale !== variant.gia_goc && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm text-gray-400 line-through">
                                    {formatCurrency(variant.gia_goc)}
                                  </span>
                                </div>
                              )}
                            {variant.gia_goc &&
                              variant.gia_flash_sale &&
                              variant.gia_goc > variant.gia_flash_sale && (
                                <span className="text-xs text-green-600 font-semibold">
                                  Tiết kiệm {(
                                    variant.gia_goc - variant.gia_flash_sale
                                  ).toLocaleString()}₫
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
          </Swiper>

          {/* Custom Navigation Buttons for Flash Sale Swiper - Responsive */}
          <div className="flash-sale-prev absolute top-1/2 -left-2 sm:-left-4 lg:-left-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-gray-600 sm:w-[20px] sm:h-[20px] lg:w-[28px] lg:h-[28px]"
            >
              <path
                d="M15 19l-7-7 7-7"
                stroke="#484848"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flash-sale-next absolute top-1/2 -right-2 sm:-right-4 lg:-right-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-gray-600 sm:w-[20px] sm:h-[20px] lg:w-[28px] lg:h-[28px]"
            >
              <path
                d="M9 5l7 7-7 7"
                stroke="#484848"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionFlashSale;