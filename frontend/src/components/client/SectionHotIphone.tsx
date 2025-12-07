import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { Product, Banner } from "./cautrucdata";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

interface SectionHotIphoneProps {
  hotIphones: Product[];
  getImageUrl: (url: string | string[]) => string;
  formatCurrency: (amount: number) => string;
  specialBanners: Banner[];
  loading?: boolean;
}

const SectionHotIphone: React.FC<SectionHotIphoneProps> = ({
  hotIphones,
  getImageUrl,
  formatCurrency,
  specialBanners,
  loading,
}) => {
  if (loading) return <div>Đang tải sản phẩm nổi bật iPhone...</div>;
  return (
    <section className="bg-white">
      <div className="relative w-full max-w-[1278px] mx-auto px-4 sm:px-6 md:px-8 pt-10 lg:pt-[90px]">
        {/* Ảnh điện thoại ở góc phải */}
        <Image
          src="/images/anhcuacam.png"
          alt="Điện thoại kế bên số 1"
          width={558}
          height={314}
          className="hidden lg:block absolute top-0 right-10 z-30 h-[314px] max-w-[558px] object-contain"
        />
      </div>
      {/* Phần nền cam và nội dung chính */}
      <section
        className="relative mx-auto w-full max-w-[1278px] bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: "url('/images/maucam.png')" }}
      >
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 px-4 sm:px-6 md:px-8 py-10 lg:py-[90px]">
          {/* Slide sản phẩm nổi bật */}
          <div className="w-full lg:w-[668px] flex flex-col items-start mb-0 lg:ml-[30px]">
            <div
              className="relative flex items-center justify-center text-center w-full"
              style={{
                backgroundImage: "url('/images/motcam.png')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                minHeight: 120,
                width: "100%",
              }}
            >
              <p className="w-full text-left pl-14 sm:pl-8 md:pl-[90px] relative z-10">
                <b className="text-white text-[18px] sm:text-[22px] font-normal">
                  CHỈ CÓ TẠI POLYSMART{" "}
                </b>
                <br />
                <span className="text-white text-[24px] sm:text-[28px] md:text-[36px] font-bold">
                  MÁY SIÊU TỐT - GIÁ SIÊU HỜI
                </span>
              </p>
            </div>

            <div className="bg-white rounded-2xl mt-10 p-4 sm:p-6 shadow-xl w-full">
              <div className="flex items-center mb-6">
                <h2 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold mb-2 sm:mb-3 text-black min-h-[2rem] sm:min-h-[2.5rem]">
                  iPhone bán chạy nhất
                </h2>
              </div>
              <div className="relative group">
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    nextEl: ".hot-iphone-next",
                    prevEl: ".hot-iphone-prev",
                  }}
                  spaceBetween={16}
                  loop={true}
                  breakpoints={{
                    320: { slidesPerView: 2 },
                    640: { slidesPerView: 3 },
                    1024: { slidesPerView: 3 },
                  }}
                  className="w-full"
                >
                  {hotIphones.map((product) => (
                    <SwiperSlide key={product._id}>
                      <Link
                        href={`/product/${product._id}`}
                        className="block bg-white shadow-md hover:shadow-xl transition duration-300"
                      >
                        <div className="relative flex items-center justify-center pt-10 bg-white">
                          <div className="relative w-[170px] h-[140px] flex items-center justify-center">
                            <Image
                              src={getImageUrl(
                                Array.isArray(product.hinh)
                                  ? product.hinh[0]
                                  : product.hinh
                              )}
                              alt={product.TenSP}
                              className="w-[200px] h-[180px] object-contain"
                              width={170}
                              height={140}
                            />
                          </div>
                          {product.khuyen_mai && (
                            <span className="absolute top-2 right-2 bg-[#FF7337] text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                              -{product.khuyen_mai}%
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] sm:text-[12px] lg:text-[14px] font-bold mb-2 sm:mb-3 text-black min-h-[2rem] sm:min-h-[2.5rem]" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                            {product.TenSP}
                          </p>
                          {product.variants && product.variants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {product.variants
                                .filter(
                                  (v) => v.mau === product.variants![0].mau
                                )
                                .map((variant, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0 text-[10px] border border-gray-300 bg-gray-50 text-gray-700 rounded-md"
                                  >
                                    {variant.dung_luong}
                                  </span>
                                ))}
                            </div>
                          )}
                          {/* Giá */}
                          {(() => {
                            const variants =
                              product.variants?.filter(
                                (v) => v.mau === product.variants?.[0]?.mau
                              ) || [];
                            if (!variants.length) return null;
                            const minPrice = Math.min(
                              ...variants.map((v) => v.gia)
                            );
                            const hasDiscount = !!product.khuyen_mai;
                            const salePrice = hasDiscount
                              ? minPrice * (1 - (product.khuyen_mai || 0) / 100)
                              : minPrice;
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-[#FF763B]">
                                  {formatCurrency(salePrice)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-gray-400 line-through">
                                    {formatCurrency(minPrice)}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <div className="bg-gray-100 rounded mt-3 p-2 text-[10px] text-gray-600 leading-4 w-fit">
                            <p>Hỗ trợ trả góp 0%</p>
                            <p>Thu cũ đổi mới</p>
                            <p>Ưu đãi khách hàng thân thiết</p>
                          </div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="hot-iphone-prev absolute top-1/2 -left-4 sm:-left-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-gray-600"
                  >
                    <path
                      d="M15 19l-7-7 7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="hot-iphone-next absolute top-1/2 -right-4 sm:-right-8 -translate-y-1/2 z-10 bg-white/70 rounded-full p-1 sm:p-2 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-gray-600"
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Banner slide */}
          <div className="w-full lg:w-[455px] -mt-5 lg:mt-[150px] lg:mr-[30px]">
            <Swiper
              modules={[Autoplay]}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              loop={true}
              className="w-full h-[400px] sm:h-[500px] md:h-[550px] lg:h-[505px]"
            >
              {(specialBanners || []).map((banner, idx) => (
                <SwiperSlide key={idx}>
                  <div className="flex items-center justify-center w-full h-full rounded-2xl overflow-hidden shadow-xl bg-white">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </section>
  );
};

export default SectionHotIphone;