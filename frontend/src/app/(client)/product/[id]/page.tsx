"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ProductVariant, Product } from "@/components/client/cautrucdata";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/store/cartSlice";
import { RootState } from "@/store";
import { getApiUrl, getBaseUrl } from "@/config/api"; // Import getApiUrl
import ProductReviews from "@/components/client/ProductReviews"; //component của  ThanhHoai
import { trackUserEvent } from "@/services/productService";
import ChatbotAI from "@/components/client/ChatbotAI";
import { showAddToCartSuccess, showOutOfStockAlert, showMaxQuantityAlert, showErrorAlert, showWarningAlert } from "@/utils/sweetAlert";
import StarRating from "@/components/client/StarRating";

// Interface for FlashSale data
interface FlashSaleVariantInHomepage {
  id_variant: string;
  gia_flash_sale: number;
  phan_tram_giam_gia?: number;
  so_luong?: number;
  da_ban?: number;
}
interface FlashSale {
  flashSaleVariants: FlashSaleVariantInHomepage[];
}

function getImageUrl(url: string | string[] | undefined | null) {
  if (!url) return "/images/no-image.png";
  if (Array.isArray(url)) url = url[0] || "";
  if (!url) return "/images/no-image.png";
  if (typeof url !== "string") return "/images/no-image.png";
  if (url.startsWith("http")) return url;
      return `${getBaseUrl()}/images/${url.replace(/^\/?images\//, "")}`;
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const variantId = searchParams.get("variantId");
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"thongso" | "baiviet">("thongso");
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const thumbVideoRef = useRef<HTMLVideoElement>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart.items);
  const [isClient, setIsClient] = useState(false);
  const [flashSalePrice, setFlashSalePrice] = useState<number | null>(null); // State for flash sale price
  const user = useSelector((state: RootState) => state.user.user);
  const [flashSaleVariants, setFlashSaleVariants] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchProductAndFlashSale = async () => {
      try {
        // 1. Fetch product details
        const productRes = await fetch(
          getApiUrl(`products/${id}`)
        );
        const productData = await productRes.json();
        setProduct(productData);

        if (!productData.variants || productData.variants.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Fetch active flash sales
        const flashSaleRes = await fetch(getApiUrl("flashsales/active"));
        const flashSaleData = await flashSaleRes.json();
        const activeFlashSales: FlashSale[] = Array.isArray(flashSaleData.data)
          ? flashSaleData.data
          : [];

        // Create a map for quick lookup of flash sale variants
        const flashSaleVariantsMap = new Map<string, number>();
        activeFlashSales.forEach((sale) => {
          sale.flashSaleVariants.forEach((variant) => {
            flashSaleVariantsMap.set(
              variant.id_variant,
              variant.gia_flash_sale
            );
          });
        });

        let currentVariant: ProductVariant | null = null;

        // 3. Find the variant to display based on priority
        // Priority 1: Find variant from URL (nếu có)
        if (variantId) {
          currentVariant =
            productData.variants.find(
              (v: ProductVariant) => v._id === variantId
            ) || null;
        }

        // Priority 2: Fallback to the first variant
        currentVariant = currentVariant || productData.variants[0];

        // 4. Set the selected variant and its price
        setSelectedVariant(currentVariant);

        // Chỉ set flash sale price nếu có active flash sales và variant hiện tại có trong flash sale VÀ còn hàng
        if (activeFlashSales.length > 0 && currentVariant && flashSaleVariantsMap.has(currentVariant._id)) {
          const flashSalePrice = flashSaleVariantsMap.get(currentVariant._id);
          
          // Tìm thông tin flash sale variant để kiểm tra số lượng
          const flashSaleVariant = activeFlashSales
            .flatMap((sale) => sale.flashSaleVariants)
            .find((variant) => variant.id_variant === currentVariant._id);
          
          const flashSaleAvailable =
            (flashSaleVariant?.so_luong ?? 0) - (flashSaleVariant?.da_ban ?? 0);
          
          setFlashSalePrice(
            flashSalePrice && 
            flashSalePrice > 0 && 
            flashSaleAvailable > 0 
              ? flashSalePrice 
              : null
          );
        } else {
          setFlashSalePrice(null);
        }

        // Set flash sale variants only for this product
        const productFlashSaleVariants = activeFlashSales
          .flatMap((sale) => sale.flashSaleVariants)
          .filter((variant) => 
            productData.variants.some((v: ProductVariant) => v._id === variant.id_variant)
          );
        setFlashSaleVariants(productFlashSaleVariants);

        // 5. Fetch rating statistics
        const ratingRes = await fetch(getApiUrl(`reviews/stats?ma_san_pham=${id}`));
        const ratingData = await ratingRes.json();
        setRatingStats(ratingData);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchProductAndFlashSale();
  }, [id, variantId, user]);

  // Refetch flash sale price when variant changes
  useEffect(() => {
    const checkFlashSalePrice = async () => {
      if (!selectedVariant) return;

      try {
        const flashSaleRes = await fetch(getApiUrl("flashsales/active"));
        const flashSaleData = await flashSaleRes.json();
        const activeFlashSales: FlashSale[] = Array.isArray(flashSaleData.data)
          ? flashSaleData.data
          : [];

        let price: number | null = null;
        let flashSaleVariant = null;
        
        // Chỉ tìm flash sale nếu có active flash sales
        if (activeFlashSales.length > 0) {
          for (const sale of activeFlashSales) {
            const saleVariant = sale.flashSaleVariants.find(
              (v) => v.id_variant === selectedVariant._id
            );
            if (saleVariant) {
              price = saleVariant.gia_flash_sale;
              flashSaleVariant = saleVariant;
              break;
            }
          }
        }
        
        // Kiểm tra số lượng hàng còn lại trong flash sale
        const flashSaleAvailable =
          (flashSaleVariant?.so_luong ?? 0) - (flashSaleVariant?.da_ban ?? 0);
        
        // Chỉ set flash sale price nếu có active flash sales, có giá hợp lệ VÀ còn hàng
        setFlashSalePrice(
          activeFlashSales.length > 0 && 
          price && 
          price > 0 && 
          flashSaleAvailable > 0 
            ? price 
            : null
        );
        
        // Cập nhật flashSaleVariants với thông tin mới nhất cho tất cả variants của sản phẩm
        const productFlashSaleVariants = activeFlashSales
          .flatMap((sale) => sale.flashSaleVariants)
          .filter((variant) => 
            product?.variants?.some((v: ProductVariant) => v._id === variant.id_variant)
          );
        setFlashSaleVariants(productFlashSaleVariants);
      } catch (error) {

        setFlashSalePrice(null);
        setFlashSaleVariants([]);
      }
    };

    checkFlashSalePrice();
  }, [selectedVariant, product]);

  // Auto refresh flash sale status every minute
  useEffect(() => {
    const refreshFlashSaleStatus = async () => {
      if (!selectedVariant) return;

      try {
        const flashSaleRes = await fetch(getApiUrl("flashsales/active"));
        const flashSaleData = await flashSaleRes.json();
        const activeFlashSales: FlashSale[] = Array.isArray(flashSaleData.data)
          ? flashSaleData.data
          : [];

        let price: number | null = null;
        let flashSaleVariant = null;
        
        // Chỉ tìm flash sale nếu có active flash sales
        if (activeFlashSales.length > 0) {
          for (const sale of activeFlashSales) {
            const saleVariant = sale.flashSaleVariants.find(
              (v) => v.id_variant === selectedVariant._id
            );
            if (saleVariant) {
              price = saleVariant.gia_flash_sale;
              flashSaleVariant = saleVariant;
              break;
            }
          }
        }
        
        // Kiểm tra số lượng hàng còn lại trong flash sale
        const flashSaleAvailable =
          (flashSaleVariant?.so_luong ?? 0) - (flashSaleVariant?.da_ban ?? 0);
        
        // Chỉ set flash sale price nếu có active flash sales, có giá hợp lệ VÀ còn hàng
        setFlashSalePrice(
          activeFlashSales.length > 0 && 
          price && 
          price > 0 && 
          flashSaleAvailable > 0 
            ? price 
            : null
        );
        
        // Cập nhật flashSaleVariants với thông tin mới nhất cho tất cả variants của sản phẩm
        const productFlashSaleVariants = activeFlashSales
          .flatMap((sale) => sale.flashSaleVariants)
          .filter((variant) => 
            product?.variants?.some((v: ProductVariant) => v._id === variant.id_variant)
          );
        setFlashSaleVariants(productFlashSaleVariants);
      } catch (error) {

        setFlashSalePrice(null);
        setFlashSaleVariants([]);
      }
    };

    // Refresh immediately
    refreshFlashSaleStatus();

    // Set up interval to refresh every minute
    const interval = setInterval(refreshFlashSaleStatus, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [selectedVariant, product]);

  useEffect(() => {
    // Fetch tất cả sản phẩm để lọc mua kèm
            fetch(getApiUrl('products?an_hien=true'))
      .then((res) => res.json())
      .then((data) => setAllProducts(data));
  }, []);

  // Thêm useEffect để theo dõi khi variant thay đổi
  useEffect(() => {
    // Reset selected image index khi đổi variant
    if (product?.video && product.video.length > 0) {
      setSelectedImageIndex(-1); // Giữ video nếu sản phẩm có video
    } else {
      setSelectedImageIndex(0); // Reset về ảnh đầu tiên nếu không có video
    }
  }, [selectedVariant, product]);

  // Đảm bảo video tự động phát khi được hiển thị
  useEffect(() => {
    if (
      selectedImageIndex === -1 &&
      product?.video &&
      product.video.length > 0
    ) {
      const videoElement = document.querySelector("video");
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play();
      }
    }
  }, [selectedImageIndex, product]);

  // Đồng bộ thời gian phát giữa hai video
  useEffect(() => {
    const main = mainVideoRef.current;
    const thumb = thumbVideoRef.current;
    if (!main || !thumb) return;

    // Khi video lớn play/pause/seek thì cập nhật cho thumbnail
    const syncTime = () => {
      if (Math.abs(main.currentTime - thumb.currentTime) > 0.1) {
        thumb.currentTime = main.currentTime;
      }
    };
    const syncPlay = () => thumb.play();
    const syncPause = () => thumb.pause();

    main.addEventListener("timeupdate", syncTime);
    main.addEventListener("play", syncPlay);
    main.addEventListener("pause", syncPause);
    main.addEventListener("seeking", syncTime);

    // Khi unmount
    return () => {
      main.removeEventListener("timeupdate", syncTime);
      main.removeEventListener("play", syncPlay);
      main.removeEventListener("pause", syncPause);
      main.removeEventListener("seeking", syncTime);
    };
  }, [selectedImageIndex, product]);

  // Hàm tính tổng tiền
  const calculateTotal = () => {
    let total = price || 0;
    accessories.forEach((acc) => {
      if (selectedAccessories.includes(acc._id)) {
        total += acc.gia ?? acc.variants?.[0]?.gia ?? 0;
      }
    });
    return total;
  };

  // Hàm xử lý chọn/bỏ chọn sản phẩm
  const toggleAccessory = (accessoryId: string) => {
    if (selectedAccessories.includes(accessoryId)) {
      setSelectedAccessories((prev) => prev.filter((id) => id !== accessoryId));
    } else {
      setSelectedAccessories((prev) => [...prev, accessoryId]);
    }
  };

  // --- TRACKING: Gửi event khi user xem sản phẩm ---
  useEffect(() => {
    if (!product || !user || !user._id || !id) return;
    // Chỉ gửi tracking khi product đã load thành công và user đã đăng nhập
    (async () => {
      try {
        await trackUserEvent("view_product", id as string, user._id);
      } catch (err) {
        // Không cần xử lý lỗi tracking
      }
    })();
  }, [product, user, id]);
  // --- END TRACKING ---

  if (!isClient) return null;

  if (loading) return <div className="text-center py-20">Đang tải...</div>;
  if (!product)
    return (
      <div className="text-center py-20 text-red-500">
        Không tìm thấy sản phẩm
      </div>
    );

  // Lấy các variant khác nhau về dung lượng, màu sắc (lọc giá trị rỗng/null)
  const storages = Array.from(
    new Set((product.variants?.map((v) => v.dung_luong) || []).filter(Boolean))
  );
  const colors = Array.from(
    new Set((product.variants?.map((v) => v.mau) || []).filter(Boolean))
  );
  const images =
    selectedVariant?.hinh && Array.isArray(selectedVariant.hinh)
      ? selectedVariant.hinh
      : Array.isArray(product.hinh)
      ? product.hinh
      : product.hinh
      ? [product.hinh]
      : ["/images/no-image.png"];

  // Giá gốc và giá khuyến mãi
  const regularPrice = selectedVariant?.gia || 0;
  
  // Kiểm tra xem variant hiện tại có trong flash sale không
  const currentVariantFlashSale = flashSaleVariants.find(
    (v) => v.id_variant === selectedVariant?._id
  );
  
  // Kiểm tra số lượng flash sale còn lại
  const flashSaleAvailable = currentVariantFlashSale 
    ? currentVariantFlashSale.so_luong - currentVariantFlashSale.da_ban 
    : 0;

  // Flash sale chỉ active khi có variant trong flash sale VÀ có flash sale price hợp lệ VÀ còn hàng
  const isFlashSaleActive = currentVariantFlashSale && 
                           flashSalePrice !== null && 
                           flashSalePrice > 0 && 
                           flashSaleVariants.length > 0 &&
                           flashSaleAvailable > 0;
  

  

  
  const price = isFlashSaleActive ? flashSalePrice : regularPrice;
  const originPrice =
    isFlashSaleActive
      ? regularPrice
      : selectedVariant?.gia_goc || regularPrice;

  // Hiển thị tên sản phẩm kèm variant
  const variantName = selectedVariant
    ? [selectedVariant.dung_luong].filter(Boolean).join(" - ")
    : "";

  // Lọc sản phẩm mua kèm theo id_danhmuc
  const accessories = allProducts.filter(
    (p) => p.id_danhmuc === "681d97db2a400db1737e6de7" && p._id !== product?._id
  );

  const mainVideo =
    product?.video && product.video.length > 0 ? product.video[0] : null;

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    if (index === -1 && product?.video && product.video.length > 0) {
      const videoElement = document.querySelector("video");
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play();
      }
    }
  };
  const SpecSection = () => {
    if (!product?.thong_so_ky_thuat) return null;

    // Kiểm tra xem có thông số kỹ thuật nào không
    const hasSpecs = Object.values(product.thong_so_ky_thuat).some(
      (value) => value !== null && value !== undefined && value !== ""
    );
    if (!hasSpecs) return null;

    const thongso = product.thong_so_ky_thuat;

    const specs = [
      { label: "Công nghệ màn hình", value: thongso.Cong_nghe_man_hinh },
      { label: "Hệ điều hành", value: thongso.He_dieu_hanh },
      { label: "Tính năng camera", value: thongso.Tinh_nang_camera },
      { label: "Kết nối", value: thongso.Ket_noi },
      { label: "Tiện ích khác", value: thongso.Tien_ich_khac },
      { label: "CPU", value: thongso.CPU },
      { label: "GPU", value: thongso.GPU },
      { label: "Camera", value: thongso.Camera },
      { label: "Kích thước màn hình", value: thongso.Kich_thuoc_man_hinh },
      { label: "Kích thước, khối lượng", value: thongso.Kich_thuoc_khoi_luong },
      { label: "Độ phân giải", value: thongso.Do_phan_giai },
    ].filter(
      (spec) =>
        spec.value !== null &&
        spec.value !== undefined &&
        !(typeof spec.value === "string" && spec.value.trim() === "") &&
        !(Array.isArray(spec.value) && (spec.value as any[]).length === 0)
    );

    // Nếu không có thông số nào, return null
    if (specs.length === 0) return null;

    const renderValue = (val: any) => {
      if (Array.isArray(val)) {
        return (
          <div className="flex flex-col gap-1">
            {val.map((item, idx) => (
              <span key={idx}>{item}</span>
            ))}
          </div>
        );
      }
      return <span>{val}</span>;
    };

    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1200px] flex flex-col gap-0 px-4 sm:px-6">
          {specs.map((spec, idx) => (
            <div
              key={spec.label}
              className={`flex flex-col sm:flex-row items-start sm:items-stretch px-4 sm:px-8 py-4 ${
                idx % 2 === 0 ? "bg-white" : "bg-white border-t border-gray-100"
              }`}
            >
              <div className="min-w-[40%] max-w-full xl:max-w-[530px] font-semibold text-gray-700 text-[13px]">
                {spec.label}:
              </div>
              <div className="flex-1 sm:pl-8 mt-1 sm:mt-0 text-[13px] text-gray-900">
                {renderValue(spec.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Hàm xử lý submit đăng ký nhận thông tin
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");
    // Giả lập gửi API, bạn thay bằng API thực tế nếu có
    try {
      if (!registerForm.name || !registerForm.phone) {
        setRegisterError("Vui lòng nhập đầy đủ họ tên và số điện thoại!");
        setRegisterLoading(false);
        return;
      }
      // await fetch('/api/register-stock', { method: 'POST', body: JSON.stringify(registerForm) })
      setTimeout(() => {
        setShowRegisterModal(false);
        setShowSuccessModal(true);
        setRegisterLoading(false);
        setRegisterForm({ name: "", phone: "", email: "" });
      }, 1000);
    } catch (err) {
      setRegisterError("Đăng ký thất bại, vui lòng thử lại!");
      setRegisterLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-40 py-8 bg-white min-h-screen">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <a href="/" className="text-gray-700">
          Trang chủ
        </a>
        <span className="mx-1">/</span>
        <span className="text-black font-semibold">
          {product.TenSP}
          {variantName && ` ${variantName}`}
        </span>
      </nav>
      {/* Phần hiển thị sản phẩm */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Khung ảnh/video chính và thumbnails */}
        <div className="w-full lg:w-[590px]">
          <div className="sticky top-24 relative">
            {/* Flash Sale Badge - nằm ngoài container hình ảnh */}
            {isFlashSaleActive && (
              <div className="absolute -top-6 -left-4 z-20">
                <img
                  src="/images/badgefls.png"
                  alt="Flash Sale"
                  className="w-32 h-32 object-contain drop-shadow-lg transform -rotate-19 transition-transform duration-300"
                />
              </div>
            )}

            {/* Khung hiển thị chính */}
            <div className="bg-gray-100 rounded-xl relative w-full aspect-square mb-4 overflow-hidden group">
              {product.video &&
              product.video.length > 0 &&
              selectedImageIndex === -1 ? (
                <div className="relative w-full h-full">
                  <video
                    ref={mainVideoRef}
                    src={`${getBaseUrl()}/video/${product.video[0]}`}
                    autoPlay
                    // loop
                    playsInline
                    muted
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-contain"
                    poster={getImageUrl(images[0])}
                  />
                  {/* Custom pause button overlay - chỉ hiển thị khi hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => {
                        const video = mainVideoRef.current;
                        const thumbVideo = thumbVideoRef.current;
                        if (video) {
                          if (video.paused) {
                            video.play();
                            // Đồng bộ thumbnail video
                            if (thumbVideo) {
                              thumbVideo.play();
                            }
                          } else {
                            video.pause();
                            // Đồng bộ thumbnail video
                            if (thumbVideo) {
                              thumbVideo.pause();
                            }
                          }
                        }
                      }}
                      className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                    >
                      <svg
                        className="w-8 h-8 text-gray-700"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={getImageUrl(images[selectedImageIndex] || images[0])}
                  alt={product.TenSP}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
            </div>

            {/* Thumbnails với scroll */}
            <div className="relative">
              {/* Nút scroll trái */}
              <button
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                onClick={() => {
                  const container = document.getElementById("thumbnails");
                  if (container) container.scrollLeft -= 100;
                }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Container thumbnails với scroll */}
              <div
                id="thumbnails"
                className="flex gap-2 overflow-x-auto scrollbar-hide px-8 scroll-smooth"
              >
                {/* Thumbnail video */}
                {product.video && product.video.length > 0 && (
                  <div
                    className="flex-shrink-0 w-20 h-20 bg-black rounded-lg cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedImageIndex(-1)}
                  >
                    <video
                      ref={thumbVideoRef}
                      src={`${getBaseUrl()}/video/${product.video[0]}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      playsInline
                      autoPlay
                      // loop
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                )}

                {/* Thumbnails ảnh */}
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`${product.TenSP} - ảnh ${idx + 1}`}
                    className={`flex-shrink-0 w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition
                    ${
                      selectedImageIndex === idx
                        ? "border-blue-500"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => handleThumbnailClick(idx)} // Sử dụng hàm xử lý mới
                  />
                ))}
              </div>

              {/* Nút scroll phải */}
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                onClick={() => {
                  const container = document.getElementById("thumbnails");
                  if (container) container.scrollLeft += 100;
                }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Thông tin sản phẩm */}
        <div className="flex-1">
          <h1 className="text-[24px] font-family-Arial font-bold mb-2 text-black">
            {product.TenSP}
            {variantName && (
              <span className="text-black-600 text-[24px] font-family-Arial font-bold">
                {" "}
                {variantName}
              </span>
            )}
          </h1>
          
          <div className="flex items-end gap-4 mb-3">
            <div className="text-3xl font-bold text-blue-600">
              {price.toLocaleString()}₫
            </div>
            {price < originPrice && (
              <div className="text-xl text-gray-400 line-through ml-4">
                {originPrice.toLocaleString()}₫
              </div>
            )}
            {/* Hiển thị badge % giảm giá nếu có */}
            {selectedVariant &&
              isFlashSaleActive &&
              (() => {
                const flashSaleVariant = flashSaleVariants.find(
                  (v: any) => v.id_variant === selectedVariant._id
                );
                if (flashSaleVariant && flashSaleVariant.phan_tram_giam_gia) {
                  return (
                    <span className="ml-2 sm:ml-3 bg-red-500 text-white text-[12px] sm:text-base font-bold px-2 sm:px-3 py-[2px] sm:py-1 rounded-full whitespace-nowrap">
                      -{flashSaleVariant.phan_tram_giam_gia}%
                    </span>
                  );
                }
                return null;
              })()}
          </div>
          {/* Rating sao */}
          <div className="mb-3">
            <StarRating 
              rating={ratingStats?.averageRating || 0} 
              totalReviews={ratingStats?.totalReviews || 0}
              size="md"
            />
          </div>
          {/* Thông báo quy tắc flash sale */}
          {isFlashSaleActive && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                {/* <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg> */}
                <span className="text-sm text-yellow-800 font-medium">
                  ⚡Flash Sale: Mỗi tài khoản chỉ được mua 1 sản phẩm flash sale.
                </span>
              </div>
            </div>
          )}
          {/* Chỉ hiển thị phần chọn dung lượng nếu có biến thể và có giá trị hợp lệ */}
          {product.variants &&
            product.variants.length > 0 &&
            storages.length > 0 && (
              <div className="mb-4">
                <div className="mb-3 text-[13px] text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>Dung lượng:</div>
                <div className="flex gap-2">
                  {storages.map((s, idx) => (
                    <button
                      key={idx}
                      className={`px-4 py-2 border rounded text-[13px] ${
                        selectedVariant?.dung_luong === s
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => {
                        const v = product.variants?.find(
                          (v) => v.dung_luong === s
                        );
                        if (v) setSelectedVariant(v);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          {/* Chỉ hiển thị phần chọn màu sắc nếu có biến thể và có giá trị hợp lệ */}
          {product.variants &&
            product.variants.length > 0 &&
            colors.length > 0 && (
              <div className="mb-6">
                <div className="mb-4 text-[13px] text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>Màu sắc:</div>
                <div className="flex gap-2">
                  {colors.map((c, idx) => (
                    <button
                      key={idx}
                      className={`w-9 h-9 rounded-full border-4 inline-block transition-all duration-200 hover:scale-110 ${
                        selectedVariant?.mau === c
                          ? "border-blue-600 transform scale-110"
                          : "hover:shadow-md"
                      }`}
                      style={{ background: c }}
                      onClick={() => {
                        const v =
                          product.variants?.find(
                            (v) =>
                              v.mau === c &&
                              (!selectedVariant?.dung_luong ||
                                v.dung_luong === selectedVariant.dung_luong)
                          ) || product.variants?.find((v) => v.mau === c);
                        if (v) setSelectedVariant(v);
                      }}
                      title={c}
                    ></button>
                  ))}
                </div>
              </div>
            )}
          {/* Ưu đãi*/}
          <div className="w-full bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm lg:w-[569px]">
            {/* Tiêu đề */}
            <div className="flex items-center mb-2">
              <svg
                className="w-6 h-6 text-gray-700 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="7"
                  width="18"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                />
                <path d="M7 7V5a2 2 0 114 0v2" stroke="currentColor" />
                <circle cx="17" cy="12" r="1" fill="currentColor" />
              </svg>
              <span className="font-bold text-xs sm:text-sm">Ưu đãi</span>
            </div>

            {/* Ưu đãi thanh toán */}
            <div className="font-bold text-red-600 mb-1 text-xs sm:text-sm">
              I. Ưu đãi thanh toán
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  Giảm <b>200.000đ</b> khi thanh toán qua Kredivo
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  Hỗ trợ trả góp 0% lãi suất{" "}
                 
                </p>
              </li>
            </ul>

            {/* Ưu đãi mua kèm */}
            <div className="font-bold text-red-600 mb-1 text-xs sm:text-sm">
              II. Ưu đãi mua kèm
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  <b>Ốp chính hãng Apple iPhone 16 series</b> giảm{" "}
                  <b>100.000đ</b>
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  Mua combo phụ kiện <b>Non Apple</b> giảm đến <b>200.000đ</b>{" "}
                  
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  <b>Tai nghe Sony</b> giảm đến <b>1.500.000đ</b>{" "}
                 
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  Giảm đến <b>20%</b> khi mua các gói bảo hành{" "}
                  <a href="#" className="text-blue-500 underline">
                    Xem thêm
                  </a>
                </p>
              </li>
            </ul>

            {/* Ưu đãi khác */}
            <div className="font-bold text-red-500 mb-1 text-xs sm:text-sm">
              III. Ưu đãi khác
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="pt-1">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-5 break-words">
                  Thu cũ lên đời iPhone tặng <b>Voucher 4 triệu</b>{" "}
                 
                </p>
              </li>
            </ul>
          </div>

          {/* Nút mua hàng */}
          <div className="flex flex-col items-center gap-4 mb-6">
            {selectedVariant?.so_luong_hang === 0 ? (
              // Nếu hết hàng, hiển thị UI đặc biệt
              <div className="w-[535px] flex flex-col items-center">
                <div className="font-bold text-xl text-center mb-4 mt-2">
                  ĐĂNG KÝ NHẬN THÔNG TIN KHI CÓ HÀNG
                </div>
                <button
                  className="w-full h-[48px] bg-red-600 text-white rounded-lg font-bold text-[14px] mb-3 hover:bg-red-700 transition"
                  onClick={() => setShowRegisterModal(true)}
                >
                  ĐĂNG KÝ NHẬN THÔNG TIN
                </button>
                <button className="w-full h-[68px] bg-red-600 text-white rounded-lg font-bold text-[14px] mb-3 hover:bg-red-700 transition flex flex-col items-center justify-center">
                  <span>SẢN PHẨM NGỪNG KINH DOANH</span>
                  <span className="text-[14px] font-normal">
                    (Vui lòng liên hệ trực tiếp)
                  </span>
                </button>
                <button className="w-full h-[48px] bg-blue-600 text-white rounded-lg font-bold text-[14px] hover:bg-blue-700 transition">
                  <Link href="" as={`/categories/${product.id_danhmuc}`}>
                    Xem thêm sản phẩm khác
                  </Link>
                </button>
              </div>
            ) : (
              // Nếu còn hàng, hiển thị nút mua hàng bình thường
              <>
                <button
                  className="w-full lg:w-[570px] h-[64px] bg-blue-600 text-white py-3 rounded-lg font-bold text-[17px] hover:bg-blue-700 transition"
                  onClick={async () => {
                    if (!product || !selectedVariant) return;

                    // Kiểm tra tồn kho realtime trước khi thêm vào giỏ
                    try {
                      const res = await fetch(getApiUrl('variants/check-inventory'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ variantIds: [selectedVariant._id] })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        showErrorAlert('Lỗi', data.message || 'Không thể kiểm tra tồn kho');
                        return;
                      }
                      const variantInfo = (data.variants || []).find((v: any) => v._id === selectedVariant._id);
                      const currentQtyInCart = cart.find(i => i.variantId === selectedVariant._id)?.quantity || 0;
                      if (!variantInfo || variantInfo.so_luong_hang <= 0) {
                        showOutOfStockAlert(product.TenSP);
                        return;
                      }
                      if (currentQtyInCart + 1 > variantInfo.so_luong_hang) {
                        showOutOfStockAlert(product.TenSP);
                        return;
                      }
                      // Chặn vượt quá 5 cho sản phẩm thường (không phải flash sale)
                      const isFlashSale = Boolean(
                        flashSaleVariants.find((v: any) => v.id_variant === selectedVariant._id)
                      ) && isFlashSaleActive;
                      if (!isFlashSale && currentQtyInCart >= 5) {
                        showMaxQuantityAlert(5, currentQtyInCart);
                        return;
                      }
                    } catch (e) {
                      console.error('Inventory check failed:', e);
                      showErrorAlert('Lỗi', 'Không thể kiểm tra tồn kho. Vui lòng thử lại.');
                      return;
                    }

                    // Tìm flashSaleVariantId nếu là flash sale
                    const flashSaleVariant = flashSaleVariants.find(
                      (v: any) => v.id_variant === selectedVariant._id
                    );
                    const flashSaleVariantId = flashSaleVariant
                      ? flashSaleVariant._id
                      : undefined;

                    // Kiểm tra số lượng flash sale còn lại
                    const flashSaleAvailable = flashSaleVariant 
                      ? flashSaleVariant.so_luong - flashSaleVariant.da_ban 
                      : 0;

                    // Kiểm tra xem người dùng đã có sản phẩm flash sale này trong giỏ hàng chưa
                    const existingCartItem = cart.find(item => item.variantId === selectedVariant._id);
                    const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;
                    const canApplyFlashSale = isFlashSaleActive && alreadyInCart === 0;
                    
                    // Nếu là flash sale và đã có trong giỏ hàng, không cho phép thêm
                    if (isFlashSaleActive && alreadyInCart > 0) {
                      showAddToCartSuccess('Chỉ được mua 1 sản phẩm flash sale cho mỗi loại sản phẩm!');
                      return;
                    }

                    // Thêm tracking hành vi thêm vào giỏ hàng
                    if (user) {
                      trackUserEvent("add_to_cart", product._id, user._id);
                    }

                    // Thêm sản phẩm chính vào giỏ hàng
                    dispatch(
                      addToCart({
                        productId: product._id,
                        variantId: selectedVariant._id,
                        name:
                          product.TenSP +
                          (selectedVariant.dung_luong
                            ? ` ${selectedVariant.dung_luong}`
                            : ""),
                        price: price,
                        originPrice: originPrice,
                        image: getImageUrl(
                          selectedVariant.hinh || product.hinh
                        ),
                        colors:
                          product.variants?.map((v) => v.mau).filter(Boolean) ||
                          [],
                        selectedColor:
                          product.variants?.findIndex(
                            (v) => v._id === selectedVariant._id
                          ) || 0,
                        colorName: selectedVariant.mau || "",
                        quantity: 1,
                        flashSaleVariantId,
                      })
                    );

                    // Hiển thị thông báo phù hợp
                    if (isFlashSaleActive && flashSaleAvailable <= 1) {
                      showAddToCartSuccess(`${product.TenSP} - Flash Sale! Chỉ còn ${flashSaleAvailable} sản phẩm!`);
                    } else if (isFlashSaleActive && !canApplyFlashSale) {
                      showAddToCartSuccess(`${product.TenSP} - Đã thêm vào giỏ hàng (giá gốc - chỉ 1 sản phẩm flash sale được phép)`);
                    } else if (isFlashSaleActive) {
                      showAddToCartSuccess(`${product.TenSP} - Flash Sale!`);
                    } else {
                      showAddToCartSuccess(product.TenSP);
                    }

                    // Thêm các sản phẩm mua kèm đã chọn vào giỏ hàng
                    selectedAccessories.forEach((accessoryId) => {
                      const accessory = accessories.find(
                        (acc) => acc._id === accessoryId
                      );
                      if (accessory) {
                        const accessoryVariant = accessory.variants?.[0];
                        const accessoryPrice =
                          accessory.gia ?? accessoryVariant?.gia ?? 0;
                        dispatch(
                          addToCart({
                            productId: accessory._id,
                            variantId: accessoryVariant?._id || accessory._id,
                            name: accessory.TenSP,
                            price: accessoryPrice,
                            originPrice: accessoryPrice,
                            image: getImageUrl(accessory.hinh),
                            colors:
                              accessory.variants
                                ?.map((v) => v.mau)
                                .filter(Boolean) || [],
                            selectedColor: 0,
                            colorName: accessoryVariant?.mau || "",
                            quantity: 1,
                          })
                        );
                      }
                    });


                  }}
                >
                  Thêm vào giỏ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mua kèm giá sốc */}
      {selectedVariant?.so_luong_hang !== 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6 text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>Sản phẩm mua kèm</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col items-start lg:items-center w-full lg:w-[200px] bg-white border border-gray-200 p-4 rounded">
              <img
                src={getImageUrl(images[0])}
                alt={product.TenSP}
                className="w-28 h-28 object-contain mb-2"
                style={{ backgroundColor: "#FFFFFF" }}
              />
              <div className="font-medium mb-1 text-left lg:text-center text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                {product.TenSP}
                {variantName && ` ${variantName}`}
              </div>
              <div className="text-blue-600 font-bold mb-1 text-lg">
                {price.toLocaleString()}₫
              </div>
              {price < originPrice && (
                <div className="text-gray-400 line-through text-sm">
                  {originPrice.toLocaleString()}₫
                </div>
              )}
              <div className="text-gray-500 text-sm">
                {product.khuyen_mai ? `Giảm ${product.khuyen_mai}%` : null}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-4xl text-gray-400 font-bold">+</span>
            </div>
            <div
              className="relative"
              style={{ width: 580, overflow: "hidden" }}
            >
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                style={{ marginLeft: "2px" }}
                onClick={() => {
                  const container =
                    document.getElementById("accessories-slider");
                  if (container) container.scrollLeft -= 196;
                }}
                type="button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div
                id="accessories-slider"
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                style={{
                  width: "100%",
                  scrollBehavior: "smooth",
                }}
              >
                {accessories.map((acc) => (
                  <div
                    key={acc._id}
                    className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] max-w-[180px] bg-white rounded-xl shadow p-4 flex flex-col items-center border hover:border-blue-500 transition relative"
                  >
                    {selectedAccessories.includes(acc._id) && (
                      <div className="absolute top-2 right-2">
                        <svg
                          className="w-6 h-6 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </div>
                    )}
                    <img
                      src={getImageUrl(acc.hinh)}
                      alt={acc.TenSP}
                      className="w-20 h-20 object-contain mb-2"
                    />
                    <div className="font-medium text-center mb-1 line-clamp-2 text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                      {acc.TenSP}
                    </div>
                    <div className="text-blue-600 font-bold mb-2">
                      {(
                        acc.gia ??
                        acc.variants?.[0]?.gia ??
                        0
                      ).toLocaleString()}
                      ₫
                    </div>
                    <button
                      className={`${
                        selectedAccessories.includes(acc._id)
                          ? "bg-red-100 text-red-600 border-red-500"
                          : "border-blue-500 text-blue-600"
                      } border px-3 py-1 rounded text-sm hover:bg-opacity-80 transition`}
                      onClick={() => toggleAccessory(acc._id)}
                    >
                      {selectedAccessories.includes(acc._id)
                        ? "Bỏ chọn"
                        : "Chọn sản phẩm"}
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                style={{ marginRight: "2px" }}
                onClick={() => {
                  const container =
                    document.getElementById("accessories-slider");
                  if (container) container.scrollLeft += 196;
                }}
                type="button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-col justify-center items-center min-w-[260px] ml-8">
              <div className="text-2xl font-bold text-blue-700 mb-4">
                {calculateTotal().toLocaleString()}₫
              </div>
              <button
                className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition"
                onClick={() => {
                  if (!product || !selectedVariant) return;
                  // Không cho mua combo khi hết hàng
                  if (selectedVariant.so_luong_hang <= 0) {
                    showOutOfStockAlert(product.TenSP);
                    return;
                  }
                  const flashSaleVariant = flashSaleVariants.find(
                    (v: any) => v.id_variant === selectedVariant._id
                  );
                  const flashSaleVariantId = flashSaleVariant
                    ? flashSaleVariant._id
                    : undefined;
                  
                  // Kiểm tra số lượng flash sale còn lại
                  const flashSaleAvailable = flashSaleVariant 
                    ? flashSaleVariant.so_luong - flashSaleVariant.da_ban 
                    : 0;
                  
                  // Kiểm tra xem người dùng đã có sản phẩm flash sale này trong giỏ hàng chưa
                  const existingCartItem = cart.find(item => item.variantId === selectedVariant._id);
                  const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;
                  const canApplyFlashSale = isFlashSaleActive && alreadyInCart === 0;
                  
                  // Nếu là flash sale và đã có trong giỏ hàng, không cho phép thêm
                  if (isFlashSaleActive && alreadyInCart > 0) {
                    showAddToCartSuccess('Chỉ được mua 1 sản phẩm flash sale cho mỗi loại sản phẩm!');
                    return;
                  }
                  
                  if (user) {
                    trackUserEvent("add_to_cart", product._id, user._id);
                  }
                  dispatch(
                    addToCart({
                      productId: product._id,
                      variantId: selectedVariant._id,
                      name:
                        product.TenSP +
                        (selectedVariant.dung_luong
                          ? ` ${selectedVariant.dung_luong}`
                          : ""),
                      price: price,
                      originPrice: originPrice,
                      image: getImageUrl(selectedVariant.hinh || product.hinh),
                      colors:
                        product.variants?.map((v) => v.mau).filter(Boolean) ||
                        [],
                      selectedColor:
                        product.variants?.findIndex(
                          (v) => v._id === selectedVariant._id
                        ) || 0,
                      colorName: selectedVariant.mau || "",
                      quantity: 1,
                      flashSaleVariantId,
                    })
                  );
                  selectedAccessories.forEach((accessoryId) => {
                    const accessory = accessories.find(
                      (acc) => acc._id === accessoryId
                    );
                    if (accessory) {
                      const accessoryVariant = accessory.variants?.[0];
                      const accessoryPrice =
                        accessory.gia ?? accessoryVariant?.gia ?? 0;
                      dispatch(
                        addToCart({
                          productId: accessory._id,
                          variantId: accessoryVariant?._id || accessory._id,
                          name: accessory.TenSP,
                          price: accessoryPrice,
                          originPrice: accessoryPrice,
                          image: getImageUrl(accessory.hinh),
                          colors:
                            accessory.variants
                              ?.map((v) => v.mau)
                              .filter(Boolean) || [],
                          selectedColor: 0,
                          colorName: accessoryVariant?.mau || "",
                          quantity: 1,
                        })
                      );
                    }
                  });
                  
                  // Hiển thị thông báo phù hợp
                  if (isFlashSaleActive && flashSaleAvailable <= 1) {
                    showAddToCartSuccess(`${product.TenSP} - Flash Sale! Chỉ còn ${flashSaleAvailable} sản phẩm!`);
                  } else if (isFlashSaleActive && !canApplyFlashSale) {
                    showAddToCartSuccess(`${product.TenSP} - Đã thêm vào giỏ hàng (giá gốc - chỉ 1 sản phẩm flash sale được phép)`);
                  } else if (isFlashSaleActive) {
                    showAddToCartSuccess(`${product.TenSP} - Flash Sale!`);
                  } else {
                    showAddToCartSuccess(product.TenSP);
                  }
                }}
              >
                Mua {selectedAccessories.length + 1} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sản phẩm liên quan */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>Sản phẩm tương tự</h2>
        <div className="relative" style={{ overflow: "hidden" }}>
          {/* Nút trái */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
            style={{ marginLeft: "4px" }}
            onClick={() => {
              const container = document.getElementById("related-slider");
              if (container) container.scrollLeft -= 300;
            }}
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          {/* Slide sản phẩm liên quan */}
          <div
            id="related-slider"
            className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
            style={{ scrollBehavior: "smooth", height: 380 }}
          >
            {allProducts
              .filter(
                (p) =>
                  p.id_danhmuc === product.id_danhmuc &&
                  p._id !== product._id &&
                  (p.an_hien === undefined || p.an_hien === true) &&
                  // Ẩn sản phẩm tương tự nếu tất cả variant đều hết hàng
                  (Array.isArray(p.variants)
                    ? p.variants.some((v) => v.so_luong_hang > 0)
                    : true)
              )
              .map((sp) => {
                const giaGoc = sp.variants?.[0]?.gia_goc ?? sp.Gia ?? 0;
                const giaBan = sp.gia ?? sp.variants?.[0]?.gia ?? sp.Gia ?? 0;
                const discount =
                  giaGoc > giaBan
                    ? Math.round(100 - (giaBan / giaGoc) * 100)
                    : 0;
                const dungLuong = sp.variants?.[0]?.dung_luong
                  ? ` ${sp.variants[0].dung_luong}`
                  : "";
                return (
                  <Link
                    key={sp._id}
                    href={`/product/${sp._id}`}
                    className="bg-white rounded-xl shadow p-4 flex flex-col w-[180px] sm:w-[220px] md:w-[260px] lg:w-[280px] h-[370px] relative flex-shrink-0 hover:shadow-lg transition"
                  >
                    {/* Badge giảm giá */}
                    {discount > 0 && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded z-10">
                        Giảm {discount}%
                      </div>
                    )}
                    {/* Badge trả góp */}
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <span className="bg-white border border-blue-500 text-blue-600 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded shadow-sm">
                        Trả góp 0%
                      </span>
                    </div>
                    <img
                      src={getImageUrl(sp.hinh)}
                      alt={sp.TenSP}
                      className="w-full h-[200px] sm:h-[250px] object-contain mb-2 mt-4 sm:mt-6"
                    />
                    <div className="font-bold text-[13px] sm:text-[16px] leading-snug line-clamp-2 mb-2 text-left pl-2 sm:pl-5 text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>
                      {sp.TenSP}
                      {dungLuong}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-0.5 sm:gap-2 pl-2 sm:pl-5">
                      <span className="text-blue-600 font-bold text-[14px] sm:text-[15px]">
                        {giaBan.toLocaleString()}
                        <sup>₫</sup>
                      </span>
                      {giaGoc > giaBan && (
                        <span className="text-gray-400 line-through text-[12px] sm:text-sm">
                          {giaGoc.toLocaleString()}
                          <sup>₫</sup>
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
          {/* Nút phải */}
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
            style={{ marginRight: "4px" }}
            onClick={() => {
              const container = document.getElementById("related-slider");
              if (container) container.scrollLeft += 300;
            }}
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Thông số  */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "thongso"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
              onClick={() => setActiveTab("thongso")}
            >
              Thông số kỹ thuật
            </button>

            {/*bình luận đánh giá  thanh hoài */}
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "baiviet"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
              onClick={() => setActiveTab("baiviet")}
            >
              Đánh giá sản phẩm
            </button>
            {/*bình luận đánh giá  thanh hoài */}
          </div>
        </div>

        <div className="py-6">
          {activeTab === "thongso" && <SpecSection />}
          {activeTab === "baiviet" && product?._id && (
            <ProductReviews
              ma_san_pham={product._id}
              ma_nguoi_dung={user?._id || ""}
              selectedVariant={selectedVariant ? {
                _id: selectedVariant._id,
                dung_luong: selectedVariant.dung_luong,
                mau: selectedVariant.mau
              } : undefined}
            />
          )}
          {/*bình luận đánh giá  thanh hoài */}
        </div>
      </div>
      {/* Modal đăng ký nhận thông tin */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-[400px] px-4 relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-2xl"
              onClick={() => setShowRegisterModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-center mb-4">
              Đăng Ký Nhận Tin
            </h2>
            <form
              onSubmit={handleRegisterSubmit}
              className="flex flex-col gap-4"
            >
              <input
                className="border rounded px-4 py-2"
                placeholder="Họ tên (bắt buộc)"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <input
                className="border rounded px-4 py-2"
                placeholder="Số điện thoại (bắt buộc)"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
              <input
                className="border rounded px-4 py-2"
                placeholder="Địa chỉ email (để nhận phản hồi qua email)"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              {registerError && (
                <div className="text-red-500 text-sm text-center">
                  {registerError}
                </div>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
                disabled={registerLoading}
              >
                {registerLoading ? "Đang gửi..." : "ĐĂNG KÝ"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal đăng ký thành công */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[780px] relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-2xl"
              onClick={() => setShowSuccessModal(false)}
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="32" cy="32" r="32" fill="#FEE2E2" />
                  <path
                    d="M20 32L28 40L44 24"
                    stroke="#22C55E"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-green-600 font-bold text-lg mb-2 text-center">
                Đăng ký nhận thông tin thành công
              </div>
              <div className="text-gray-700 text-center mb-4">
                Cảm ơn bạn đã để lại thông tin, PolySmart sẽ liên hệ lại với bạn
                trong thời gian nhanh nhất.
              </div>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
                onClick={() => setShowSuccessModal(false)}
              >
                Quay lại danh sách sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Thông báo thêm vào giỏ hàng thành công */}

    </div>
  );
};

export default ProductDetailPage;
