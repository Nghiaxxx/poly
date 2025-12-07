"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { clearCart } from "@/store/cartSlice";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { getApiUrl } from "@/config/api";
import { showSuccessModal, showErrorAlert, showWarningAlert, showInfoAlert } from '@/utils/sweetAlert';
import { getVnColorName } from '@/constants/colorMapShared';
import { momoService } from '@/services/momoService';
import { addressService, Address } from '@/services/addressService';
import AddressSelector from '@/components/client/AddressSelector';

// Create a client-only component for the cart items
const CartItems = dynamic(() => Promise.resolve(({ items, formatVND }: { items: any[], formatVND: (num: number) => string }) => (
  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-thin">
    {items.map((item) => (
      <div key={item.variantId} className="flex items-center py-2">
        <div className="relative mr-3">
          <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-sm font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {item.quantity}
          </span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name}</div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
             {item.colorName && (
              <div className="flex items-center gap-2">
                <span className="font-normal">Màu:</span>
                <span
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: item.colorName }}
                  title={getVnColorName(item.colorName)}
                />
                <span>{getVnColorName(item.colorName)}</span>
              </div>
             )}
          </div>
        </div>
        <div className="text-right text-base">
           <div className="font-semibold text-blue-600">{formatVND(item.lineTotal)}</div>
           {/* Hiển thị giá gốc nếu có flash sale hoặc giá gốc khác với giá hiện tại */}
           {(item.hasFlashSale || item.originalItemPrice > item.currentPrice) && (
             <div className="text-gray-500 line-through text-sm">
               {formatVND(item.originalItemPrice * item.quantity)}
             </div>
           )}
           {/* Hiển thị thông báo flash sale và số lượng */}
           {item.hasFlashSale && (
             <div className="text-xs text-red-600 font-semibold">
               ⚡ Flash Sale ({item.qtyWithDiscount}/{item.quantity})
             </div>
           )}
           {/* Hiển thị thông báo nếu có sản phẩm giá gốc */}
           {item.hasFlashSale && item.qtyAtRegularPrice > 0 && (
             <div className="text-xs text-gray-500">
               Giá gốc: {item.qtyAtRegularPrice} sản phẩm
             </div>
           )}
        </div>
      </div>
    ))}
  </div>
)), { ssr: false });

// Create a client-only component for the totals
const OrderTotals = dynamic(() => Promise.resolve(({ totalAmount, shippingFee, formatVND }: { totalAmount: number, shippingFee: number, formatVND: (num: number) => string }) => (
  <div className="space-y-2 mb-6">
    <div className="flex justify-between text-gray-700">
      <span>Tạm tính:</span>
      <span>{formatVND(totalAmount)}</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Phí vận chuyển:</span>
      <span>{formatVND(shippingFee)}</span>
    </div>
    <div className="flex justify-between font-bold text-lg text-gray-800">
      <span>Tổng cộng:</span>
      <span className="text-blue-600">{formatVND(totalAmount + shippingFee)}</span>
    </div>
  </div>
)), { ssr: false });

function formatVND(num: number) {
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export default function PaymentsPage() {
  const cart = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.user.user);
  const router = useRouter();
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);
  const [activeFlashSales, setActiveFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPercent, setVoucherPercent] = useState<number | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  // Phí vận chuyển mặc định
  const SHIPPING_FEE = 0;

  // Hàm lấy số dư ví tiền
  const fetchWalletBalance = async () => {
    if (!user?._id) return;
    
    try {
      setWalletLoading(true);
      const response = await fetch(`${getApiUrl('wallet/balance')}?userId=${user._id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.data.balance);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const [orderLoading, setOrderLoading] = useState(false);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Hàm kiểm tra số lượng hàng trước khi đặt hàng
  const validateInventory = async () => {
    try {
      // Lấy thông tin variant hiện tại từ cart
      const variantIds = cart.map(item => item.variantId);
      
      // Gọi API để lấy thông tin variant mới nhất
      const response = await fetch(getApiUrl(`variants/check-inventory`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantIds })
      });

      if (!response.ok) {
        throw new Error('Không thể kiểm tra tồn kho');
      }

      const inventoryData = await response.json();
      
      // Kiểm tra từng item trong cart
      for (const item of cart) {
        const variantInfo = inventoryData.variants.find((v: any) => v._id === item.variantId);
        
        if (!variantInfo) {
          throw new Error(`Sản phẩm ${item.name} không tồn tại`);
        }
        
        if (variantInfo.so_luong_hang < 0) {
          throw new Error(`Sản phẩm ${item.name} đã hết hàng`);
        }
        
        if (variantInfo.so_luong_hang < item.quantity) {
          throw new Error(`Sản phẩm ${item.name} chỉ còn ${variantInfo.so_luong_hang} sản phẩm, không đủ số lượng yêu cầu (${item.quantity})`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Inventory validation error:', error);
      throw error;
    }
  };

  useEffect(() => {
    setMounted(true);
    setLoading(true);

    const fetchAllData = async () => {
      try {
        const [provincesRes, flashSalesRes] = await Promise.all([
          fetch('https://provinces.open-api.vn/api/?depth=2'),
          fetch(getApiUrl('flashsales/active'))
        ]);
        
        // Lấy số dư ví tiền nếu user đã đăng nhập
        if (user?._id) {
          fetchWalletBalance();
        }
        
        if (!provincesRes.ok) throw new Error('Không lấy được danh sách tỉnh thành');
        const provincesData = await provincesRes.json();
        setProvinces(provincesData);

        const flashSalesData = await flashSalesRes.json();
        if (flashSalesData.data) {
          const allFlashSaleVariants = flashSalesData.data.flatMap((sale: any) =>
            sale.flashSaleVariants.map((variant: any) => ({
              ...variant,
              id_flash_sale: sale._id,
              ten_su_kien: sale.ten_su_kien
            }))
          );
          setActiveFlashSales(allFlashSaleVariants);
        }
      } catch (error) {
        console.error('Lỗi lấy tỉnh thành:', error);
        setProvinces([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedProvinceCode) {
      const selectedProvince = provinces.find(p => p.code === selectedProvinceCode);
      if (selectedProvince && selectedProvince.districts) {
        setDistricts(selectedProvince.districts);
        
        // Cập nhật customerInfo.city với tên tỉnh thành mới
        setCustomerInfo(prev => ({ 
          ...prev, 
          city: selectedProvince.name,
          district: '' // Reset district khi tỉnh thành thay đổi
        }));
        
        console.log('Province changed to:', selectedProvince.name, 'Districts loaded:', selectedProvince.districts.length);
      }
    } else {
      setDistricts([]);
      setCustomerInfo(prev => ({ ...prev, district: '' }));
    }
  }, [selectedProvinceCode, provinces]);

  // Tự động điền thông tin từ user profile
  useEffect(() => {
    if (user && provinces.length > 0) {
      console.log('Auto-filling customer info from user profile:', user);
      
      // Tìm tỉnh thành tương ứng với user.tinh_thanh
      let provinceCode = null;
      if (user.tinh_thanh) {
        const province = provinces.find(p => p.name === user.tinh_thanh);
        if (province) {
          provinceCode = province.code;
          setSelectedProvinceCode(province.code);
        }
      }

      // Cập nhật customerInfo với dữ liệu từ user profile
      setCustomerInfo({
        email: user.email || "",
        fullName: user.TenKH || "",
        phone: user.Sdt || "",
        addressId: "", // Sẽ được cập nhật khi load địa chỉ mặc định
        address: user.dia_chi || "",
        city: user.tinh_thanh || "",
        district: user.quan_huyen || "",
        note: "",
      });

      console.log('Customer info auto-filled:', {
        email: user.email,
        fullName: user.TenKH,
        phone: user.Sdt,
        address: user.dia_chi,
        city: user.tinh_thanh,
        district: user.quan_huyen,
        provinceCode
      });
    }
  }, [user, provinces]);

  // Tự động load địa chỉ mặc định khi user đăng nhập
  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (user?._id) {
        try {
          const addresses = await addressService.getAddressesByUser(user._id);
          const defaultAddress = addresses.find(addr => addr.isDefault);
          
          if (defaultAddress) {
            setCustomerInfo(prev => ({
              ...prev,
              addressId: defaultAddress._id,
              address: defaultAddress.address,
              city: defaultAddress.province,
              district: defaultAddress.district,
              fullName: defaultAddress.name,
              phone: defaultAddress.phone
            }));
            console.log('Đã load địa chỉ mặc định:', defaultAddress);
          }
        } catch (error) {
          console.error('Lỗi khi load địa chỉ mặc định:', error);
        }
      }
    };

    loadDefaultAddress();
  }, [user?._id]);

  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    fullName: "",
    phone: "",
    addressId: "", // ID của địa chỉ được chọn
    address: "",
    city: "",
    district: "",
    note: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    district: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Xử lý khi chọn địa chỉ từ AddressSelector
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setCustomerInfo(prev => ({
      ...prev,
      addressId: address._id,
      address: address.address,
      city: address.province,
      district: address.district,
      fullName: address.name,
      phone: address.phone
    }));
    setShowAddressForm(false);
  };

  const flashSaleMap = useMemo(() => {
    const map = new Map<string, { price: number; available: number; flashSaleVariantId: string }>();
    if (activeFlashSales.length > 0) {
      activeFlashSales.forEach(variant => {
        map.set(variant.id_variant, {
          price: variant.gia_flash_sale,
          available: variant.so_luong - variant.da_ban,
          flashSaleVariantId: variant._id
        });
      });
    }
    return map;
  }, [activeFlashSales]);

  const cartDetails = useMemo(() => {
    // Tạo map để theo dõi số lượng flash sale đã áp dụng cho mỗi variant
    const flashSaleApplied = new Map<string, number>();
    
    // Đầu tiên, tính toán tổng số lượng flash sale đã áp dụng cho mỗi variant
    cart.forEach(item => {
      const flashSaleInfo = flashSaleMap.get(item.variantId);
      if (flashSaleInfo && flashSaleInfo.available > 0) {
        const alreadyApplied = flashSaleApplied.get(item.variantId) || 0;
        flashSaleApplied.set(item.variantId, alreadyApplied + item.quantity);
      }
    });
    
    const itemsWithDetails = cart.map(item => {
      const flashSaleInfo = flashSaleMap.get(item.variantId);
      // Ưu tiên giá hiện tại (price) thay vì giá gốc (originPrice)
      const currentPrice = item.price || item.originPrice || 0;
      const originalPrice = item.originPrice || item.price || 0;
      let lineTotal = currentPrice * item.quantity;
      let hasFlashSale = false;
      let flashSalePrice = null;
      let qtyWithDiscount = 0;
      let qtyAtRegularPrice = item.quantity;

      if (flashSaleInfo && flashSaleInfo.available > 0) {
        // Tính toán số lượng flash sale đã áp dụng trước item này
        const totalAppliedBeforeThisItem = cart
          .filter(cartItem => cartItem.variantId === item.variantId)
          .filter(cartItem => cart.indexOf(cartItem) < cart.indexOf(item))
          .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
        
        // Số lượng flash sale còn lại cho variant này
        const remainingFlashSale = Math.max(0, 1 - totalAppliedBeforeThisItem);
        
        if (remainingFlashSale > 0) {
          qtyWithDiscount = Math.min(item.quantity, remainingFlashSale);
          qtyAtRegularPrice = item.quantity - qtyWithDiscount;
          
          if (qtyWithDiscount > 0) {
            lineTotal = (qtyWithDiscount * flashSaleInfo.price) + (qtyAtRegularPrice * originalPrice);
            hasFlashSale = true;
            flashSalePrice = flashSaleInfo.price;
          }
        }
      }
      
      return {
        ...item,
        lineTotal,
        hasFlashSale,
        flashSalePrice,
        originalItemPrice: originalPrice,
        currentPrice: currentPrice,
        qtyWithDiscount,
        qtyAtRegularPrice,
        // Hiển thị giá phù hợp: flash sale cho sản phẩm đầu tiên, giá gốc cho sản phẩm thứ 2 trở đi
        displayPrice: hasFlashSale && qtyWithDiscount > 0 && flashSaleInfo ? flashSaleInfo.price : originalPrice,
      };
    });

    const total = itemsWithDetails.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items: itemsWithDetails, total };
  }, [cart, flashSaleMap]);

  // Generate structured data for SEO
  const generateStructuredData = () => {
    const items = cartDetails?.items || [];
    const totalAmount = cartDetails?.total || 0;
    
    return {
      "@context": "https://schema.org",
      "@type": "CheckoutPage",
      "name": "Thanh toán đơn hàng",
      "description": "Trang thanh toán an toàn cho đơn hàng của bạn với nhiều phương thức thanh toán",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "potentialAction": {
        "@type": "OrderAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": typeof window !== 'undefined' ? window.location.href : ''
        }
      },
      "offers": items.map(item => ({
        "@type": "Offer",
        "name": item.name,
        "price": item.price,
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock",
        "image": item.image
      })),
      "totalPrice": totalAmount,
      "priceCurrency": "VND"
    };
  };

  if (loading || !mounted) {
     return (
      <>
        <Head>
          <title>Thanh toán đơn hàng - Đang tải | TechStore</title>
          <meta name="description" content="Đang tải trang thanh toán an toàn cho đơn hàng của bạn" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Đang tải trang thanh toán...</p>
        </div>
      </>
     )
  }

  const handleApplyVoucher = async () => {
    setVoucherError('');
    setVoucherApplied(false);
    setVoucherPercent(null);
    setVoucherDiscount(0);
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }
    try {
      // Sử dụng API thống nhất để kiểm tra tất cả loại voucher
      const userEmail = customerInfo.email || user?.email || '';
      const res = await fetch(getApiUrl(`vouchers/apply/${voucherCode.trim()}?user_email=${encodeURIComponent(userEmail)}`));
      const data = await res.json();
      
      console.log('Voucher API response:', data); // DEBUG
      
      if (data.success && data.data) {
        const voucher = data.data;
        
        // Xử lý theo loại voucher
        if (voucher.loai === 'gift') {
          // Gift voucher: kiểm tra trạng thái và người nhận
          if (voucher.da_vo_hieu_hoa) {
            setVoucherError('Voucher này đã bị vô hiệu hóa');
            return;
          }
          if (voucher.da_su_dung > 0) {
            setVoucherError('Voucher này đã được sử dụng');
            return;
          }
          if (new Date() > new Date(voucher.ngay_ket_thuc)) {
            setVoucherError('Voucher này đã hết hạn');
            return;
          }
          
          const phan_tram = voucher.phan_tram_giam_gia || 0;
          const giam_toi_da = voucher.giam_toi_da || Infinity;
          setVoucherPercent(phan_tram);
          setVoucherApplied(true);
          
          // Tính số tiền giảm, có giới hạn tối đa
          const rawDiscount = Math.floor((cartDetails.total * phan_tram) / 100);
          const discount = Math.min(rawDiscount, giam_toi_da);
          console.log('Gift voucher discount:', discount); // DEBUG
          setVoucherDiscount(discount);
          
        } else if (voucher.loai === 'public') {
          // Public voucher: kiểm tra thời gian và số lượng
          const now = new Date();
          if (voucher.trang_thai !== 'active') {
            setVoucherError('Mã giảm giá đã hết hiệu lực');
            return;
          }
          if (now < new Date(voucher.ngay_bat_dau)) {
            setVoucherError('Mã giảm giá chưa đến ngày sử dụng');
            return;
          }
          if (now > new Date(voucher.ngay_ket_thuc)) {
            setVoucherError('Mã giảm giá đã hết hạn');
            return;
          }
          if (voucher.da_su_dung >= voucher.so_luong) {
            setVoucherError('Mã giảm giá đã hết lượt sử dụng');
            return;
          }
          
          const phan_tram = voucher.phan_tram_giam_gia || 0;
          const giam_toi_da = voucher.giam_toi_da || Infinity;
          setVoucherPercent(phan_tram);
          setVoucherApplied(true);
          
          // Tính số tiền giảm, có giới hạn tối đa
          const rawDiscount = Math.floor((cartDetails.total * phan_tram) / 100);
          const discount = Math.min(rawDiscount, giam_toi_da);
          console.log('Public voucher discount:', discount); // DEBUG
          setVoucherDiscount(discount);
          
        } else {
          setVoucherError('Loại voucher không được hỗ trợ');
        }
        
      } else {
        setVoucherError(data.message || 'Mã giảm giá không hợp lệ hoặc đã được sử dụng/vô hiệu hóa');
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra voucher:', err);
      setVoucherError('Có lỗi khi kiểm tra mã giảm giá');
    }
  };

  const validateForm = () => {
    const errors = {
      email: "",
      fullName: "",
      phone: "",
      address: "",
      city: "",
      district: "",
    };

    // Validate email
    if (!customerInfo.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      errors.email = "Email không hợp lệ";
    }

    // Validate full name
    if (!customerInfo.fullName.trim()) {
      errors.fullName = "Họ và tên là bắt buộc";
    } else if (customerInfo.fullName.trim().length < 2) {
      errors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    // Validate phone
    if (!customerInfo.phone.trim()) {
      errors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10,11}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
      errors.phone = "Số điện thoại không hợp lệ (10-11 số)";
    }

        // Validate address
    if (!customerInfo.addressId) {
      errors.address = "Vui lòng chọn địa chỉ giao hàng";
    } else if (!customerInfo.address.trim()) {
      errors.address = "Địa chỉ là bắt buộc";
    } else if (!customerInfo.city.trim()) {
      errors.city = "Tỉnh thành là bắt buộc";
    } else if (!customerInfo.district.trim()) {
      errors.district = "Quận huyện là bắt buộc";
    }

    setValidationErrors(errors);
    return !Object.values(errors).some(error => error !== "");
  };

  const handlePlaceOrder = async () => {
    if (orderLoading) return; // Chặn double submit
    
    // Validate form before proceeding
    if (!validateForm()) {
      setOrderLoading(false);
      return;
    }
    
    setOrderLoading(true);
    try {

      // Create order data with proper flash sale mapping
      const orderData = {
        customerInfo: {
          ...customerInfo,
          userId: user?._id || undefined
        },
        items: cartDetails.items.map(item => {
          const flashSaleInfo = flashSaleMap.get(item.variantId);
          return {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            oldPrice: item.originPrice,
            name: item.name,
            image: item.image,
            colorName: item.colorName,
            // Map flash sale fields correctly
            isFlashSale: item.hasFlashSale || false,
            flashSaleVariantId: flashSaleInfo?.flashSaleVariantId || item.flashSaleVariantId || undefined
          };
        }),
        totalAmount: cartDetails.total - voucherDiscount,
        paymentMethod,
        voucher: voucherApplied ? {
          code: voucherCode,
          percent: voucherPercent,
          discount: voucherDiscount
        } : undefined,
      };

      // Handle different payment methods
      switch (paymentMethod) {
        case "cod":
          try {
            // Kiểm tra tồn kho trước khi đặt hàng
            await validateInventory();
            
            console.log("Order Data:", orderData);
            console.log("API URL:", getApiUrl('orders'));
            const res = await fetch(getApiUrl('orders'), {
              method: 'POST',
              body: JSON.stringify(orderData),
              headers: { 'Content-Type': 'application/json' }
            });
            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Response data:", data);

            if (res.ok) {
              dispatch(clearCart()); // Clear cart after successful order
              showSuccessModal('Thành công!', 'Đặt hàng thành công! Đang chuyển hướng...', () => {
                router.push('/payment-result?status=success');
              });
            } else {
              showErrorAlert('Thất bại!', `Đặt hàng thất bại! ${data.message || 'Vui lòng thử lại.'}`);
              router.push('/payment-result?status=fail');
            }
          } catch (error: any) {
            console.error('Order creation error:', error);
            showErrorAlert('Lỗi!', error.message || 'Không thể đặt hàng. Vui lòng thử lại.');
          }
          break;

        case "atm":
          try {
            // Kiểm tra tồn kho trước khi đặt hàng
            await validateInventory();
            
            // Tạo đơn hàng trước
            const orderResponse = await fetch(getApiUrl('orders'), {
              method: 'POST',
              body: JSON.stringify(orderData),
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!orderResponse.ok) {
              throw new Error('Không thể tạo đơn hàng');
            }
            
            const orderResult = await orderResponse.json();
            const orderId = orderResult.order?.id || orderResult.order?._id;
            
            if (!orderId) {
              throw new Error('Không nhận được mã đơn hàng');
            }
            
            // Hiển thị thông báo chuyển hướng
            dispatch(clearCart()); // Clear cart after successful order
            showSuccessModal(
              'Chuyển hướng thanh toán', 
              'Đang chuyển đến trang thanh toán ATM/Internet Banking...', 
              () => {
                router.push(`/payment/banking/${orderId}`);
              }
            );
          } catch (error: any) {
            console.error('Error creating order for ATM payment:', error);
            showErrorAlert('Lỗi!', error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
          }
          return;

        case "momo":
          try {
            // Kiểm tra tồn kho trước khi đặt hàng
            await validateInventory();
            
            // Tạo đơn hàng trước
            const orderResponse = await fetch(getApiUrl('orders'), {
              method: 'POST',
              body: JSON.stringify(orderData),
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!orderResponse.ok) {
              throw new Error('Không thể tạo đơn hàng');
            }
            
            const orderResult = await orderResponse.json();
            const orderId = orderResult.order?.id || orderResult.order?._id;
            
            if (!orderId) {
              throw new Error('Không nhận được mã đơn hàng');
            }
            
            // Tạo yêu cầu thanh toán MOMO
            const momoResult = await momoService.createPayment({
              orderId: orderId,
              amount: cartDetails.total - voucherDiscount,
              orderInfo: `Thanh toan don hang TechStore - ${orderId}`
            });
            
            if (momoResult.success && momoResult.data?.payUrl) {
              dispatch(clearCart()); // Clear cart after successful order
              showSuccessModal(
                'Chuyển hướng thanh toán MOMO', 
                'Đang chuyển đến trang thanh toán MOMO...', 
                () => {
                  if (momoResult.data?.payUrl) {
                    momoService.openMomoPayment(momoResult.data.payUrl);
                    router.push(`/payment/momo/${orderId}`);
                  }
                }
              );
            } else {
              throw new Error(momoResult.message || 'Lỗi tạo yêu cầu thanh toán MOMO');
            }
          } catch (error: any) {
            console.error('Error creating order for MOMO payment:', error);
            showErrorAlert('Lỗi!', error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
          }
          return;

        case "wallet":
          try {
            // Kiểm tra tồn kho trước khi đặt hàng
            await validateInventory();
            
            // Kiểm tra số dư ví có đủ không
            if (!walletBalance || walletBalance < (cartDetails.total - voucherDiscount)) {
              throw new Error(`Số dư ví không đủ. Cần: ${formatVND(cartDetails.total - voucherDiscount)}, Hiện có: ${formatVND(walletBalance || 0)}`);
            }
            
            // Tạo đơn hàng trước
            const orderResponse = await fetch(getApiUrl('orders'), {
              method: 'POST',
              body: JSON.stringify(orderData),
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!orderResponse.ok) {
              throw new Error('Không thể tạo đơn hàng');
            }
            
            const orderResult = await orderResponse.json();
            const orderId = orderResult.order?.id || orderResult.order?._id;
            
            if (!orderId) {
              throw new Error('Không nhận được mã đơn hàng');
            }
            
            // Thanh toán bằng ví tiền
            const walletPaymentResponse = await fetch(getApiUrl('wallet/pay-order'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                userId: user?._id,
                orderId: orderId,
                amount: cartDetails.total - voucherDiscount,
                idempotencyKey: `pay_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              })
            });
            
            if (!walletPaymentResponse.ok) {
              throw new Error('Thanh toán bằng ví tiền thất bại');
            }
            
            const walletPaymentResult = await walletPaymentResponse.json();
            
            if (walletPaymentResult.success) {
              // Cập nhật order status thành paid
              await fetch(getApiUrl(`orders/${orderId}/payment`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  paymentStatus: 'paid',
                  walletTransactionId: walletPaymentResult.data._id
                })
              });
              
              dispatch(clearCart()); // Clear cart after successful order
              showSuccessModal(
                'Thanh toán thành công!', 
                'Đơn hàng đã được thanh toán bằng ví PolyPay!', 
                () => {
                  router.push('/payment-result?status=success');
                }
              );
              
              // Refresh wallet balance
              fetchWalletBalance();
            } else {
              throw new Error(walletPaymentResult.message || 'Thanh toán bằng ví tiền thất bại');
            }
          } catch (error: any) {
            console.error('Error creating order for wallet payment:', error);
            showErrorAlert('Lỗi!', error.message || 'Không thể đặt hàng. Vui lòng thử lại.');
          }
          return;

        default:
          showErrorAlert('Lỗi!', 'Vui lòng chọn phương thức thanh toán!');
          setOrderLoading(false);
          return;
      }
    } catch (err) {
      showErrorAlert('Lỗi!', 'Có lỗi khi đặt hàng! Vui lòng thử lại.');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Thanh toán đơn hàng - TechStore | An toàn & Nhanh chóng</title>
        <meta name="description" content="Thanh toán đơn hàng an toàn với nhiều phương thức: COD, ATM/Internet Banking. Giao hàng toàn quốc, hỗ trợ 24/7." />
        <meta name="keywords" content="thanh toán, đặt hàng, COD, ATM, internet banking, giao hàng, techstore" />
        <meta name="author" content="TechStore" />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Thanh toán đơn hàng - TechStore" />
        <meta property="og:description" content="Thanh toán đơn hàng an toàn với nhiều phương thức thanh toán" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:site_name" content="TechStore" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Thanh toán đơn hàng - TechStore" />
        <meta name="twitter:description" content="Thanh toán đơn hàng an toàn với nhiều phương thức thanh toán" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData())
          }}
        />
      </Head>
      
      <main className="min-h-screen bg-gray-100 py-8">
<div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg flex flex-col md:flex-row">
          {/* Left Column - Shipping and Payment Info */}
          <section className="w-full md:w-3/5 p-4 md:p-8" aria-labelledby="shipping-heading">
            {/* Shipping Information */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h1 id="shipping-heading" className="text-xl font-semibold text-gray-800">Thông tin nhận hàng</h1>
                
              </div>
              <form className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input 
                    id="email"
                    type="email" 
                    placeholder="Email *" 
                    className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`} 
                    value={customerInfo.email} 
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, email: e.target.value});
                      if (validationErrors.email) {
                        setValidationErrors({...validationErrors, email: "", district: ""});
                      }
                    }} 
                    aria-describedby={validationErrors.email ? "email-error" : undefined}
                    required
                  />
                  {validationErrors.email && <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">{validationErrors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="fullName" className="sr-only">Họ và tên</label>
                  <input 
                    id="fullName"
                    type="text" 
                    placeholder="Họ và tên *" 
                    className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.fullName ? 'border-red-500' : 'border-gray-300'}`} 
                    value={customerInfo.fullName} 
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, fullName: e.target.value});
                      if (validationErrors.fullName) {
                        setValidationErrors({...validationErrors, fullName: "", district: ""});
                      }
                    }} 
                    aria-describedby={validationErrors.fullName ? "fullName-error" : undefined}
                    required
                  />
                  {validationErrors.fullName && <p id="fullName-error" className="text-red-500 text-sm mt-1" role="alert">{validationErrors.fullName}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="sr-only">Số điện thoại</label>
                  <input 
                    id="phone"
                    type="tel" 
                    placeholder="Số điện thoại *" 
                    className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`} 
                    value={customerInfo.phone} 
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, phone: e.target.value});
                      if (validationErrors.phone) {
                        setValidationErrors({...validationErrors, phone: "", district: ""});
                      }
                    }} 
                    aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                    required
                  />
                  {validationErrors.phone && <p id="phone-error" className="text-red-500 text-sm mt-1" role="alert">{validationErrors.phone}</p>}
                </div>
                
                {/* Chọn địa chỉ giao hàng */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Địa chỉ giao hàng *
                  </label>
                  
                  {user?._id ? (
                    <div className="space-y-4">
                      {/* Hiển thị địa chỉ đã chọn */}
                      {selectedAddress && (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">
                                  {selectedAddress.name}
                                </span>
                                <span className="text-gray-500">
                                  (+84) {selectedAddress.phone.replace(/^0/, '')}
                                </span>
                                {selectedAddress.isDefault && (
                                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700">
                                {selectedAddress.address}, {selectedAddress.district}, {selectedAddress.province}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(true)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Thay đổi
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Form chọn địa chỉ */}
                      {showAddressForm && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <AddressSelector
                            userId={user._id}
                            selectedAddressId={selectedAddress?._id}
                            onAddressSelect={handleAddressSelect}
                            showAddNew={true}
                            onAddNew={() => {
                              showInfoAlert('Thông báo', 'Vui lòng vào trang Profile > Địa chỉ nhận hàng để thêm địa chỉ mới');
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Nút mở form chọn địa chỉ */}
                      {!selectedAddress && !showAddressForm && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(true)}
                          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                        >
                          + Chọn địa chỉ giao hàng
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Vui lòng đăng nhập để chọn địa chỉ giao hàng
                    </div>
                  )}
                  
                  {validationErrors.address && (
                    <p id="address-error" className="text-red-500 text-sm mt-1" role="alert">
                      {validationErrors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="note" className="sr-only">Ghi chú</label>
                  <textarea 
                    id="note"
                    placeholder="Ghi chú (tùy chọn)" 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
                    value={customerInfo.note} 
                    onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                  ></textarea>
                </div>
              </form>
            </div>

            {/* Shipping Method */}
            <section className="mb-8" aria-labelledby="shipping-method-heading">
              <h2 id="shipping-method-heading" className="text-xl font-semibold text-gray-800 mb-4">Vận chuyển</h2>
              <div className="p-4 bg-blue-100 text-blue-800 rounded-lg" role="status">
                Vui lòng nhập thông tin giao hàng
              </div>
            </section>

            {/* Payment Method */}
            <section aria-labelledby="payment-method-heading">
              <h2 id="payment-method-heading" className="text-xl font-semibold text-gray-800 mb-4">Thanh toán</h2>
              <fieldset className="space-y-3">
                <legend className="sr-only">Chọn phương thức thanh toán</legend>
                
                {/* COD Payment */}
                <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="form-radio h-5 w-5 text-blue-600"
                      aria-describedby="cod-description"
                    />
                    <span className="ml-3 text-lg font-medium text-gray-800">Thanh toán khi giao hàng (COD)</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9.75h19.5M2.25 12h19.5m-16.5 4.5h.008v.008h-.008V16.5zm.375 0h.008v.008h-.008V16.5zm-.375 3h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm5.625-5.25h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm-.375 3h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm5.625-5.25h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm-.375 3h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008z" />
                  </svg>
                </label>

                {/* ATM Payment */}
                <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="atm"
                      checked={paymentMethod === "atm"}
                      onChange={() => setPaymentMethod("atm")}
                      className="form-radio h-5 w-5 text-blue-600"
                      aria-describedby="atm-description"
                    />
                    <span className="ml-3 text-lg font-medium text-gray-800">Thanh toán ATM/Internet Banking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9.75h19.5M2.25 12h19.5m-16.5 4.5h.008v.008h-.008V16.5zm.375 0h.008v.008h-.008V16.5zm-.375 3h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm5.625-5.25h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm-.375 3h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm5.625-5.25h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008zm-.375 3h.008v.008h-.008v-.008zm.375 0h.008v.008h-.008v-.008z" />
                    </svg>
                    <span className="text-xs text-blue-600 font-medium">VietQR</span>
                  </div>
                </label>

                {/* MOMO Payment */}
                <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="momo"
                      checked={paymentMethod === "momo"}
                      onChange={() => setPaymentMethod("momo")}
                      className="form-radio h-5 w-5 text-blue-600"
                      aria-describedby="momo-description"
                    />
                    <span className="ml-3 text-lg font-medium text-gray-800">Thanh toán qua MOMO</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-pink-600" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.482-.22-2.121-.659-1.172-.879-1.172-2.303 0-3.182s3.07-.879 4.242 0l.879.659" />
                    </svg>
                    <span className="text-xs text-pink-600 font-medium">MOMO</span>
                  </div>
                </label>

                {/* PolyPay Wallet Payment */}
                <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                      className="form-radio h-5 w-5 text-blue-600"
                      aria-describedby="wallet-description"
                    />
                    <span className="ml-3 text-lg font-medium text-gray-800">Thanh toán bằng ví PolyPay</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-xs text-purple-600 font-medium">PolyPay</span>
                  </div>
                </label>
              </fieldset>

              {/* Payment Method Descriptions */}
              {paymentMethod === "cod" && (
                <div id="cod-description" className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" role="status">
                  Bạn sẽ thanh toán bằng tiền mặt khi nhận được hàng.
                </div>
              )}
              {paymentMethod === "atm" && (
                <div id="atm-description" className="mt-4 p-4 border border-blue-300 rounded-lg bg-blue-50 text-blue-700" role="status">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium mb-1">Thanh toán qua Internet Banking</p>
                      <ul className="text-sm space-y-1">
                        <li>• Hỗ trợ tất cả ngân hàng nội địa</li>
                        <li>• Thanh toán an toàn qua VietQR</li>
                        <li>• Xác nhận thanh toán tự động</li>
                        <li>• Không mất phí giao dịch</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {paymentMethod === "momo" && (
                <div id="momo-description" className="mt-4 p-4 border border-pink-300 rounded-lg bg-pink-50 text-pink-700" role="status">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium mb-1">Thanh toán qua MOMO</p>
                      <ul className="text-sm space-y-1">
                        <li>• Thanh toán nhanh chóng và an toàn</li>
                        <li>• Hỗ trợ ví điện tử MOMO</li>
                        <li>• Xác nhận thanh toán tự động</li>
                        <li>• Không mất phí giao dịch</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {paymentMethod === "wallet" && (
                <div id="wallet-description" className="mt-4 p-4 border border-purple-300 rounded-lg bg-purple-50 text-purple-700" role="status">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium mb-1">Thanh toán bằng ví PolyPay</p>
                      <ul className="text-sm space-y-1">
                        <li>• Thanh toán nhanh chóng bằng số dư ví</li>
                        <li>• Số dư hiện tại: <span className="font-semibold">{walletBalance ? formatVND(walletBalance) : 'Đang tải...'}</span></li>
                        <li>• Không mất phí giao dịch</li>
                        <li>• Xác nhận thanh toán ngay lập tức</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </section>

          {/* Right Column - Order Summary */}
          <aside className="w-full md:w-2/5 bg-[#F8F9FA] p-4 md:p-8" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading" className="text-xl font-semibold text-gray-800 mb-6">
              Đơn hàng ({cartDetails.items.length} sản phẩm)
            </h2>

            <CartItems items={cartDetails.items} formatVND={formatVND} />

            <div className="border-t my-6"></div>

            {/* Discount Code */}
            <section className="mb-4" aria-labelledby="discount-heading">
              <h3 id="discount-heading" className="sr-only">Mã giảm giá</h3>
              <div className="flex mb-2">
                <label htmlFor="voucherCode" className="sr-only">Nhập mã giảm giá</label>
                <input
                  id="voucherCode"
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  className="w-full p-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  disabled={voucherApplied}
                  aria-describedby={voucherError ? "voucher-error" : voucherApplied ? "voucher-success" : undefined}
                />
                <button
                  className="px-6 bg-gray-300 text-gray-700 font-semibold rounded-r-lg hover:bg-gray-400"
                  onClick={handleApplyVoucher}
                  type="button"
                  disabled={voucherApplied}
                  aria-describedby="voucher-button-desc"
                >
                  {voucherApplied ? 'Đã áp dụng' : 'Áp dụng'}
                </button>
              </div>
              <div id="voucher-button-desc" className="sr-only">Nút để áp dụng mã giảm giá</div>
              {voucherError && <div id="voucher-error" className="text-red-500 mb-2" role="alert">{voucherError}</div>}
              {voucherApplied && voucherPercent && (
                <div id="voucher-success" className="text-green-600 mb-2" role="status">
                  Đã áp dụng mã giảm giá: -{formatVND(voucherDiscount)} ({voucherPercent}%)
                </div>
              )}
            </section>
       
            {/* Order Totals with Discount Line */}
            <section className="space-y-2 mb-6" aria-labelledby="order-totals-heading">
              <h3 id="order-totals-heading" className="sr-only">Tổng đơn hàng</h3>
              <div className="flex justify-between text-gray-700">
                <span>Tạm tính:</span>
                <span>{formatVND(cartDetails.total)}</span>
              </div>
              {voucherApplied && voucherDiscount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Giảm giá:</span>
                  <span>-{formatVND(voucherDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg text-gray-800">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{formatVND(cartDetails.total - voucherDiscount)}</span>
              </div>
            </section>

            <div className="flex items-center justify-between mt-8">
              <button 
                onClick={() => router.push('/cart')} 
                className="text-blue-600 font-semibold flex items-center gap-2 hover:underline"
                aria-label="Quay về giỏ hàng"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Quay về giỏ hàng
              </button>
              <button 
                onClick={handlePlaceOrder} 
                disabled={orderLoading} 
                className="bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                aria-describedby={orderLoading ? "order-loading" : undefined}
              >
                {orderLoading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
              {orderLoading && <div id="order-loading" className="sr-only">Đang xử lý đơn hàng</div>}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
