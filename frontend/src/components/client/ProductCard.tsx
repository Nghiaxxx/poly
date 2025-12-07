"use client";
import React from 'react';
import { Product, Variant } from '@/types/product';
import { ShoppingBag } from 'lucide-react';
import { getVnColorName } from '@/constants/colorMapShared';


// Helper to check if Redux is available
const isReduxAvailable = () => {
  try {
    require('react-redux');
    return true;
  } catch {
    return false;
  }
};

// Safe Redux hooks that work without provider
const useSafeDispatch = () => {
  if (!isReduxAvailable()) return () => {};
  try {
    const { useDispatch } = require('react-redux');
    return useDispatch();
  } catch {
    return () => {};
  }
};

const useSafeSelector = (selector: any) => {
  if (!isReduxAvailable()) return null;
  try {
    const { useSelector } = require('react-redux');
    return useSelector(selector);
  } catch {
    return null;
  }
};

// Hàm lấy URL hình ảnh sản phẩm (copy từ Homepage)
const getImageUrl = (url: string | string[] | undefined | null) => {
  if (Array.isArray(url)) url = url[0];
  if (!url) return '/images/no-image.png';
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) return url;
  const backendUrl = process.env.NEXT_PUBLIC_IMAGE_URL;
  if (typeof url === 'string' && url.startsWith('../images/')) return url.replace('../images', '/images');
  if (typeof url === 'string' && url.startsWith('/images/')) return `${backendUrl}${url}`;
  return `${backendUrl}/images/${url}`;
};

// Hàm map mã màu sang tên màu tiếng Việt (nếu cần)
const mapColorCodeToName = (code?: string) => {
  if (!code) return '';
  return getVnColorName(code);
};

interface ProductCardProps {
  product: Product;
  variant?: Variant;
  style?: React.CSSProperties;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, variant, style }) => {
  const dispatch = useSafeDispatch();
  const user = useSafeSelector((state: any) => state?.user?.user);
  const cartItems = useSafeSelector((state: any) => state?.cart?.items) || [];
  
  
  // Lấy danh sách màu sắc duy nhất từ tất cả variants nếu có
  const colors = product.variants
    ? Array.from(new Set(product.variants.map(v => v.mau).filter(Boolean)))
    : (variant?.mau ? [variant.mau] : []);

  // Handle add to cart click
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn chặn navigation nếu ProductCard nằm trong Link
    e.stopPropagation();

    if (!isReduxAvailable()) {
      
      return;
    }

    if (!product) return;

    // Lấy variant đầu tiên nếu không có variant được chỉ định
    const selectedVariant = variant || product.variants?.[0];
    if (!selectedVariant) return;

    // Track user event nếu user đã đăng nhập
    if (user && user._id) {
      try {
        const { trackUserEvent } = require('@/services/productService');
        trackUserEvent('add_to_cart', product._id, user._id);
      } catch (error) {

      }
    }

    // Thêm vào giỏ hàng
    try {
      const { addToCart } = require('@/store/cartSlice');
      const { showWarningAlert } = require('@/utils/sweetAlert');
      
      // Xác định giá hiện tại và giá gốc
      let currentPrice = selectedVariant.gia || 0;
      let originalPrice = selectedVariant.gia_goc || selectedVariant.gia || 0;
      
      // Nếu có flash sale, tính giá sau giảm theo phần trăm dựa trên giá gốc (gia_goc nếu có, nếu không dùng gia)
      if (selectedVariant?.isFlashSale) {
        const percent = selectedVariant?.flashSaleInfo?.phan_tram_giam || 0;
        const basePrice = (typeof selectedVariant.gia_goc === 'number' && selectedVariant.gia_goc > 0)
          ? selectedVariant.gia_goc
          : (selectedVariant.gia || 0);
        if (percent > 0) {
          currentPrice = Math.max(0, Math.round(basePrice * (1 - percent / 100)));
          originalPrice = basePrice;
        }
      }

      // Ràng buộc Flash Sale: 1 tài khoản chỉ được thêm 1 sản phẩm flash sale cùng loại (theo productId)
      const isFlashSale = Boolean(selectedVariant?.isFlashSale);
      if (isFlashSale) {
        const hasSameFlashSaleInCart = Array.isArray(cartItems) && cartItems.some((item: any) => {
          // cùng loại: cùng productId đã có item flash sale
          return item.productId === product._id && Boolean(item.flashSaleVariantId);
        });
        if (hasSameFlashSaleInCart) {
          showWarningAlert('Sản phẩm Flash Sale', 'Mỗi tài khoản chỉ được thêm 1 sản phẩm Flash Sale cùng loại.');
          return;
        }
      }
      
      dispatch(addToCart({
        productId: product._id,
        variantId: selectedVariant._id,
        name: product.TenSP + (selectedVariant.dung_luong ? ` ${selectedVariant.dung_luong}` : ""),
        price: currentPrice,
        originPrice: originalPrice,
        image: getImageUrl(selectedVariant.hinh || product.hinh),
        colors: product.variants?.map(v => v.mau).filter(Boolean) || [],
        selectedColor: product.variants?.findIndex(v => v._id === selectedVariant._id) || 0,
        colorName: selectedVariant.mau || '',
        quantity: 1,
        flashSaleVariantId: isFlashSale ? selectedVariant._id : undefined,
      }));

      // Hiển thị thông báo thành công với SweetAlert2
      const { showAddToCartSuccess } = require('@/utils/sweetAlert');
      showAddToCartSuccess(product.TenSP);
    } catch (error) {
      
    }
  };

  return (
    <div style={{
      background: '#fff',
      padding: 16,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      minWidth: 0,
      boxSizing: 'border-box',
      position: 'relative',
      ...style
    }}>
      {/* Flash Sale Badge */}
      {variant?.isFlashSale && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'linear-gradient(45deg, #ff4757, #ff3838)',
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
          padding: '4px 8px',
          borderRadius: 12,
          boxShadow: '0 2px 4px rgba(255, 71, 87, 0.3)',
          zIndex: 1
        }}>
          🔥 FLASH SALE
        </div>
      )}
      
      {/* Discount Percentage */}
      {variant?.isFlashSale && variant?.flashSaleInfo?.phan_tram_giam && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: '#ff4757',
          color: 'white',
          fontSize: 11,
          fontWeight: 'bold',
          padding: '4px 6px',
          borderRadius: 8,
          zIndex: 1
        }}>
          -{variant.flashSaleInfo.phan_tram_giam}%
        </div>
      )}
      
      <img
        src={getImageUrl(variant?.hinh?.[0] || product.hinh)}
        alt={product.TenSP}
        style={{ width: 190, height: 190, objectFit: 'cover', borderRadius: 10, background: '#f3f4f6', marginBottom: 10, alignSelf: 'center' }}
        fetchPriority="high"
      />
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, textAlign: 'left', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.TenSP} {variant?.dung_luong ? `${variant.dung_luong}` : ''}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, width: '100%', marginBottom: 2 }}>
        {(() => {
          const percent = variant?.isFlashSale ? (variant?.flashSaleInfo?.phan_tram_giam || 0) : 0;
          const basePrice = (typeof variant?.gia_goc === 'number' && (variant?.gia_goc || 0) > 0)
            ? (variant?.gia_goc as number)
            : (variant?.gia || 0);
          const current = percent > 0 ? Math.max(0, Math.round(basePrice * (1 - percent / 100))) : variant?.gia;
          return (
            <>
              <span style={{ color: variant?.isFlashSale ? '#ff4757' : '#e11d48', fontWeight: 600, fontSize: 13 }}>
                {current?.toLocaleString('vi-VN')}₫
              </span>
              {basePrice && current && basePrice > current && (
                <span style={{ color: '#888', fontSize: 9, textDecoration: 'line-through' }}>{basePrice.toLocaleString('vi-VN')}₫</span>
              )}
            </>
          );
        })()}
      </div>
      
      {/* Flash Sale Info */}
      {variant?.isFlashSale && variant?.flashSaleInfo && (
        <div style={{ fontSize: 11, color: '#ff4757', marginBottom: 4, fontWeight: 500 }}>
          ⚡ Còn lại: {variant.flashSaleInfo.so_luong_con_lai} sản phẩm
        </div>
      )}
      
      {colors.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '6px 0 18px 0', width: '100%' }}>
          <span style={{ fontSize: 13, color: '#555', marginRight: 4 }}>Màu:</span>
          {colors.slice(0, 6).map((color, idx) => (
            <span key={idx} title={mapColorCodeToName(color)} style={{
              display: 'inline-block',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: color,
              border: '1.5px solid #e5e7eb',
              marginRight: 2
            }} />
          ))}
        </div>
      )}
      <button 
        onClick={handleAddToCart}
        style={{
          background: '#fff',
          color: '#374151',
          border: '1px solid #e5e7eb',
          padding: '10px 0',
          fontWeight: 500,
          cursor: 'pointer',
          fontSize: 14,
          width: '100%',
          marginTop: 'auto',
          alignSelf: 'stretch',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'border 0.2s',
        }}
        onMouseOver={e => (e.currentTarget.style.border = '1.5px solid #2563eb')}
        onMouseOut={e => (e.currentTarget.style.border = '1px solid #e5e7eb')}
      >
        <ShoppingBag size={18} style={{marginRight: 4}} />
        Thêm vào giỏ
      </button>
    </div>
  );
};

export default ProductCard; 