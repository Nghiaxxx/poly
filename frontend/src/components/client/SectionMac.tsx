import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Product } from "./cautrucdata";

interface SectionMacProps {
  products: Product[];
  getPriceRange: any;
  formatCurrency: (amount: number) => string;
  getImageUrl: (url: string | string[]) => string;
  loading?: boolean;
}

const SectionMac: React.FC<SectionMacProps> = ({
  products,
  getPriceRange,
  formatCurrency,
  getImageUrl,
  loading,
}) => {
  if (loading) return <div>Đang tải Mac...</div>;
  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-40">
        <div className="section-header flex justify-between items-center mb-6 bg-white">
          <h2 className="section-title text-2xl font-bold text-black">Mac</h2>
          <Link
            href="/categories/681d97db2a400db1737e6de5"
            className="section-link text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center space-x-1 group"
          >
            <span>Xem tất cả</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
        <div className="relative group bg-white">
          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".mac-next",
              prevEl: ".mac-prev",
            }}
            spaceBetween={20}
            slidesPerView={1}
            slidesPerGroup={1}
            loop={true}
            speed={800}
            breakpoints={{
              320: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 15,
              },
              480: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 15,
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
            }}
            className="mySwiper bg-white"
          >
            {products.map((product: Product) => (
              <SwiperSlide key={product._id}>
                <div className="relative">
                  {/* Discount Badge - Positioned to hug the left edge */}
                  {(product.khuyen_mai ?? 0) > 0 && (
                    <div className="absolute -top-0 -left-1 z-20 w-[70px] h-[28px] sm:w-[81px] sm:h-[32px]">
                      <Image
                        src="/images/spanfl.png"
                        alt="Giảm giá"
                        width={81}
                        height={32}
                        className="w-full h-full object-contain"
                      />
                      <span
                        className="absolute top-1/2 text-white left-1/2 text-[10px] sm:text-xs font-bold"
                        style={{
                          transform: "translate(-50%, -50%)",
                          fontSize: "10px",
                          fontWeight: 700,
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                          paddingBottom: "3px",
                        }}
                      >
                        Giảm {product.khuyen_mai}%
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/product/${product._id}`}
                    className="bg-white overflow-hidden border transition-all duration-300 group relative w-full h-[320px] sm:w-[47vw] sm:h-[400px] md:w-[28vw] md:h-[360px] lg:w-[285px] lg:h-[410px] block rounded-2xl"
                  >
                    {/* Installment Badge */}
                    <div className="absolute top-1 right-2 z-10 w-[81px] h-[30px]">
                      <Image
                        src="/images/tragop.png"
                        alt="Trả góp 0%"
                        width={81}
                        height={30}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Product Image */}
                    <div className="relative flex items-center justify-center pt-0 bg-white">
                      <Image
                        src={getImageUrl(
                          Array.isArray(product.hinh)
                            ? product.hinh[0]
                            : product.hinh
                        )}
                        alt={product.TenSP}
                        width={280}
                        height={280}
                        className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] lg:w-[280px] lg:h-[280px] object-contain"
                      />
                    </div>
                    {/* Product Info */}
                    <div className="flex flex-col pl-4">
                      <h3 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold mb-2 sm:mb-3 text-black min-h-[2rem] sm:min-h-[2.5rem]" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                        {product.TenSP}
                        {product.variants &&
                          product.variants.length > 0 &&
                          product.variants[0].dung_luong &&
                          ` ${product.variants[0].dung_luong}`}
                      </h3>
                      <div className="flex gap-2 mb-1">
                        <span className="text-[14px] sm:text-[15px] lg:text-[16px] font-bold text-[#0066D6]">
                          {(() => {
                            const priceRange = getPriceRange(product.variants);
                            if (priceRange) {
                              return formatCurrency(priceRange.minPrice);
                            }
                            const price =
                              typeof product.Gia === "number" &&
                              !isNaN(product.Gia)
                                ? product.Gia
                                : 0;
                            const discount =
                              typeof product.khuyen_mai === "number" &&
                              !isNaN(product.khuyen_mai)
                                ? product.khuyen_mai
                                : 0;
                            return formatCurrency(price * (1 - discount / 100));
                          })()}
                        </span>
                        {(() => {
                          const priceRange = getPriceRange(product.variants);
                          if (
                            priceRange &&
                            priceRange.maxPrice > priceRange.minPrice
                          ) {
                            return (
                              <span className="text-gray-400 line-through text-[14px]">
                                {formatCurrency(priceRange.maxPrice)}
                              </span>
                            );
                          }
                          const originalPrice =
                            typeof product.Gia === "number" &&
                            !isNaN(product.Gia)
                              ? product.Gia
                              : 0;
                          if (product.khuyen_mai && originalPrice > 0) {
                            return (
                              <span className="text-gray-400 line-through text-sm">
                                {formatCurrency(originalPrice)}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="mac-prev absolute top-1/2 -left-4 sm:-left-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          </div>
          <div className="mac-next absolute top-1/2 -right-4 sm:-right-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionMac;