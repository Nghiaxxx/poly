"use client";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import PetMascot from "@/components/client/PetMascot";
import { Product } from "@/components/client/cautrucdata";

interface SectionRecommendProps {
  user: any;
  recommendedProducts: Product[];
  aiAdvice: string;
  loadingRecommend: boolean;
  getImageUrl: (url: string | string[]) => string;
}

const SectionRecommend: React.FC<SectionRecommendProps> = ({
  user,
  recommendedProducts,
  aiAdvice,
  loadingRecommend,
  getImageUrl,
}) => {
  if (!user || !user._id || recommendedProducts.length === 0) return null;
  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-40">
        <div className="section-header flex justify-between items-center mb-6 bg-white">
          <PetMascot message={aiAdvice || "Xin chào, đây là gợi ý cho bạn!"} />
        </div>
        <div className="relative group bg-white">
          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".recommend-next",
              prevEl: ".recommend-prev",
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
            {recommendedProducts.map((product) => (
              <SwiperSlide key={product._id}>
                <div className="relative">
                  {/* Discount Badge - Positioned to hug the left edge */}
                  {(product.khuyen_mai ?? 0) > 0 && (
                    <div className="absolute -top-0 -left-1 z-20 w-[70px] h-[28px] sm:w-[81px] sm:h-[32px]">
                      <img
                        src="/images/spanfl.png"
                        alt="Giảm giá"
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
                    className="
                        bg-white overflow-hidden border transition-all duration-300 group relative
                        w-full h-[320px]             
                        sm:w-[47vw] sm:h-[400px]     
                        md:w-[28vw] md:h-[360px]      
                        lg:w-[285px] lg:h-[410px]       
                        block rounded-2xl
                      "
                  >
                    {/* Installment Badge */}
                    <div className="absolute top-1 right-2 z-10 w-[70px] h-[26px] sm:w-[81px] sm:h-[30px]">
                      <Image
                        src="/images/tragop.png"
                        alt="Trả góp 0%"
                        width={81}
                        height={30}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Product Image */}
                    <div className="relative flex items-center justify-center pt-10 bg-white">
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
                        fetchPriority="high"
                      />
                    </div>
                    {/* Product Info */}
                    <div className="flex flex-col pl-4">
                      <h3 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold mb-2 sm:mb-3 text-black min-h-[2rem] sm:min-h-[2.5rem]">
                        {product.TenSP}
                        {product.variants &&
                          product.variants.length > 0 &&
                          product.variants[0].dung_luong &&
                          ` ${product.variants[0].dung_luong}`}
                      </h3>
                    </div>
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="recommend-prev absolute top-1/2 -left-4 sm:-left-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          <div className="recommend-next absolute top-1/2 -right-4 sm:-right-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

export default SectionRecommend;