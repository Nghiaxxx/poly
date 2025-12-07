'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Search, User } from 'lucide-react';
import { Category, Settings, Logo, Product } from './cautrucdata';
import { getApiUrl, fetchApi, API_ENDPOINTS } from '@/config/api';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { setUser } from '@/store/userSlice';
import { usePathname } from 'next/navigation';

const getImageUrl = (url: string | string[]) => {
  // Nếu url là mảng, lấy phần tử đầu tiên
  if (Array.isArray(url)) {
    url = url[0];
  }

  // Nếu là URL đầy đủ (http/https), giữ nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Thêm domain của backend cho các đường dẫn hình ảnh
  const backendUrl = process.env.NEXT_PUBLIC_IMAGE_URL;

  // Xử lý đường dẫn tương đối ../images
  if (url.startsWith('../images/')) {
    return url.replace('../images', '/images');
  }

  // Nếu url bắt đầu bằng /images, thêm domain backend
  if (url.startsWith('/images/')) {
    return `${backendUrl}${url}`;
  }

  // Trường hợp còn lại, giả định là tên file trong thư mục images
  return `${backendUrl}/images/${url}`;
};

const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('images', file);

  const response = await fetch(getApiUrl('upload'), {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  return data.path; // Đường dẫn hình ảnh đã upload
}

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [searchError, setSearchError] = useState(''); // Thêm state cho thông báo lỗi
  const [hasInteracted, setHasInteracted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const user = useSelector((state: RootState) => state.user.user);
  const cart = useSelector((state: RootState) => state.cart.items);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();
  // Thêm state cho mobile menu
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Thêm state kiểm tra đã vào client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    };

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [hasInteracted]);

  // Kiểm tra xem có phải trang admin không
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/auth');
  
  // Fetch settings from API - fetch ngay khi component mount
  useEffect(() => {
    if (isAdminPage) return;

    const fetchSettings = async () => {
      try {
        setSettingsLoading(true);
        const response = await fetch(getApiUrl('settings'));
        const settingsData = await response.json();
        const settingObj = Array.isArray(settingsData) ? settingsData[0] : settingsData;
        setSettings(settingObj);
      } catch (error) {
        console.warn('Failed to fetch settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    // Fetch ngay lập tức
    fetchSettings();
  }, [isAdminPage]);

  // Fetch categories from API - fetch ngay khi component mount
  useEffect(() => {
    if (dataLoaded || isAdminPage) return;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(getApiUrl('/categories?an_hien=true'));
        const data = await response.json();
        setCategories(data);
        setDataLoaded(true);
      } catch (error) {
        console.warn('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Fetch ngay lập tức thay vì chờ user interaction
    fetchCategories();
  }, [dataLoaded, isAdminPage]);

  // Xử lý hiệu ứng khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add debug effect
  useEffect(() => {
    if (settings?.Logo) {
      console.log('Settings loaded:', settings.Logo);
    }
  }, [settings]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await fetchApi(API_ENDPOINTS.LOGOUT, {
        method: 'POST'
      });
      
      // Xóa tất cả dữ liệu liên quan đến người dùng
      if (user?.email) {
        localStorage.removeItem(`luckywheel_spun_user_${user.email}`);
        localStorage.removeItem(`luckywheel_result_user_${user.email}`);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch(setUser(null));
      setShowUserDropdown(false);
      router.push("/");
    } catch (error: any) {
      console.warn('Logout error:', error);
      // Vẫn chuyển hướng về trang đăng nhập nếu có lỗi
      router.push("/");
    }
  };

  // Xử lý click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lấy logoUrl đúng chuẩn từ settings.Logo
  const logoUrl = settings?.Logo ? getImageUrl(settings.Logo) : '';

  // Xử lý tìm kiếm sản phẩm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  // Hàm lọc sản phẩm theo từ khóa
  const filterProducts = (products: any[], searchTerm: string) => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    // Tách số từ chuỗi tìm kiếm (ví dụ: "iPhone 15" -> 15)
    const numberInSearch = parseInt(normalizedTerm.match(/\d+/)?.[0] || "0");
    const baseSearchTerm = normalizedTerm.replace(/\d+/g, '').trim(); // Lấy phần chữ (ví dụ: "iPhone 15" -> "iPhone")

    return products.filter(product => {
      if (!product.TenSP) return false;

      const productName = product.TenSP.trim().toLowerCase();
      const productNumber = parseInt(productName.match(/\d+/)?.[0] || "0");

      // Nếu tìm kiếm có số (ví dụ: iPhone 15)
      if (numberInSearch > 0) {
        // Kiểm tra xem tên sản phẩm có chứa phần chữ của từ khóa không
        const hasBaseTerm = productName.includes(baseSearchTerm);

        // Kiểm tra điều kiện số
        const numberMatches = productNumber >= numberInSearch;

        // Chỉ trả về true nếu cả hai điều kiện đều đúng
        return hasBaseTerm && numberMatches;
      }

      return productName.includes(normalizedTerm);
    });
  };

  // Fetch gợi ý sản phẩm khi nhập từ khóa (debounce) - tối ưu hóa
  useEffect(() => {
    if (!showSearch || !searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggest(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(getApiUrl('products?an_hien=true'));
        const data = await res.json();
        if (Array.isArray(data)) {
          const filteredProducts = filterProducts(data, searchTerm)
            .sort((a, b) => {
              // Sắp xếp ưu tiên sản phẩm có tên chứa đúng từ khóa
              const aName = a.TenSP.toLowerCase();
              const bName = b.TenSP.toLowerCase();
              const searchTermLower = searchTerm.toLowerCase();
              const aContains = aName.includes(searchTermLower);
              const bContains = bName.includes(searchTermLower);

              if (aContains && !bContains) return -1;
              if (!aContains && bContains) return 1;

              // Nếu cả hai đều chứa hoặc không chứa, sắp xếp theo độ tương đồng
              return aName.localeCompare(bName);
            })
            .slice(0, 3); // Giảm từ 6 xuống 3 gợi ý

          setSuggestions(filteredProducts);
        }
      } catch (error) {
        console.warn('Failed to fetch search suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 500); // Tăng debounce từ 300ms lên 500ms

    return () => clearTimeout(timeout);
  }, [searchTerm, showSearch]);

  // Nếu là trang admin, không render header
  if (isAdminPage) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}
      style={{ backgroundColor: pathname === '/hero' ? '#000' : '#515154' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              {settingsLoading ? (
                // Loading state cho logo
                <div className="text-white font-bold text-xl animate-pulse">
                  <div className="h-6 w-32 bg-gray-400 rounded"></div>
                </div>
              ) : logoUrl ? (
                <div className="relative w-32 h-13">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={128}
                    height={24}
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                // Fallback logo khi không có settings
                <div className="text-white font-bold text-xl">
                  POLYSMART
                </div>
              )}
            </Link>
          </div>

          {/* Thanh tìm kiếm nổi bật khi showSearch */}
          {showSearch && (
            <>
              {/* Overlay làm mờ/tối nền */}
              <div
                className="fixed inset-0 bg-black bg-opacity-70 z-40"
                onClick={() => setShowSearch(false)}
              />
              {/* Ô tìm kiếm nổi bật */}
              <form
                onSubmit={handleSearch}
                className="fixed left-1/2 top-[-20px] -translate-x-1/2 mt-8 w-[90%] sm:w-[500px] md:w-[760px] z-50"
                autoComplete="off"
                onClick={e => e.stopPropagation()}
              >

                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Tìm kiếm"
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      // Xóa thông báo lỗi khi người dùng bắt đầu nhập
                      if (searchError) setSearchError('');
                    }}
                    className="w-full px-4 py-2 rounded shadow-lg text-black text-base"
                  />
                  {/* Hiển thị thông báo lỗi */}
                  {searchError && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                      {searchError}
                    </div>
                  )}
                  {/* Gợi ý sản phẩm */}
                  {searchTerm && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-80 overflow-y-auto z-50">
                      {loadingSuggest ? (
                        <div className="p-3 text-gray-500 text-sm">Đang tìm...</div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map(product => (
                          <Link
                            key={product._id}
                            href={`/product/${product._id}`}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                            onClick={() => setShowSearch(false)}
                          >
                            <img
                              src={getImageUrl(Array.isArray(product.hinh) ? product.hinh[0] : product.hinh)}
                              alt={product.TenSP}
                              className="w-10 h-10 object-contain rounded border"
                            />
                            <span className="text-sm text-gray-800">{product.TenSP}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-sm">Không tìm thấy sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </>
          )}

          {/* Menu chính */}
          <nav className="hidden lg:flex space-x-8">
            {categoriesLoading ? (
              // Loading state với skeleton
              <div className="flex space-x-8">
                <div className="text-gray-300 px-2 py-1 rounded-md text-sm font-medium animate-pulse">
                  <div className="h-4 w-16 bg-gray-400 rounded"></div>
                </div>
                <div className="text-gray-300 px-2 py-1 rounded-md text-sm font-medium animate-pulse">
                  <div className="h-4 w-12 bg-gray-400 rounded"></div>
                </div>
                <div className="text-gray-300 px-2 py-1 rounded-md text-sm font-medium animate-pulse">
                  <div className="h-4 w-16 bg-gray-400 rounded"></div>
                </div>
                <Link href="/news" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">
                  Tin tức
                </Link>
              </div>
            ) : categories.length > 0 ? (
              <>
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/categories/${category._id}`}
                    className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    {category.ten_danh_muc}
                  </Link>
                ))}
                <Link href="/news" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">
                  Tin tức
                </Link>
              </>
            ) : (
              // Fallback khi không có categories
              <div className="flex space-x-8">
                <Link href="/categories" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">
                  Sản phẩm
                </Link>
                <Link href="/news" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">
                  Tin tức
                </Link>
              </div>
            )}
          </nav>

          {/* Icons bên phải + Hamburger menu */}
          <div className="flex items-center space-x-4">
            {/* Hamburger menu chỉ hiện trên mobile */}
            <button className="text-gray-300 hover:text-white lg:hidden" aria-label="Open menu" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            {/* Search, Cart, User (dropdown) giữ nguyên */}
            <button
              className="text-gray-300 hover:text-white"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-5 h-5" />
            </button>
            <Link href="/cart" className="text-gray-300 hover:text-white relative">
              <ShoppingBag className="w-5 h-5" />
              {isClient && totalQty > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-white text-[10px] font-bold rounded-full border border-gray-200 px-0.5 py-0.5 shadow"
                  style={{
                    minWidth: 12,
                    minHeight: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {totalQty}
                </span>
              )}
            </Link>

            {/* User account with click toggle dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="text-gray-300 hover:text-white flex items-center gap-2"
              >
                {user && user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt="User Avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {user && (
                  <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{user.TenKH}</span>
                )}
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-10">
                  <div className="px-4 py-3">
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          className="block py-2 text-sm text-gray-800 hover:text-gray-600"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          Tài khoản của tôi
                        </Link>
                        {/* <Link
                          href="/orders"
                          className="block py-2 text-sm text-gray-800 hover:text-gray-600"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          Đơn hàng của tôi
                        </Link> */}
                        <div className="my-1 border-t border-gray-200"></div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left py-2 text-sm text-gray-800 hover:text-gray-600"
                        >
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/register"
                          className="block py-2 text-sm text-gray-800 hover:text-gray-600"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          Tạo tài khoản ngay
                        </Link>
                        <div className="my-1 border-t border-gray-200"></div>
                        <Link
                          href="/login"
                          className="block py-2 text-sm text-gray-800 hover:text-gray-600"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          Đăng nhập
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu overlay & drawer */}
      {showMobileMenu && (
  <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setShowMobileMenu(false)}>
          <div
            className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-lg z-50 p-4"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex flex-col space-y-4">
              {categoriesLoading ? (
                // Loading state cho mobile menu
                <>
                  <div className="py-2 px-2">
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="py-2 px-2">
                    <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="py-2 px-2">
                    <div className="h-4 w-18 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <Link href="/news" className="text-gray-800 py-2 px-2 rounded hover:bg-gray-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    Tin tức
                  </Link>
                </>
              ) : categories.length > 0 ? (
                <>
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/categories/${category._id}`}
                      className="text-gray-800 py-2 px-2 rounded hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {category.ten_danh_muc}
                    </Link>
                  ))}
                  <Link href="/news" className="text-gray-800 py-2 px-2 rounded hover:bg-gray-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    Tin tức
                  </Link>
                </>
              ) : (
                // Fallback khi không có categories
                <>
                  <Link href="/categories" className="text-gray-800 py-2 px-2 rounded hover:bg-gray-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    Sản phẩm
                  </Link>
                  <Link href="/news" className="text-gray-800 py-2 px-2 rounded hover:bg-gray-100 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    Tin tức
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;