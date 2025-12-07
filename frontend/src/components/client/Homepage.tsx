
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {Category,Product,ProductVariant,Banner,HomePageData,NewsItem} from "./cautrucdata";
import { getApiUrl, getBaseUrl } from "@/config/api";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import { Navigation, Autoplay } from "swiper/modules";
import { Fullscreen } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import GiftVoucher from "./GiftVoucher";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { fetchRecommendedProducts } from "@/services/productService";
import PetMascot from "@/components/client/PetMascot"
import { showWarningAlert } from "@/utils/sweetAlert";
import GridiPhone from "./GridiPhone";
import GridiPad from "./GridiPad";
import GridMac from "./GridMac";
import SectionIphone from "./SectionIphone";
import SectionIpad from "./SectionIpad";
import SectionMac from "./SectionMac";
import SEO from "./SEO";
import SectionNews from "./SectionNews";
import SectionHotIphone from "./SectionHotIphone";
import SectionHotIpad from "./SectionHotIpad";
import SectionHotMac from "./SectionHotMac";
import SectionFlashSale from "./SectionFlashSale";
import SectionBanner from "./SectionBanner";
import SectionRecommend from "./SectionRecommend";

// Interface định nghĩa cấu trúc dữ liệu cho Flash Sale variant trong trang chủ
interface FlashSaleVariantInHomepage {
  id_variant: string;
  gia_flash_sale: number;
  so_luong: number;
  da_ban: number;
  product_name?: string;
  variant_details?: string;
  product_id: string;
  product_image: string | string[];
  phan_tram_giam_gia?: number;
  gia_goc?: number;
}

// Interface định nghĩa cấu trúc dữ liệu cho Flash Sale
interface FlashSale {
  _id: string;
  ten_su_kien: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  an_hien: boolean;
  flashSaleVariants: FlashSaleVariantInHomepage[];
}

// Hàm xử lý URL hình ảnh - chuyển đổi đường dẫn tương đối thành URL đầy đủ
const getImageUrl = (url: string | string[]) => {
  // Nếu url là mảng, lấy phần tử đầu tiên
  if (Array.isArray(url)) {
    url = url[0];
  }

  // Nếu không có url, trả về ảnh mặc định
  if (!url) {
    return "/images/";
  }

  // Nếu là URL đầy đủ (http/https), giữ nguyên
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Thêm domain của backend cho các đường dẫn hình ảnh
  const backendUrl = process.env.NEXT_PUBLIC_IMAGE_URL || getBaseUrl();

  // Xử lý đường dẫn tương đối ../images
  if (url.startsWith("../images/")) {
    return url.replace("../images", "/images");
  }

  // Nếu url bắt đầu bằng /images, chỉ cần thêm domain backend
  if (url.startsWith("/images/")) {
    return `${backendUrl}${url}`;
  }

  // Trường hợp còn lại, giả định là tên file trong thư mục images
  return `${backendUrl}/images/${url}`;
};

// Hàm upload hình ảnh lên server
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("images", file);

  const response = await fetch(getApiUrl("upload"), {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.path; // Đường dẫn hình ảnh đã upload
};

// Mở rộng interface Window để thêm các function debug và test Flash Sale
declare global {
  interface Window {
    refreshFlashSale?: () => Promise<void>;
    processFlashSaleOrder?: (orderId: string) => Promise<boolean>;
    checkOrderStatus?: (orderId: string) => Promise<void>;
    debugFlashSale?: () => void;
    fixFlashSaleOrder?: (orderId: string) => Promise<void>;
    updateFlashSaleQuantity?: (variantId: string, newSoldCount: number) => Promise<void>;
    showFlashSaleStatus?: () => void;
  }
}

// Component chính của trang chủ
const HomePage = () => {
  // State quản lý banner slider
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // State chứa tất cả dữ liệu sản phẩm và danh mục
  const [data, setData] = useState<{
    flashSaleProducts: FlashSale[];
    iPhoneProducts: Product[];
    iPadProducts: Product[];
    MacProducts: Product[];
    categories: Category[];
  }>({
    flashSaleProducts: [],
    iPhoneProducts: [],
    iPadProducts: [],
    MacProducts: [],
    categories: [],
  });
  
  // State loading chung
  const [loading, setLoading] = useState(true);
  
  // Interface và state cho cài đặt hệ thống
  interface Settings {
    Banner?: string;
    [key: string]: unknown;
  }
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // State đếm ngược thời gian Flash Sale
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  // State quản lý slide iPhone
  const [iphoneSlide, setIphoneSlide] = useState(0);
  const productsPerSlide = 4;
  const totalSlides = Math.ceil(data.iPhoneProducts.length / productsPerSlide);
  
  // State cho tin tức
  const [news, setNews] = useState<NewsItem[]>([]);
  
  // State hiển thị Flash Sale
  const [showFlashSale, setShowFlashSale] = useState(false);
  
  // Lấy thông tin user từ Redux store
  const user = useSelector((state: RootState) => state.user.user);
  
  // State cho sản phẩm gợi ý
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  
  // State cho lời khuyên AI
  const [aiAdvice, setAiAdvice] = useState("");
  
  // State cho việc refresh Flash Sale
  const [isRefreshingFlashSale, setIsRefreshingFlashSale] = useState(false);

  // State loading cho từng section riêng biệt
  const [loadingFlashSale, setLoadingFlashSale] = useState(true);
  const [loadingRecommendSection, setLoadingRecommendSection] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingIphone, setLoadingIphone] = useState(true);
  const [loadingIpad, setLoadingIpad] = useState(true);
  const [loadingMac, setLoadingMac] = useState(true);

  //cập nhật số lượng Flash Sale khi có người mua
  const updateFlashSaleQuantity = (variantId: string) => {
    setData((prevData) => ({
      ...prevData,
      flashSaleProducts: prevData.flashSaleProducts.map((flashSale) => ({
        ...flashSale,
        flashSaleVariants: flashSale.flashSaleVariants.map((variant) => {
          if (variant.id_variant === variantId) {
            // Kiểm tra nếu còn hàng
            if (variant.so_luong > variant.da_ban) {
              return {
                ...variant,
                da_ban: variant.da_ban + 1,
              };
            }
          }
          return variant;
        }),
      })),
    }));
  };

  // Hàm xử lý khi click vào sản phẩm Flash Sale
  const handleFlashSaleClick = async (variant: FlashSaleVariantInHomepage) => {
    try {
      // Kiểm tra còn hàng không
      if (variant.so_luong <= variant.da_ban) {
        showWarningAlert("Hết hàng!", "Sản phẩm flash sale đã hết hàng", 3000);
        return;
      }

      // Chuyển hướng đến trang sản phẩm với thông tin Flash Sale
      const url = `/product/${variant?.product_id || ""}?variantId=${variant.id_variant
      }&flashsale=true&price=${variant.gia_flash_sale}`;
      window.location.href = url;
    } catch (error) {

    }
  };

  // Hàm refresh dữ liệu Flash Sale sau khi mua hàng thành công
  const refreshFlashSaleData = async () => {
    try {
      setIsRefreshingFlashSale(true);
      const flashSaleResponse = await fetch(getApiUrl("flashsales/active"));
      const flashSaleData = await flashSaleResponse.json();
      const flashSaleProducts: FlashSale[] = Array.isArray(flashSaleData.data)
        ? flashSaleData.data
        : [];

      setData((prevData) => ({
        ...prevData,
        flashSaleProducts: flashSaleProducts,
      }));


    } catch (error) {
      // Lỗi khi refresh dữ liệu Flash Sale
    } finally {
      setTimeout(() => setIsRefreshingFlashSale(false), 500); // Hiển thị loading một chút
    }
  };

  // Hàm xử lý đơn hàng Flash Sale thủ công
  const processFlashSaleOrder = async (orderId: string) => {
    try {


      // Đầu tiên thử endpoint xử lý Flash Sale chuyên dụng
      let response = await fetch(
        getApiUrl(`orders/${orderId}/process-flashsale`),
        {
          method: "POST",
        }
      );

      if (!response.ok) {

        // Phương án thay thế: cập nhật số lượng Flash Sale trực tiếp
        response = await fetch(getApiUrl(`flashsales/update-quantities`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
        });
      }

      if (response.ok) {
        const result = await response.json();

        // Refresh dữ liệu sau khi xử lý
        setTimeout(() => refreshFlashSaleData(), 1000);
        return true;
      } else {
        const error = await response.text();

        return false;
      }
    } catch (error) {

      return false;
    }
  };

  // Hàm debug trạng thái Flash Sale hiện tại
  const debugFlashSaleState = () => {
    // Hàm debug - đã xóa console.log để tăng hiệu suất
  };

  // Expose các function lên window để test
  useEffect(() => {
    window.refreshFlashSale = refreshFlashSaleData;
    window.processFlashSaleOrder = processFlashSaleOrder;
    window.checkOrderStatus = checkOrderStatus;
    window.debugFlashSale = debugFlashSaleState;
  
    // Helper function để sửa Flash Sale cho đơn hàng cụ thể
    window.fixFlashSaleOrder = async (orderId: string) => {
      await processFlashSaleOrder(orderId);
      await refreshFlashSaleData();
    };
  
    // Helper để cập nhật số lượng Flash Sale thủ công
    window.updateFlashSaleQuantity = async (
      variantId: string,
      newSoldCount: number
    ) => {
      try {
        const response = await fetch(
          getApiUrl(`flashsales/variants/${variantId}/update`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ da_ban: newSoldCount }),
          }
        );
  
        if (response.ok) {

          refreshFlashSaleData();
        } else {
  
        }
      } catch (error) {

      }
    };
  
    // Helper để hiển thị số lượng hiện tại
    window.showFlashSaleStatus = () => {
      debugFlashSaleState();
      const elements = document.querySelectorAll("[data-flash-variant]");
      elements.forEach((el) => {
        const variantId = el.getAttribute("data-flash-variant");
        const quantityEl = el.querySelector(".quantity-display");
        if (quantityEl) {

        }
      });
    };
  
    return () => {
      delete window.refreshFlashSale;
      delete window.processFlashSaleOrder;
      delete window.checkOrderStatus;
      delete window.fixFlashSaleOrder;
      delete window.debugFlashSale;
      delete window.updateFlashSaleQuantity;
      delete window.showFlashSaleStatus;
    };
  }, []);



  // Banner iPhone
  const [specialBanners] = useState<Banner[]>([
    {
      id: 1,
      image: "/images/ipsl.png",
      title: "Banner 1",
      subtitle: "",
      link: "#",
    },
    {
      id: 2,
      image: "/images/ron12.png",
      title: "Banner 2",
      subtitle: "",
      link: "#",
    },
    {
      id: 3,
      image: "/images/ron13.jpg",
      title: "Banner 3",
      subtitle: "",
      link: "#",
    },
  ]);
  
  // BanneriPad
  const [specialBannersiPad] = useState<Banner[]>([
    {
      id: 1,

      image: "/images/ronlap1.jpg",
      title: "Banner 1",
      subtitle: "",
      link: "#",
    },
    {
      id: 2,
      image: "/images/ronlapbn.png",
      title: "Banner 2",
      subtitle: "",
      link: "#",
    },
  ]);
  
  // Banner Mac
  const [specialBannersMac] = useState<Banner[]>([
    {
      id: 1,
      image: "/images/bnmac.png",
      title: "Banner 1",
      subtitle: "",
      link: "#",
    },
    {
      id: 2,
      image: "/images/bnmac1.png",
      title: "Banner 2",
      subtitle: "",
      link: "#",
    },
  ]);

  // Tính thời gian kết thúc Flash Sale và kiểm tra trạng thái hiển thị
  useEffect(() => {
    if (data.flashSaleProducts && data.flashSaleProducts.length > 0) {
      // Lấy Flash Sale đầu tiên (đã được backend filter là đang hoạt động
      const endDate = new Date(data.flashSaleProducts[0].thoi_gian_ket_thuc);
      setShowFlashSale(true);
      
      // Khởi tạo countdown ngay lập tức
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setShowFlashSale(false);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 * 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown({ days, hours, minutes, seconds });
      }
    } else {
      setShowFlashSale(false);
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  }, [data.flashSaleProducts]);

  // Fetch cài đặt
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(getApiUrl("settings"));
        const settingsData = await response.json();
        const settingObj = Array.isArray(settingsData)
          ? settingsData[0]
          : settingsData;
        setSettings(settingObj);
        if (settingObj && settingObj.Banner) {
          const bannerImages = settingObj.Banner.split("|");
          setBanners(
            bannerImages.map((img: string, index: number) => ({
              id: index + 1,
              image: getImageUrl(img),
              title: "",
              subtitle: "",
              link: "/mac/macbook-air",
            }))
          );
        }
      } catch (error) {

      }
    };

    fetchSettings();
  }, []);

  const [banners, setBanners] = useState<Banner[]>([]);

  // TỐI ƯU API CALLS
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingFlashSale(true);
        setLoadingIphone(true);
        setLoadingIpad(true);
        setLoadingMac(true);

        //  Fetch Flash Sale trước
  
        const flashSaleResponse = await fetch(getApiUrl("flashsales/active"));
        const flashSaleData = await flashSaleResponse.json();
        const flashSaleProducts: FlashSale[] = Array.isArray(flashSaleData.data)
          ? flashSaleData.data
          : [];
        
        // Cập nhật Flash Sale ngay lập tức
        setData(prevData => ({
          ...prevData,
          flashSaleProducts: flashSaleProducts,
        }));
        setLoadingFlashSale(false);


        // Fetch Products 

        const IPHONE_CATEGORY_ID = "681d97db2a400db1737e6de3";
        const IPAD_CATEGORY_ID = "681d97db2a400db1737e6de4";
        const MAC_CATEGORY_ID = "681d97db2a400db1737e6de5";

        // Fetch tất cả products
        const [iPhoneResponse, iPadResponse, MacResponse, categoriesResponse] = await Promise.all([
          fetch(getApiUrl(`products?id_danhmuc=${IPHONE_CATEGORY_ID}`)),
          fetch(getApiUrl(`products?id_danhmuc=${IPAD_CATEGORY_ID}`)),
          fetch(getApiUrl(`products?id_danhmuc=${MAC_CATEGORY_ID}`)),
          fetch(getApiUrl("categories"))
        ]);

        const [iPhoneData, iPadData, MacData, categoriesData] = await Promise.all([
          iPhoneResponse.json(),
          iPadResponse.json(),
          MacResponse.json(),
          categoriesResponse.json()
        ]);



        // Cập nhật state cho từng loại sản phẩm
        setLoadingIphone(false);
        setLoadingIpad(false);
        setLoadingMac(false);

        // Cập nhật data cuối cùng
        setData(prevData => ({
          ...prevData,
          iPhoneProducts: Array.isArray(iPhoneData)
            ? iPhoneData
                .filter((product) => product.id_danhmuc === IPHONE_CATEGORY_ID)
                .slice(0, 12)
            : [],
          iPadProducts: Array.isArray(iPadData)
            ? iPadData
                .filter((product) => product.id_danhmuc === IPAD_CATEGORY_ID)
                .slice(0, 12)
            : [],
          MacProducts: Array.isArray(MacData)
            ? MacData.filter(
                (product) => product.id_danhmuc === MAC_CATEGORY_ID
              ).slice(0, 12)
            : [],
          categories: categoriesData || [],
        }));



      } catch (error) {

        setLoadingFlashSale(false);
        setLoadingIphone(false);
        setLoadingIpad(false);
        setLoadingMac(false);
        setLoadingNews(false);
        setLoadingRecommendSection(false);
        setData({
          flashSaleProducts: [],
          iPhoneProducts: [],
          iPadProducts: [],
          MacProducts: [],
          categories: [],
        });
      } finally {
        setLoading(false);
  
      }
    };

    fetchData();
  }, []);

  //Flash Sale refresh 

  // Refresh khi trang trở nên hiển thị (user quay lại tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh dữ liệu Flash Sale khi user quay lại trang
        refreshFlashSaleData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Lắng nghe sự kiện mua hàng thành công
  useEffect(() => {
    const handlePurchaseSuccess = (event: any) => {
      if (event.detail && event.detail.type === "flashsale_purchase") {
        // Refresh ngay lập tức khi có mua hàng Flash Sale
        setTimeout(() => {
          refreshFlashSaleData();
        }, 1000); // Delay nhỏ để đảm bảo backend đã cập nhật
      }
    };

    window.addEventListener("purchaseSuccess", handlePurchaseSuccess);
    return () =>
      window.removeEventListener("purchaseSuccess", handlePurchaseSuccess);
  }, []);

  // Kiểm tra đơn hàng thành công khi component mount
  useEffect(() => {
    const checkOrderSuccess = () => {
      // Kiểm tra URL params cho đơn hàng thành công
      const urlParams = new URLSearchParams(window.location.search);
      const orderSuccess = urlParams.get("order_success");
      const flashsaleOrder = urlParams.get("flashsale_order");
      const orderId = urlParams.get("order_id");

      // Kiểm tra localStorage cho đơn hàng gần đây
      const recentOrder = localStorage.getItem("recent_flashsale_order");
      const lastOrderCheck = localStorage.getItem("last_order_check");

      if (
        orderSuccess === "true" ||
        flashsaleOrder === "true" ||
        recentOrder ||
        orderId
      ) {
        // Xóa flag localStorage
        if (recentOrder) {
          localStorage.removeItem("recent_flashsale_order");
        }

        // Nếu có order ID, kiểm tra trạng thái
        if (orderId && orderId !== lastOrderCheck) {
          checkOrderStatus(orderId);
          localStorage.setItem("last_order_check", orderId);
        }

        // Refresh dữ liệu Flash Sale nhiều lần để đảm bảo cập nhật
        setTimeout(() => refreshFlashSaleData(), 1000);
        setTimeout(() => refreshFlashSaleData(), 3000);
        setTimeout(() => refreshFlashSaleData(), 5000);

        // Dọn dẹp URL params
        if (orderSuccess || flashsaleOrder) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    };

    checkOrderSuccess();
  }, []);

  // Hàm kiểm tra trạng thái đơn hàng và trigger refresh nếu cần
  const checkOrderStatus = async (orderId: string) => {
    try {
      const response = await fetch(getApiUrl(`orders/${orderId}`));
      const orderData = await response.json();
      interface OrderItem {
        isFlashSale?: boolean;
      }

      if (
        (orderData.paymentStatus === "paid" ||
          orderData.orderStatus === "delivered") &&
        orderData.items &&
        orderData.items.some((item: OrderItem) => item.isFlashSale)
      ) {

        refreshFlashSaleData();
      }
    } catch (error) {
      
    }
  };

  // 🚀 Check recent orders đã được gộp vào interval chính ở trên

  // 🚀 Auto slide đã được gộp vào interval chính ở trên

  // Hàm format tiền VND
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
  };

  // Tính phần trăm giảm giá
  const calculateDiscount = (original: number, sale: number): number => {
    return Math.round(((original - sale) / original) * 100);
  };

  // Hàm hiển thị thông tin variant
  const renderVariantInfo = (variants: ProductVariant[] | undefined) => {
    if (!variants || variants.length === 0) return null;

    // Nhóm các variants theo dung lượng
    const variantsByStorage = variants.reduce((acc, variant) => {
      if (!acc[variant.dung_luong]) {
        acc[variant.dung_luong] = [];
      }
      acc[variant.dung_luong].push(variant);
      return acc;
    }, {} as Record<string, ProductVariant[]>);

    return (
      <div className="mt-3 space-y-2">
        {Object.entries(variantsByStorage).map(([storage, storageVariants]) => (
          <div key={storage} className="space-y-1">
            <div className="text-xs font-medium text-gray-700">{storage}</div>
            <div className="flex flex-wrap gap-1">
              {storageVariants.map((variant) => (
                <div key={variant._id} className="relative group">
                  {/* Badge Flash Sale bên trái */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                      Flash Sale
                    </span>
                  </div>
                  {/* Badge % giảm giá bên phải */}
                  {variant.phan_tram_giam_gia && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-yellow-400 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        -{variant.phan_tram_giam_gia}%
                      </span>
                    </div>
                  )}
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-md 
                    ${variant.so_luong_hang > 0
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {variant.mau}
                  </span>
                  {/* Tooltip */}
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                    bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                    transition-opacity duration-200 whitespace-nowrap z-10"
                  >
                    {formatCurrency(variant.gia)}
                    {variant.so_luong_hang === 0 && " - Hết hàng"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // hiển thị giá thấp nhất và cao nhất của variants (trả về object)
  const getPriceRange = (variants: ProductVariant[] | undefined) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants
      .map((v) => v.gia)
      .filter((price) => typeof price === "number" && !isNaN(price));
    if (prices.length === 0) return null; // No valid prices found
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return { minPrice, maxPrice };
  };

  // Fetch dữ liệu tin tức
  useEffect(() => {
    setLoadingNews(true);
    fetch(getApiUrl('news'))
      .then((res) => res.json())
      .then((data: NewsItem[]) => setNews(data))
      .finally(() => setLoadingNews(false));
  }, []);

  // Fetch sản phẩm gợi ý cho user
  useEffect(() => {
    if (!user || !user._id) {
      setRecommendedProducts([]);
      setAiAdvice("");
      setLoadingRecommendSection(false);
      return;
    }
    setLoadingRecommend(true);
    setLoadingRecommendSection(true);
    fetchRecommendedProducts(user._id)
      .then((products) => setRecommendedProducts(products))
      .catch(() => setRecommendedProducts([]))
      .finally(() => setLoadingRecommend(false));

    // Fetch lời khuyên AI
    fetch(`/api/ai-advice?userId=${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        let msg = data.message || "";
        if (Array.isArray(msg)) msg = msg[0] || "";
        if (typeof msg === "string") {
          msg = msg.split("\n")[0];
          if (msg.length > 180) msg = msg.split(". ")[0] + ".";
        }
        setAiAdvice(msg);
      })
      .catch(() => setAiAdvice(""))
      .finally(() => setLoadingRecommendSection(false));
  }, [user]);

  // GỘP TẤT CẢ INTERVALS THÀNH MỘT INTERVAL CHÍNH + VISIBILITY API - TỐI ƯU TBT TỐI ĐA
  useEffect(() => {
    let mainInterval: NodeJS.Timeout | null = null;
    
    // Các biến đếm để track timing
    let countdownCounter = 0;
    let flashSaleCounter = 0;
    let orderCheckCounter = 0;
    let slideCounter = 0;
    
    // Hàm bắt đầu interval
    const startInterval = () => {
      if (!document.hidden && !mainInterval) {
        mainInterval = setInterval(() => {
          countdownCounter++;
          flashSaleCounter++;
          orderCheckCounter++;
          slideCounter++;
          
          // Update countdown mỗi giây (1s)
          if (countdownCounter >= 1) {
            // Logic update countdown từ useEffect cũ
            if (data.flashSaleProducts && data.flashSaleProducts.length > 0) {
              const endDate = new Date(data.flashSaleProducts[0].thoi_gian_ket_thuc);
              const now = new Date();
              const diff = endDate.getTime() - now.getTime();

              if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setShowFlashSale(false);
              } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / 1000 * 60) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setCountdown({ days, hours, minutes, seconds });
              }
            }
            countdownCounter = 0;
          }
          
          // Refresh flash sale mỗi 30 giây (30s)
          if (flashSaleCounter >= 30) {
            const refreshFlashSaleData = async () => {
              try {
                const flashSaleResponse = await fetch(getApiUrl("flashsales/active"));
                const flashSaleData = await flashSaleResponse.json();
                const flashSaleProducts: FlashSale[] = Array.isArray(flashSaleData.data)
                  ? flashSaleData.data
                  : [];

                setData((prevData) => ({
                  ...prevData,
                  flashSaleProducts: flashSaleProducts,
                }));
              } catch (error) {
                // Lỗi khi refresh dữ liệu Flash Sale
              }
            };
            refreshFlashSaleData();
            flashSaleCounter = 0;
          }
          
          // Check recent orders mỗi 2 phút (120s)
          if (orderCheckCounter >= 120) {
            const checkRecentOrders = async () => {
              try {
                // Lấy đơn hàng gần đây từ 5 phút trước
                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

                const response = await fetch(
                  getApiUrl(`orders/recent?since=${fiveMinutesAgo.toISOString()}`)
                );
                const recentOrders = await response.json();

                // Kiểm tra nếu có đơn hàng gần đây chứa Flash Sale
                interface RecentOrderItem {
                  isFlashSale?: boolean;
                }
                interface RecentOrder {
                  paymentStatus?: string;
                  orderStatus?: string;
                  items?: RecentOrderItem[];
                }
                const hasFlashSaleOrders = (recentOrders as RecentOrder[]).some(
                  (order) =>
                    (order.paymentStatus === "paid" ||
                      order.orderStatus === "delivered") &&
                    order.items &&
                    order.items.some((item) => item.isFlashSale)
                );

                if (hasFlashSaleOrders) {
          
                  // Gọi refresh flash sale data
                  const refreshFlashSaleData = async () => {
                    try {
                      const flashSaleResponse = await fetch(getApiUrl("flashsales/active"));
                      const flashSaleData = await flashSaleResponse.json();
                      const flashSaleProducts: FlashSale[] = Array.isArray(flashSaleData.data)
                        ? flashSaleData.data
                        : [];

                      setData((prevData) => ({
                        ...prevData,
                        flashSaleProducts: flashSaleProducts,
                      }));
                    } catch (error) {
                      // Lỗi khi refresh dữ liệu Flash Sale
                    }
                  };
                  refreshFlashSaleData();
                }
              } catch (error) {
                // Silently fail - this is just a backup check
        
              }
            };
            checkRecentOrders();
            orderCheckCounter = 0;
          }
          
          // Auto chuyển slide mỗi 9 giây (9s)
          if (slideCounter >= 9) {
            setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
            slideCounter = 0;
          }
        }, 1000); // Chỉ 1 interval chạy mỗi giây
      }
    };
    
    // Hàm dừng interval
    const stopInterval = () => {
      if (mainInterval) {
        clearInterval(mainInterval);
        mainInterval = null;
      }
    };
    
    // Xử lý khi visibility thay đổi
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab ẩn - dừng interval để tiết kiệm tài nguyên
        stopInterval();

      } else {
        // Tab hiển thị - bắt đầu interval
        startInterval();
        
      }
    };
    
    // Bắt đầu interval nếu tab đang hiển thị
    if (!document.hidden) {
      startInterval();
    }
    
    // Lắng nghe sự thay đổi visibility
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup khi component unmount
    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [data.flashSaleProducts, banners.length]);

  //  lọc sản phẩm bán chạy
  const hotIphones: Product[] = data.iPhoneProducts.filter(
    (product: Product) => (product.ban_chay ?? 0) > 10000
  );
  const hotIpads: Product[] = data.iPadProducts.filter(
    (product: Product) => (product.ban_chay ?? 0) > 10000
  );
  const hotMacs: Product[] = data.MacProducts.filter(
    (product: Product) => (product.ban_chay ?? 0) > 10000
  );

  // loading
  if (loading) {
    return (
      <div className="mt-16 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // trang chủ (SEO)
  const generateStructuredData = () => {
    const allProducts = [
      ...data.iPhoneProducts,
      ...data.iPadProducts,
      ...data.MacProducts,
      ...(recommendedProducts || []),
    ];

    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Poly Smart",
      url: "https://polysmart.nghiaht.io.vn",
      description: "Đại lý ủy quyền Apple chính hãng tại Việt Nam",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://polysmart.nghiaht.io.vn/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
      offers: allProducts.slice(0, 10).map((product) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: product.TenSP,
          description: product.Mota,
          image: getImageUrl(product.hinh || ""),
          brand: {
            "@type": "Brand",
            name: "Apple",
          },
        },
        price: product.Gia,
        priceCurrency: "VND",
        availability: "https://schema.org/InStock",
      })),
    };
  };

  return (
    <>
      {/* Component SEO để tối ưu hóa tìm kiếm */}
      <SEO title="Trang chủ"
        description="Poly Smart - Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods với giá tốt nhất. Giao hàng toàn quốc, bảo hành chính hãng."
        keywords={[
          "iPhone chính hãng",
          "iPad chính hãng",
          "MacBook chính hãng",
          "Apple Watch",
          "AirPods",
          "đại lý Apple",
          "Poly Smart",
          "Apple Việt Nam", ]}/>
      <div className="mt-0" style={{fontFamily:"SF Pro, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",}}>
        {/* Banner Slider */}
        <SectionBanner banners={banners} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide}/>
        
        {/* Flash Sale */}
        <SectionFlashSale
          flashSaleProducts={data.flashSaleProducts}
          showFlashSale={showFlashSale}
          countdown={countdown}
          isRefreshingFlashSale={isRefreshingFlashSale}
          refreshFlashSaleData={refreshFlashSaleData}
          handleFlashSaleClick={handleFlashSaleClick}
          getImageUrl={getImageUrl}
          formatCurrency={formatCurrency}
          loading={loadingFlashSale}
        />

        <GiftVoucher />
        
        {/*  AI gợi ý */}
        <SectionRecommend
          user={user}
          recommendedProducts={recommendedProducts}
          aiAdvice={aiAdvice}
          loadingRecommend={loadingRecommendSection}
          getImageUrl={getImageUrl}
        />
        
        {/*iPhone bán chạy */}
         <SectionHotIphone
          hotIphones={hotIphones}
          getImageUrl={getImageUrl}
          formatCurrency={formatCurrency}
          specialBanners={specialBanners}
          loading={loadingIphone}
        />
        
        {/* iPhone Section*/}
        <SectionIphone
          products={data.iPhoneProducts}
          getPriceRange={getPriceRange}
          formatCurrency={formatCurrency}
          getImageUrl={getImageUrl}
          loading={loadingIphone}
        />
        
        <GridiPhone />
        
        {/*iPad bán chạy */}
        <SectionHotIpad
          hotIpads={hotIpads}
          getImageUrl={getImageUrl}
          formatCurrency={formatCurrency}
          specialBannersiPad={specialBannersiPad}
          loading={loadingIpad}
        />
        
        {/* iPad Section */}
        <SectionIpad
          products={data.iPadProducts}
          getPriceRange={getPriceRange}
          formatCurrency={formatCurrency}
          getImageUrl={getImageUrl}
          loading={loadingIpad}
        />

        <GridiPad />
        
        {/*  Mac bán chạy */}
        <SectionHotMac
          hotMacs={hotMacs}
          getImageUrl={getImageUrl}
          formatCurrency={formatCurrency}
          specialBannersMac={specialBannersMac}
          loading={loadingMac}
        />
        
        {/* Mac Section */}
        <SectionMac
          products={data.MacProducts}
          getPriceRange={getPriceRange}
          formatCurrency={formatCurrency}
          getImageUrl={getImageUrl}
          loading={loadingMac}
        />
 
        <GridMac />
        
        {/* Newsfeed Section */}
        <SectionNews news={news} getImageUrl={getImageUrl} loading={loadingNews} />
      </div>
    </>
  );
};

export default HomePage;
