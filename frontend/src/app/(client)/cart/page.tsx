"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { removeFromCart, changeQuantity, clearCart, setCart } from '@/store/cartSlice';
import { useRouter } from 'next/navigation';
import { getApiUrl } from "@/config/api";
import { showInfoAlert, showSuccessModal, showErrorAlert, showWarningAlert } from '@/utils/sweetAlert';
import { getVnColorName } from '@/constants/colorMapShared';
import LoginRequiredModal from '@/components/client/LoginRequiredModal';

function formatVND(num: number) {
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export default function CartPage() {
  const cart = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.user.user);
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const dispatch = useDispatch();
  const [customer, setCustomer] = useState({ name: "", phone: "", gender: "Anh" });
  const [delivery, setDelivery] = useState({ method: "home", city: "", address: "", note: "", invoice: false });
  const [agree, setAgree] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [activeFlashSales, setActiveFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [isClient, setIsClient] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    const fetchFlashSales = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl('flashsales/active'));
        const data = await res.json();
        if (data.data) {
          const allFlashSaleVariants = data.data.flatMap((sale: any) =>
            sale.flashSaleVariants.map((variant: any) => ({
              ...variant,
              id_flash_sale: sale._id,
              ten_su_kien: sale.ten_su_kien
            }))
          );
          setActiveFlashSales(allFlashSaleVariants);
        }
      } catch (error) {
        console.error("Failed to fetch flash sales", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlashSales();
  }, []);

  // Khởi tạo quantityInputs khi cart thay đổi
  useEffect(() => {
    if (cart.length > 0) {
      const initialInputs: { [key: string]: string } = {};
      cart.forEach(item => {
        const inputKey = `${item.productId}-${item.variantId}`;
        initialInputs[inputKey] = item.quantity.toString();
      });
      setQuantityInputs(initialInputs);
    }
  }, [cart]);

  // Realtime inventory polling for items in cart (every 20s)
  useEffect(() => {
    if (!isClient || cart.length === 0) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const variantIds = Array.from(new Set(cart.map(i => i.variantId)));
        const res = await fetch(getApiUrl('variants/check-inventory'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const inventoryMap = new Map<string, number>();
        (data.variants || []).forEach((v: any) => inventoryMap.set(v._id, v.so_luong_hang));
        // Clamp any cart item quantities that exceed stock
        const next = cart.map(item => {
          const stock = inventoryMap.get(item.variantId);
          if (typeof stock === 'number' && stock >= 0 && item.quantity > stock) {
            return { ...item, quantity: Math.max(0, stock) };
          }
          return item;
        });
        // Only update if changed
        const changed = next.some((n, i) => n.quantity !== cart[i].quantity);
        if (changed) {
          dispatch(setCart(next));
        }
      } catch (e) {
        // ignore polling errors
      }
    };

    const id = setInterval(poll, 20000);
    // trigger immediately once
    poll();
    return () => { cancelled = true; clearInterval(id); };
  }, [isClient, cart, dispatch]);


  const handleRemove = (idx: number) => {
    const item = cart[idx];
    dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }));
  };


  const handleChangeQty = async (idx: number, delta: number) => {
    const item = cart[idx];
    const inputKey = `${item.productId}-${item.variantId}`;
    
    // Kiểm tra giới hạn số lượng tối thiểu là 1
    if (delta < 0 && item.quantity <= 1) {
      return; // Không cho phép giảm xuống dưới 1
    }
    
    // Kiểm tra giới hạn số lượng tối đa là 5
    if (delta > 0 && item.quantity >= 5) {
      showWarningAlert('Thông báo', 'Số lượng tối đa cho mỗi sản phẩm là 5!');
      return;
    }
    
    // Kiểm tra xem item này có phải flash sale không
    const flashSaleInfo = flashSaleMap.get(item.variantId);
    const isFlashSaleItem = flashSaleInfo && flashSaleInfo.available > 0;
    
    if (isFlashSaleItem) {
      // Nếu là flash sale và đang cố gắng tăng số lượng
      if (delta > 0) {
        // Kiểm tra xem đã có sản phẩm flash sale này trong giỏ hàng chưa
        const existingFlashSaleItems = cart.filter(cartItem => 
          cartItem.variantId === item.variantId && 
          cartItem.productId === item.productId
        );
        
        // Nếu đã có sản phẩm flash sale này, không cho phép tăng số lượng
        if (existingFlashSaleItems.length > 0) {
          showWarningAlert('Thông báo', 'Chỉ được mua 1 sản phẩm flash sale cho mỗi loại sản phẩm!');
          return;
        }
      }
    }
    
    // Kiểm tra tồn kho trước khi thay đổi số lượng (chỉ khi tăng)
    if (delta > 0) {
      try {
        const res = await fetch(getApiUrl('variants/check-inventory'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds: [item.variantId] })
        });
        const data = await res.json();
        if (!res.ok) {
          showErrorAlert('Lỗi', data.message || 'Không thể kiểm tra tồn kho');
          return;
        }
        const variantInfo = (data.variants || []).find((v: any) => v._id === item.variantId);
        if (!variantInfo) {
          showErrorAlert('Lỗi', 'Sản phẩm không tồn tại');
          return;
        }
        const desiredQty = item.quantity + delta;
        if (variantInfo.so_luong_hang < desiredQty) {
          showWarningAlert('Hết hàng', `Chỉ còn ${variantInfo.so_luong_hang} sản phẩm trong kho`);
          return;
        }
      } catch (e) {
        console.error('Inventory check failed:', e);
        showErrorAlert('Lỗi', 'Không thể kiểm tra tồn kho. Vui lòng thử lại.');
        return;
      }
    }

    dispatch(changeQuantity({ productId: item.productId, variantId: item.variantId, delta }));
    
    // Cập nhật local state sau khi dispatch thành công
    const newQuantity = item.quantity + delta;
    setQuantityInputs(prev => ({
      ...prev,
      [inputKey]: newQuantity.toString()
    }));
  };

  const handleQuantityInputChange = (idx: number, newQuantity: string) => {
    const item = cart[idx];
    const inputKey = `${item.productId}-${item.variantId}`;
    
    // Cập nhật local state để hiển thị ngay lập tức
    setQuantityInputs(prev => ({
      ...prev,
      [inputKey]: newQuantity
    }));
  };

  const handleQuantityBlur = (idx: number) => {
    const item = cart[idx];
    const inputKey = `${item.productId}-${item.variantId}`;
    const currentInputValue = quantityInputs[inputKey];
    
    // Nếu input rỗng, reset về giá trị gốc
    if (!currentInputValue || currentInputValue === '') {
      setQuantityInputs(prev => ({
        ...prev,
        [inputKey]: item.quantity.toString()
      }));
      return;
    }
    
    const quantity = parseInt(currentInputValue);
    
    // Nếu không phải số hoặc nhỏ hơn hoặc bằng 0, reset về giá trị gốc
    if (isNaN(quantity) || quantity <= 0) {
      setQuantityInputs(prev => ({
        ...prev,
        [inputKey]: item.quantity.toString()
      }));
      return;
    }

    // Tự động chuyển về 5 nếu nhập số lớn hơn 5
    const finalQuantity = quantity > 5 ? 5 : quantity;
    
    // Kiểm tra flash sale
    const flashSaleInfo = flashSaleMap.get(item.variantId);
    const isFlashSaleItem = flashSaleInfo && flashSaleInfo.available > 0;
    
    if (isFlashSaleItem && finalQuantity > 1) {
      showWarningAlert('Thông báo', 'Chỉ được mua 1 sản phẩm flash sale cho mỗi loại sản phẩm!');
      setQuantityInputs(prev => ({
        ...prev,
        [inputKey]: item.quantity.toString()
      }));
      return;
    }
    
    // Nếu số lượng thay đổi, cập nhật Redux store
    if (finalQuantity !== item.quantity) {
      const delta = finalQuantity - item.quantity;
      dispatch(changeQuantity({ productId: item.productId, variantId: item.variantId, delta }));
      setQuantityInputs(prev => ({
        ...prev,
        [inputKey]: finalQuantity.toString()
      }));
    }
  };

  const flashSaleMap = useMemo(() => {
    const map = new Map<string, { price: number; available: number }>();
    if (activeFlashSales.length > 0) {
      activeFlashSales.forEach(variant => {
        map.set(variant.id_variant, {
          price: variant.gia_flash_sale,
          available: variant.so_luong - variant.da_ban,
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

  if (loading && isClient) {
    return (
      <div className="bg-[#f5f5f7] min-h-screen py-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-lg">Đang cập nhật giá và khuyến mãi...</p>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = () => {
    // Kiểm tra đăng nhập trước khi cho phép thanh toán
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (paymentMethod === "cod") {
      // Hiển thị modal thành công và chuyển hướng
      dispatch(clearCart()); // Clear cart after successful order
      showSuccessModal(
        'Đặt hàng thành công!', 
        'Hóa đơn của bạn đã được gửi về số điện thoại đã đăng ký.',
        () => {
          router.push('/');
        }
      );
    } else {
      // Handle other payment methods here (ATM, MoMo)
      showInfoAlert('Thông báo', `Chức năng thanh toán ${paymentMethod} đang được phát triển.`);
    }
  };

  const handleCheckout = () => {
    // Kiểm tra đăng nhập trước khi chuyển đến trang thanh toán
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    router.push('/payments');
  };

  return (
    <div className="bg-[#f5f5f7] min-h-screen py-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {!isClient ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">Đang tải nội dung giỏ hàng...</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="mb-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Vui lòng thêm sản phẩm</p>
                </div>
              ) : (
                <>
                  {cartDetails.items.map((item, idx) => (
                    <div key={item.variantId} className="flex items-center border-b py-4 px-2 last:border-b-0">
                      <img src={item.image} alt={item.name} className="w-24 h-24 object-contain rounded-lg border mr-4" />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col pr-4">
                          <div className="font-semibold text-lg line-clamp-2 text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>{item.name}</div>
                          {item.colorName ? (
                             <div className="flex items-center gap-2 mt-1">
                               <span
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: item.colorName }}
                              />
                              <span className="text-sm text-gray-600">{getVnColorName(item.colorName)}</span>
                             </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end min-w-[200px]">
                          <div className="flex items-center gap-0 border rounded-lg overflow-hidden mb-2">
                            <button onClick={() => handleChangeQty(idx, -1)} className="w-8 h-8 text-lg font-bold bg-white hover:bg-gray-100">-</button>
                            <input 
                              type="number" 
                              min={1} 
                              max={5}
                              value={quantityInputs[`${item.productId}-${item.variantId}`] || item.quantity} 
                              onChange={(e) => {
                                const value = e.target.value;
                                // Ngăn chặn nhập số 0 hoặc số âm
                                if (value === '' || parseInt(value) > 0) {
                                  handleQuantityInputChange(idx, value);
                                }
                              }}
                              onBlur={() => handleQuantityBlur(idx)}
                              className="w-10 h-8 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            />
                            <button 
                              onClick={() => handleChangeQty(idx, 1)} 
                              className={`w-8 h-8 text-lg font-bold ${
                                (item.hasFlashSale && item.quantity >= 1) || item.quantity >= 5
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                  : 'bg-white hover:bg-gray-100'
                              }`}
                              disabled={(item.hasFlashSale && item.quantity >= 1) || item.quantity >= 5}
                            >
                              +
                            </button>
                          </div>
                          <div className="mb-1 text-right">
                            <div className="font-semibold text-lg text-blue-600">{formatVND(item.lineTotal)}</div>
                            {/* Hiển thị giá gốc nếu có flash sale hoặc giá gốc khác với giá hiện tại */}
                            {(item.hasFlashSale || item.originalItemPrice > item.currentPrice) && (
                              <div className="text-sm text-gray-500 line-through">
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
                          <button onClick={() => handleRemove(idx)} className="text-sm text-blue-600 hover:underline">Xóa</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <hr className="my-4" />
                  <div className="flex justify-end items-center gap-4 mb-4">
                    <span className="font-semibold text-lg text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, 'SF Pro Display', sans-serif" }}>Tổng tiền:</span>
                    <span className="text-red-500 font-bold text-2xl">{formatVND(cartDetails.total)}</span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => router.push('/')} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700">Tiếp tục mua hàng</button>
                    <button 
                      onClick={handleCheckout} 
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Thanh toán
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}


      </div>
      
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Vui lòng đăng nhập để tiếp tục thanh toán"
      />
    </div>
  );
} 