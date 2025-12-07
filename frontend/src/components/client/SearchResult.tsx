"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiUrl } from "@/config/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { trackUserEvent } from "@/services/productService";

// Hàm định dạng tiền tệ sang VNĐ
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "₫";

const DEFAULT_PAGE_SIZE = 8;

// Hàm lấy URL hình ảnh sản phẩm
// - Nếu là mảng: lấy phần tử đầu tiên
// - Nếu là URL tuyệt đối: trả về luôn
// - Nếu là đường dẫn tương đối: nối với domain backend
// - Nếu không có hình: trả về ảnh mặc định
function getImageUrl(url: string | string[] | undefined | null) {
  if (Array.isArray(url)) url = url[0];
  if (!url) return "/images/no-image.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const backendUrl = process.env.NEXT_PUBLIC_IMAGE_URL;
  if (url.startsWith("../images/")) return url.replace("../images", "/images");
  if (url.startsWith("/images/")) return `${backendUrl}${url}`;
  return `${backendUrl}/images/${url}`;
}

export default function SearchResult() {
  // Router và params để lấy từ khóa tìm kiếm từ URL
  const router = useRouter();
  const searchParams = useSearchParams();
  // State quản lý dữ liệu và UI
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("keyword") || ""
  );
  const [products, setProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(""); // Thêm state cho thông báo lỗi
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: RootState) => state.user.user);

  // Khi URL thay đổi, cập nhật từ khóa tìm kiếm
  useEffect(() => {
    const newKeyword = searchParams.get("keyword") || "";
    setKeyword(newKeyword);
    setSearchInput(newKeyword);
    setPage(1);
  }, [searchParams]);

  // Hàm lọc sản phẩm theo từ khóa (tên + biến thể dung lượng)
  const filterProducts = (products: any[], searchTerm: string) => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return [];
    // Tách tên và dung lượng nếu có (ví dụ: "iPhone 16 128GB")
    const match = normalizedTerm.match(/(.+?)\s+(\d+\s*gb|\d+\s*tb)$/i);
    let namePart = normalizedTerm;
    let dungLuongPart = "";
    if (match) {
      namePart = match[1].trim();
      dungLuongPart = match[2].replace(/\s+/g, "").toLowerCase();
    }
    return products.filter((product) => {
      if (!product.TenSP) return false;
      const productName = product.TenSP.trim().toLowerCase();
      if (dungLuongPart) {
        // Nếu có dung lượng: phải khớp cả tên và biến thể dung lượng
        const hasName = productName.includes(namePart);
        const hasVariant =
          Array.isArray(product.variants) &&
          product.variants.some(
            (variant: any) =>
              variant.dung_luong &&
              variant.dung_luong.replace(/\s+/g, "").toLowerCase() ===
                dungLuongPart
          );
        return hasName && hasVariant;
      }
      // Nếu không có dung lượng: khớp tên hoặc bất kỳ biến thể nào có dung lượng chứa từ khóa
      const nameMatch = productName.includes(normalizedTerm);
      const variantMatch =
        Array.isArray(product.variants) &&
        product.variants.some(
          (variant: any) =>
            variant.dung_luong &&
            variant.dung_luong
              .replace(/\s+/g, "")
              .toLowerCase()
              .includes(normalizedTerm)
        );
      return nameMatch || variantMatch;
    });
  };

  // Lấy gợi ý sản phẩm khi nhập từ khóa (debounce 300ms)
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(getApiUrl("products?an_hien=true"));
        const data = await response.json();
        if (Array.isArray(data)) {
          const filteredProducts = filterProducts(data, searchInput)
            .sort((a, b) => {
              // Ưu tiên sản phẩm có tên chứa đúng từ khóa
              const aName = a.TenSP.toLowerCase();
              const bName = b.TenSP.toLowerCase();
              const searchTerm = searchInput.toLowerCase();
              const aContains = aName.includes(searchTerm);
              const bContains = bName.includes(searchTerm);

              if (aContains && !bContains) return -1;
              if (!aContains && bContains) return 1;

              return aName.localeCompare(bName);
            })
            .slice(0, 3); // Tối đa 3 gợi ý
          setSuggestions(filteredProducts);
          setShowSuggestions(true);
        }
      } catch (error) {

      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Lấy sản phẩm cùng danh mục (không lấy sản phẩm hiện tại)
  const fetchRelatedProducts = async (
    categoryId: string,
    currentProductId: string
  ) => {
    try {
      const response = await fetch(
        getApiUrl(`products?category=${categoryId}&an_hien=true`)
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        return data
          .filter((product) => product._id !== currentProductId)
          .slice(0, 4);
      }
      return [];
    } catch (error) {
      
      return [];
    }
  };

  // Lấy danh sách sản phẩm theo từ khóa tìm kiếm
  useEffect(() => {
    if (!keyword) {
      setProducts([]);
      setRelatedProducts([]);
      return;
    }

    setLoading(true);
    fetch(getApiUrl(`products?an_hien=true`))
      .then((res) => res.json())
      .then(async (data) => {
        if (!Array.isArray(data)) {
          setProducts([]);
          setRelatedProducts([]);
          return;
        }

        const filteredProducts = filterProducts(data, keyword);

        if (filteredProducts.length > 0) {
          setProducts(filteredProducts);
          // Lấy sản phẩm cùng danh mục với sản phẩm đầu tiên
          const related = await fetchRelatedProducts(
            filteredProducts[0].id_danhmuc,
            filteredProducts[0]._id
          );
          setRelatedProducts(related);
        } else {
          setProducts([]);
          setRelatedProducts([]);
        }
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  // Xử lý submit form tìm kiếm
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      // Hiển thị thông báo lỗi khi từ khóa rỗng
      setSearchError("Vui lòng nhập từ khóa");
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => setSearchError(""), 3000);
      return;
    }
    setSearchError(""); // Xóa thông báo lỗi nếu có
    setShowSuggestions(false);
    if (user && user._id) {
      await trackUserEvent("search", "", user._id, searchInput);
    }
    router.push(`/search?keyword=${encodeURIComponent(searchInput)}`);
  };

  // Khi click vào gợi ý, chuyển sang trang sản phẩm đó
  const handleSuggestionClick = (product: any) => {
    setSearchInput(product.TenSP);
    setShowSuggestions(false);
    router.push(`/search?keyword=${encodeURIComponent(product.TenSP)}`);
  };

  // Đóng suggestion khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Tính tổng số trang và phân trang sản phẩm
  const totalPages = Math.ceil(products.length / pageSize);
  const pagedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  // Khi đổi số sản phẩm/trang thì về trang 1
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  return (
    <div className="bg-[#f5f6fa] min-h-screen py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Tìm kiếm</h1>
        {/* Form tìm kiếm với gợi ý */}
        <form onSubmit={handleSubmit} className="mb-6 relative">
          <label className="block mb-2 font-medium">Tìm từ khóa:</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  // Xóa thông báo lỗi khi người dùng bắt đầu nhập
                  if (searchError) setSearchError("");
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full border rounded px-4 py-2"
                placeholder="Nhập tên sản phẩm..."
              />

              {/* Hiển thị thông báo lỗi */}
              {searchError && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {searchError}
                </div>
              )}

              {/* Danh sách gợi ý sản phẩm */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionBoxRef}
                  className="absolute left-0 right-0 mt-1 max-w-full sm:max-w-[400px] bg-white border rounded-md shadow-lg z-50"
                >
                  {suggestions.map((product) => (
                    <div
                      key={product._id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      {/* Ảnh sản phẩm gợi ý */}
                      <img
                        src={getImageUrl(product.hinh)}
                        alt={product.TenSP}
                        className="w-10 h-10 object-contain rounded border"
                      />
                      <div>
                        <div className="font-medium">{product.TenSP}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 rounded font-semibold hover:bg-blue-700 transition"
            >
              TÌM KIẾM
            </button>
          </div>
        </form>
        {/* Bộ lọc & phân trang */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Sắp xếp theo</span>
            <select className="border rounded px-2 py-1 text-sm">
              <option>Mới nhất</option>
              <option>Giá tăng dần</option>
              <option>Giá giảm dần</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Hiển thị</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
            </select>
            <span className="text-sm">trên một trang</span>
          </div>
        </div>
        {/* Danh sách sản phẩm */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Không tìm thấy sản phẩm nào.
          </div>
        ) : (
          <>
<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {pagedProducts.map((product) => {
                // Tính tổng tồn kho của tất cả variants
                const totalStock = Array.isArray(product.variants)
                  ? product.variants.reduce(
                      (sum: number, v: any) => sum + (v.so_luong_hang || 0),
                      0
                    )
                  : 0;
                const isSoldOut = totalStock === 0;
                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl duration-300 relative"
                  >
                    {/* Badge giảm giá */}
                    {(product.khuyen_mai ?? 0) > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                          Giảm {product.khuyen_mai}%
                        </span>
                      </div>
                    )}
                    {/* Badge trạng thái hàng */}
                    <div className="absolute top-3 right-3 z-10">
                      {isSoldOut ? (
                        <img
                          src="/images/het_hang.png"
                          alt="Sold out"
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="bg-white border border-blue-500 text-blue-600 text-xs font-semibold px-3 py-1 rounded shadow-sm">
                          Trả góp 0%
                        </span>
                      )}
                    </div>
                    <Link href={`/product/${product._id}`}>
                      {/* Ảnh sản phẩm */}
                      <div className="relative pt-[100%] overflow-hidden">
                        <img
                          src={getImageUrl(product.hinh)}
                          alt={product.TenSP}
                          className="object-contain p-4 absolute top-0 left-0 w-full h-full"
                        />
                      </div>
                      {/* Thông tin sản phẩm */}
                      <div className="p-4">
                        <h3 className="text-[16px] font-bold mb-2 min-h-[2.5rem] text-gray-800 hover:text-black-600">
                          {product.TenSP}
                          {product.variants &&
                            product.variants.length > 0 &&
                            ` ${product.variants[0].dung_luong}`}
                        </h3>
                        {/* Giá */}
                        <div className="flex gap-2 items-start mb-1">
                          {isSoldOut ? (
                            <span className="text-[15px] font-bold text-[#0066D6]">
                              Liên hệ
                            </span>
                          ) : (
                            <>
                              <span className="text-[15px] font-bold text-[#0066D6]">
                                {(() => {
                                  // Lấy giá thấp nhất trong các variants nếu có, nếu không lấy giá sản phẩm
                                  if (
                                    Array.isArray(product.variants) &&
                                    product.variants.length > 0
                                  ) {
                                    const prices = product.variants
                                      .map(
                                        (v: any) =>
                                          v.gia_khuyen_mai ?? v.gia ?? null
                                      )
                                      .filter(
                                        (p: any) =>
                                          typeof p === "number" && !isNaN(p)
                                      );
                                    if (prices.length > 0) {
                                      return formatCurrency(
                                        Math.min(...prices)
                                      );
                                    }
                                  }
                                  return formatCurrency(
                                    product.Gia *
                                      (1 - (product.khuyen_mai || 0) / 100)
                                  );
                                })()}
                              </span>
                              {/* Giá gốc nếu có */}
                              {(() => {
                                if (
                                  Array.isArray(product.variants) &&
                                  product.variants.length > 0
                                ) {
                                  const prices = product.variants
                                    .map((v: any) => v.gia)
                                    .filter(
                                      (p: any) =>
                                        typeof p === "number" && !isNaN(p)
                                    );
                                  if (
                                    prices.length > 1 &&
                                    Math.max(...prices) > Math.min(...prices)
                                  ) {
                                    const maxPrice = Math.max(...prices);
                                    if (
                                      typeof maxPrice === "number" &&
                                      !isNaN(maxPrice)
                                    ) {
                                      return (
                                        <span className="text-gray-400 line-through text-[14px]">
                                          {formatCurrency(maxPrice)}
                                        </span>
                                      );
                                    }
                                  }
                                }
                                if (
                                  product.khuyen_mai &&
                                  typeof product.Gia === "number" &&
                                  !isNaN(product.Gia)
                                ) {
                                  return (
                                    <span className="text-gray-400 line-through text-sm">
                                      {formatCurrency(product.Gia)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded border text-sm ${
                  page === i + 1 ? "bg-blue-600 text-white" : "bg-white"
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
