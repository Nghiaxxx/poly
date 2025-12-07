import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { orderService } from '@/services/orderService';
import { addToCart } from '@/store/cartSlice';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showInfoAlert, showConfirmAlert } from '@/utils/sweetAlert';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/config/api';
import { getVnColorName } from '@/constants/colorMapShared';

export default function useOrderManagement() {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [returnedProducts, setReturnedProducts] = useState<{[orderId: string]: {[productKey: string]: boolean}}>({});
  const [variantStockMap, setVariantStockMap] = useState<Record<string, number>>({});
  const [requestedProducts, setRequestedProducts] = useState<{[orderId: string]: {[productKey: string]: boolean}}>({});

  // Tab state
  const orderTypeQuery = searchParams.get("type");
  const [orderTab, setOrderTab] = useState(orderTypeQuery || "all");

  // Return form state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnEmail, setReturnEmail] = useState(user?.email || "");
  const [selectedReturnProducts, setSelectedReturnProducts] = useState<string[]>([]);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    image: string;
    colorName?: string;
    dung_luong?: string;
    orderId?: string;
  } | null>(null);

  // User reviews state - theo orderId + productId + variantId
  const [userReviews, setUserReviews] = useState<{[orderProductVariantKey: string]: boolean}>({});

  // Map trạng thái backend sang UI
  const mapOrderStatus = (orderStatus: string, paymentStatus: string) => {
    if (orderStatus === "confirming")
      return {
        status: "confirming",
        statusText: "CHỜ XÁC NHẬN",
        statusColor: "text-orange-500",
      };
    if (orderStatus === "packing")
      return {
        status: "packing",
        statusText: "CHỜ LẤY HÀNG",
        statusColor: "text-yellow-500",
      };
    if (orderStatus === "shipping")
      return {
        status: "shipping",
        statusText: "CHỜ GIAO HÀNG",
        statusColor: "text-blue-500",
      };
    if (orderStatus === "delivered")
      return {
        status: "delivered",
        statusText: "ĐÃ GIAO",
        statusColor: "text-green-600",
      };
    if (orderStatus === "cancelled")
      return {
        status: "cancelled",
        statusText: "ĐÃ HỦY",
        statusColor: "text-red-500",
      };
    return {
      status: "confirming",
      statusText: "CHỜ XÁC NHẬN",
      statusColor: "text-orange-500",
    };
  };

  // Map dữ liệu từ backend về format UI
  const mapOrder = (orderFromApi: any) => {
    const totalAmount = Array.isArray(orderFromApi.items)
      ? orderFromApi.items.reduce(
          (sum: number, item: any) => sum + item.price * (item.quantity || 1),
          0
        )
      : 0;
    const item = orderFromApi.items[0] || {};
    const statusObj = mapOrderStatus(
      orderFromApi.orderStatus,
      orderFromApi.paymentStatus
    );
    return {
      id: orderFromApi._id,
      items: orderFromApi.items,
      shop: "PolySmart",
      productImg: item.image,
      productName: item.name,
      productType: item.colorName,
      qty: item.quantity,
      price: item.price,
      oldPrice: item.oldPrice || 0,
      totalAmount,
      ...statusObj,
      delivered: orderFromApi.orderStatus === "delivered",
      note: "",
      isChoice: false,
      paymentStatus: orderFromApi.paymentStatus,
      paymentMethod: orderFromApi.paymentMethod,
    };
  };

  // Map trạng thái yêu cầu trả hàng
  const mapReturnStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Chờ xử lý', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'approved':
        return { text: 'Đã chấp nhận', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'processing':
        return { text: 'Đang xử lý', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'completed':
        return { text: 'Hoàn thành', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'rejected':
        return { text: 'Từ chối', color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { text: 'Không xác định', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Kiểm tra có cần hoàn tiền không
  const needRefund = (paymentMethod: string, paymentStatus?: string) => {
    if (paymentMethod === 'cod' && paymentStatus === 'pending') {
      return false;
    }
    return true;
  };

  // Đếm số lượng đơn hàng theo trạng thái
  const getOrderTabCounts = (orders: any[]) => {
    const counts: Record<string, number> = {
      all: orders.length,
      confirming: 0,
      packing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      if (order.status && counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });
    return counts;
  };

  // Create ORDER_TABS with dynamic counts
  const orderTabCounts = getOrderTabCounts(orders);
  const ORDER_TABS = [
    { key: "all", label: "Tất cả", count: orderTabCounts.all },
    { key: "confirming", label: "Chờ xác nhận", count: orderTabCounts.confirming },
    { key: "packing", label: "Chờ lấy hàng", count: orderTabCounts.packing },
    { key: "shipping", label: "Chờ giao hàng", count: orderTabCounts.shipping },
    { key: "delivered", label: "Đã giao", count: orderTabCounts.delivered },
    { key: "cancelled", label: "Đã hủy", count: orderTabCounts.cancelled },
    { key: "returns", label: "Trả hàng/Hoàn tiền", count: returnRequests.length },
  ];

  // Fetch orders when component mounts or user changes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchOrders = async () => {
      if (user?._id) {
        try {
          const realOrders = await orderService.getOrdersByUser(user._id);
          const mappedOrders = Array.isArray(realOrders) ? realOrders.map(mapOrder) : [];
          setOrders(mappedOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      }
    };
    fetchOrders();
    if (user?._id) {
      interval = setInterval(fetchOrders, 5000);
    }

    // Poll inventory for variants appearing in orders (uses latest orders with separate effect below)
    const pollInventory = async () => {
      try {
        const variantIds = Array.from(new Set(
          orders.flatMap(o => (o.items || []).map((it: any) => it.variantId)).filter(Boolean)
        ));
        if (variantIds.length === 0) return;
        const res = await fetch(getApiUrl('variants/check-inventory'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds })
        });
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, number> = {};
        (data.variants || []).forEach((v: any) => { map[v._id] = v.so_luong_hang; });
        setVariantStockMap(map);
      } catch {}
    };
    const invInterval = setInterval(pollInventory, 60000);
    pollInventory();
    return () => { if (invInterval) clearInterval(invInterval); };
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Refresh inventory immediately when orders change
  useEffect(() => {
    const refresh = async () => {
      try {
        const variantIds = Array.from(new Set(
          orders.flatMap(o => (o.items || []).map((it: any) => it.variantId)).filter(Boolean)
        ));
        if (variantIds.length === 0) {
          setVariantStockMap({});
          return;
        }
        const res = await fetch(getApiUrl('variants/check-inventory'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds })
        });
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, number> = {};
        (data.variants || []).forEach((v: any) => { map[v._id] = v.so_luong_hang; });
        setVariantStockMap(map);
      } catch {}
    };
    refresh();
  }, [orders]);

  // Fetch return requests
  useEffect(() => {
    if (user?._id) {
      setLoadingReturns(true);
      fetch(`/api/return-requests/user/${user._id}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setReturnRequests(Array.isArray(data.data) ? data.data : []);
            
            const returnedProductsMap: {[orderId: string]: {[productKey: string]: boolean}} = {};
            const requestedProductsMap: {[orderId: string]: {[productKey: string]: boolean}} = {};
            
            data.data.forEach((request: any) => {
              const orderId = request.orderId?._id || request.orderId;
              if (!returnedProductsMap[orderId]) {
                returnedProductsMap[orderId] = {};
              }
              if (!requestedProductsMap[orderId]) {
                requestedProductsMap[orderId] = {};
              }
              
              if (request.selectedProducts) {
                request.selectedProducts.forEach((product: any) => {
                  const productKey = `${product.productId}_${product.variantId}`;
                  
                  // Track tất cả sản phẩm đã được yêu cầu trả hàng (bất kể trạng thái)
                  requestedProductsMap[orderId][productKey] = true;
                  
                  // Chỉ track sản phẩm đã trả thành công (không bị rejected)
                  if (request.status !== 'rejected') {
                    returnedProductsMap[orderId][productKey] = true;
                  }
                });
              }
            });
            
            setReturnedProducts(returnedProductsMap);
            setRequestedProducts(requestedProductsMap);
          } else {
            setReturnRequests([]);
          }
        })
        .catch((err) => {
          console.error('Error fetching return requests:', err);
          setReturnRequests([]);
        })
        .finally(() => setLoadingReturns(false));
    }
  }, [user]);

  // Fetch user reviews
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (user?._id) {
        try {
          const response = await fetch(`/api/reviews/by-user?ma_nguoi_dung=${user._id}`);
          if (response.ok) {
            const reviews = await response.json();
            const sessionReviews = JSON.parse(sessionStorage.getItem('submittedReviews') || '[]');
            const reviewMap: {[orderProductVariantKey: string]: boolean} = {};
            
            // Đánh dấu các review từ database (đã được lưu)
            // Lưu ý: Reviews từ database không có thông tin orderId cụ thể
            // nên sẽ được đánh dấu theo sản phẩm để tránh spam
            reviews.forEach((review: any) => {
              const variantKey = `${review.mau || 'default'}_${review.dung_luong || 'default'}`;
              const orderProductVariantKey = `${review.ma_san_pham._id}_${variantKey}`;
              reviewMap[orderProductVariantKey] = true;
            });
            
            // Đánh dấu các review từ session (vừa mới gửi)
            sessionReviews.forEach((sessionReview: {productId: string, variantId?: string, orderId?: string}) => {
              if (sessionReview.orderId) {
                // Nếu có orderId, lưu theo đơn hàng cụ thể
                const orderProductVariantKey = `${sessionReview.orderId}_${sessionReview.productId}_${sessionReview.variantId || 'default'}`;
                reviewMap[orderProductVariantKey] = true;
              } else {
                // Nếu không có orderId, lưu theo sản phẩm (backward compatibility)
                const orderProductVariantKey = `${sessionReview.productId}_${sessionReview.variantId || 'default'}`;
                reviewMap[orderProductVariantKey] = true;
              }
            });
            
            setUserReviews(reviewMap);
          }
        } catch (error) {
          console.error('Error fetching user reviews:', error);
        }
      }
    };
    
    fetchUserReviews();
  }, [user]);

  // Update order tab state when URL changes
  useEffect(() => {
    const currentOrderTab = orderTypeQuery || "all";
    if (currentOrderTab !== orderTab) {
      setOrderTab(currentOrderTab);
    }
  }, [orderTypeQuery, orderTab]);

  // Handler functions
  const handleOrderTabChange = (key: string) => {
    setOrderTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "orders");
    params.set("type", key);
    router.push(`?${params.toString()}`);
  };

  const handleConfirmReceipt = async (orderId: string) => {
    try {
      const response = await fetch(getApiUrl(`orders/${orderId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "delivered" }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to confirm receipt');
      }
      
      if (user?._id) {
        const realOrders = await orderService.getOrdersByUser(user._id);
        setOrders(Array.isArray(realOrders) ? realOrders.map(mapOrder) : []);
      }
    } catch (err) {
      console.error('Error confirming receipt:', err);
      showErrorAlert('Lỗi', 'Có lỗi khi xác nhận đã nhận hàng!');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    // Tìm đơn hàng để lấy thông tin thanh toán
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Xác định thông tin hoàn tiền
    let refundInfo = '';
    if (order.paymentStatus === 'paid') {
      if (order.paymentMethod === 'cod') {
        refundInfo = 'Đơn hàng COD đã thanh toán sẽ được hoàn tiền vào ví PolyPay.';
      } else if (['wallet', 'atm', 'momo'].includes(order.paymentMethod)) {
        refundInfo = `Đơn hàng thanh toán qua ${order.paymentMethod.toUpperCase()} sẽ được hoàn tiền vào ví PolyPay.`;
      }
    } else if (order.paymentMethod === 'cod') {
      refundInfo = 'Đơn hàng COD chưa thanh toán nên không cần hoàn tiền.';
    }
    
    const confirmMessage = refundInfo 
      ? `Bạn có chắc chắn muốn hủy đơn hàng này?\n\n${refundInfo}`
      : "Bạn có chắc chắn muốn hủy đơn hàng này?";
    
    const result = await showConfirmAlert('Xác nhận hủy đơn hàng', confirmMessage, 'Hủy đơn hàng', 'Không');
    if (!result.isConfirmed) return;
    
    try {
      await orderService.cancelOrder(orderId);
      
      // Hiển thị thông báo thành công với thông tin hoàn tiền
      let successMessage = 'Đơn hàng đã được hủy thành công.';
      if (order.paymentStatus === 'paid') {
        successMessage = `Đơn hàng đã được hủy thành công. Số tiền ${order.totalAmount?.toLocaleString()}₫ đã được hoàn vào ví PolyPay.`;
      }
      
      showSuccessAlert('Thành công', successMessage);
      
      if (user?._id) {
        const realOrders = await orderService.getOrdersByUser(user._id);
        setOrders(Array.isArray(realOrders) ? realOrders.map(mapOrder) : []);
      }
    } catch (err: any) {
      showErrorAlert('Lỗi', err.message || "Lỗi khi hủy đơn hàng");
    }
  };

  const handleBuyAgain = (order: any) => {
    if (!order.items || order.items.length === 0) {
      showWarningAlert('Thông báo', 'Không tìm thấy sản phẩm để mua lại!');
      return;
    }

    // Không cho mua lại nếu có item hết hàng
    const outOfStock = order.items.some((it: any) => {
      const stock = variantStockMap[it.variantId];
      return typeof stock === 'number' && stock <= 0;
    });
    if (outOfStock) {
      showWarningAlert('Hết hàng', 'Một hoặc nhiều sản phẩm đã hết hàng, không thể mua lại.');
      return;
    }

    try {
      order.items.forEach((item: any) => {
        const cartItem = {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          originPrice: item.oldPrice || item.price,
          image: item.image,
          colors: item.colorName ? [item.colorName] : [],
          selectedColor: 0,
          colorName: item.colorName || "",
          quantity: item.quantity,
          flashSaleVariantId: item.flashSaleVariantId
        };
        
        dispatch(addToCart(cartItem));
      });

      showSuccessAlert(
        "Đã thêm vào giỏ hàng!", 
        `Đã thêm ${order.items.length} sản phẩm vào giỏ hàng của bạn.`
      );

      router.push('/cart');
    } catch (error) {
      console.error('Error adding items to cart:', error);
      showErrorAlert('Lỗi', 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!');
    }
  };

  // Return handling functions
  const handleReturnOrder = (order: any) => {
    const orderId = order.id;
    const orderRequestedProducts = requestedProducts[orderId] || {};
    
    // Chỉ hiển thị các sản phẩm chưa từng được yêu cầu trả hàng
    const availableItems = order.items.filter((item: any) => {
      const productKey = `${item.productId}_${item.variantId}`;
      return !orderRequestedProducts[productKey];
    });
    
    const updatedOrder = {
      ...order,
      items: availableItems
    };
    
    setSelectedReturnOrder(updatedOrder);
    setReturnEmail(user?.email || "");
    setReturnReason("");
    setReturnDescription("");
    setSelectedReturnProducts([]);
    setShowReturnForm(true);
  };

  const handleCloseReturnForm = () => {
    setShowReturnForm(false);
    setSelectedReturnOrder(null);
    setReturnReason("");
    setReturnDescription("");
    setReturnEmail(user?.email || "");
    setSelectedReturnProducts([]);
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedReturnProducts(prev => [...prev, productId]);
    } else {
      setSelectedReturnProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      const allProductIds = selectedReturnOrder?.items?.map((item: any, index: number) => `${item.productId}_${index}`) || [];
      setSelectedReturnProducts(allProductIds);
    } else {
      setSelectedReturnProducts([]);
    }
  };

  const calculateRefundAmount = () => {
    if (!selectedReturnOrder?.items) return 0;
    
    return selectedReturnOrder.items.reduce((total: number, item: any, index: number) => {
      const productKey = `${item.productId}_${index}`;
      if (selectedReturnProducts.includes(productKey)) {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmitReturn = async () => {
    if (selectedReturnProducts.length === 0) {
      showWarningAlert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để trả hàng!');
      return;
    }
    if (!returnReason.trim()) {
      showWarningAlert('Thông báo', 'Vui lòng chọn lý do trả hàng!');
      return;
    }
    if (!returnEmail.trim()) {
      showWarningAlert('Thông báo', 'Vui lòng nhập email!');
      return;
    }
    if (!returnDescription.trim()) {
      showWarningAlert('Thông báo', 'Vui lòng nhập mô tả chi tiết!');
      return;
    }

    try {
      const selectedItems = selectedReturnOrder.items.filter((item: any, index: number) => {
        const productKey = `${item.productId}_${index}`;
        return selectedReturnProducts.includes(productKey);
      });

      const returnData = {
        orderId: selectedReturnOrder.id,
        reason: returnReason,
        description: returnDescription,
        email: returnEmail,
        userId: user?._id,
        selectedProducts: selectedItems.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image,
          colorName: item.colorName
        })),
        refundAmount: calculateRefundAmount()
      };

      const response = await fetch('/api/return-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showSuccessAlert("Yêu cầu trả hàng đã được gửi thành công!", "Chúng tôi sẽ liên hệ với bạn sớm nhất.");
        handleCloseReturnForm();
        
        if (user?._id) {
          fetch(`/api/return-requests/user/${user._id}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                setReturnRequests(Array.isArray(data.data) ? data.data : []);
                
                const returnedProductsMap: {[orderId: string]: {[productKey: string]: boolean}} = {};
                const requestedProductsMap: {[orderId: string]: {[productKey: string]: boolean}} = {};
                
                data.data.forEach((request: any) => {
                  const orderId = request.orderId?._id || request.orderId;
                  if (!returnedProductsMap[orderId]) {
                    returnedProductsMap[orderId] = {};
                  }
                  if (!requestedProductsMap[orderId]) {
                    requestedProductsMap[orderId] = {};
                  }
                  
                  if (request.selectedProducts) {
                    request.selectedProducts.forEach((product: any) => {
                      const productKey = `${product.productId}_${product.variantId}`;
                      
                      // Track tất cả sản phẩm đã được yêu cầu trả hàng (bất kể trạng thái)
                      requestedProductsMap[orderId][productKey] = true;
                      
                      // Chỉ track sản phẩm đã trả thành công (không bị rejected)
                      if (request.status !== 'rejected') {
                        returnedProductsMap[orderId][productKey] = true;
                      }
                    });
                  }
                });
                
                setReturnedProducts(returnedProductsMap);
                setRequestedProducts(requestedProductsMap);
              }
            })
            .catch((err) => console.error('Error reloading return requests:', err));
        }
      } else {
        showErrorAlert('Lỗi', result.message || "Có lỗi xảy ra khi gửi yêu cầu trả hàng!");
      }
      
    } catch (error) {
      console.error('Error submitting return request:', error);
      showErrorAlert('Lỗi', "Có lỗi xảy ra khi gửi yêu cầu trả hàng!");
    }
  };

  // Review handling functions
  const handleOpenReviewModal = (order: any, product?: any) => {
    const selectedProduct = product || order.items?.[0];
    
    if (selectedProduct) {
      setSelectedProduct({
        id: selectedProduct.productId,
        name: selectedProduct.name || order.productName,
        image: selectedProduct.image || order.productImg,
        colorName: selectedProduct.colorName,
        dung_luong: selectedProduct.dung_luong,
        orderId: order.id
      });
      setIsReviewModalOpen(true);
    } else {
      showWarningAlert('Thông báo', 'Không tìm thấy thông tin sản phẩm để đánh giá!');
    }
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedProduct(null);
  };

  const handleReviewSubmitted = async () => {
    if (selectedProduct?.id) {
      const sessionReviews = JSON.parse(sessionStorage.getItem('submittedReviews') || '[]');
      const variantKey = `${selectedProduct.colorName || 'default'}_${selectedProduct.dung_luong || 'default'}`;
      
      // Lưu thông tin orderId để có thể đánh giá lại khi mua lại
      const newReview = { 
        productId: selectedProduct.id,
        variantId: variantKey,
        orderId: selectedProduct.orderId // Thêm orderId
      };
      
      const exists = sessionReviews.some((review: any) => 
        review.productId === selectedProduct.id &&
        review.variantId === variantKey &&
        review.orderId === selectedProduct.orderId
      );
      
      if (!exists) {
        sessionReviews.push(newReview);
        sessionStorage.setItem('submittedReviews', JSON.stringify(sessionReviews));
      }
    }
    
    if (user?._id) {
      try {
        const realOrders = await orderService.getOrdersByUser(user._id);
        const mappedOrders = Array.isArray(realOrders) ? realOrders.map(mapOrder) : [];
        setOrders(mappedOrders);

        const response = await fetch(`/api/reviews/by-user?ma_nguoi_dung=${user._id}`);
        if (response.ok) {
          const reviews = await response.json();
          const sessionReviews = JSON.parse(sessionStorage.getItem('submittedReviews') || '[]');
          const reviewMap: {[orderProductVariantKey: string]: boolean} = {};
          
          // Đánh dấu các review từ database (đã được lưu)
          // Lưu ý: Reviews từ database không có thông tin orderId cụ thể
          // nên sẽ được đánh dấu theo sản phẩm để tránh spam
          reviews.forEach((review: any) => {
            const variantKey = `${review.mau || 'default'}_${review.dung_luong || 'default'}`;
            const orderProductVariantKey = `${review.ma_san_pham._id}_${variantKey}`;
            reviewMap[orderProductVariantKey] = true;
          });
          
          // Đánh dấu các review từ session (vừa mới gửi)
          sessionReviews.forEach((sessionReview: {productId: string, variantId?: string, orderId?: string}) => {
            if (sessionReview.orderId) {
              // Nếu có orderId, lưu theo đơn hàng cụ thể
              const orderProductVariantKey = `${sessionReview.orderId}_${sessionReview.productId}_${sessionReview.variantId || 'default'}`;
              reviewMap[orderProductVariantKey] = true;
            } else {
              // Nếu không có orderId, lưu theo sản phẩm (backward compatibility)
              const orderProductVariantKey = `${sessionReview.productId}_${sessionReview.variantId || 'default'}`;
              reviewMap[orderProductVariantKey] = true;
            }
          });
          
          setUserReviews(reviewMap);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
  };

  // Check functions
  const canReviewProduct = (order: any, item: any) => {
    const isDelivered = order.status === 'delivered' && order.delivered;
    
    // Có thể item.productId không tồn tại, thử item._id
    const productId = item.productId || item._id;
    const colorName = item.colorName || item.mau; // Thử cả hai field
    const dung_luong = item.dung_luong;
    
    const variantKey = `${colorName || 'default'}_${dung_luong || 'default'}`;
    const orderId = order.id;
    
    // Kiểm tra xem đã đánh giá cho đơn hàng cụ thể này chưa
    const orderProductVariantKey = `${orderId}_${productId}_${variantKey}`;
    const hasReviewedThisOrder = userReviews[orderProductVariantKey];
    
    // Nếu chưa đánh giá cho đơn hàng cụ thể này, cho phép đánh giá
    if (!hasReviewedThisOrder) {
      return isDelivered;
    }
    
    // Nếu đã đánh giá cho đơn hàng cụ thể này, không cho phép đánh giá lại
    return false;
  };

  const getReviewableProducts = (order: any) => {
    if (!order.items || !Array.isArray(order.items)) return [];
    
    return order.items.filter((item: any) => 
      canReviewProduct(order, item)
    );
  };

  const canReviewOrder = (order: any) => {
    return getReviewableProducts(order).length > 0;
  };

  const canReturnOrder = (order: any) => {
    if (order.status !== "delivered" || !order.delivered) return false;
    
    const orderId = order.id;
    const orderRequestedProducts = requestedProducts[orderId] || {};
    
    // Kiểm tra xem còn sản phẩm nào chưa được yêu cầu trả hàng không
    return order.items.some((item: any) => {
      const productKey = `${item.productId}_${item.variantId}`;
      return !orderRequestedProducts[productKey]; // Chỉ hiển thị nút nếu sản phẩm chưa từng được yêu cầu trả hàng
    });
  };

  const canBuyAgain = (order: any) => {
    if (!order?.items || order.items.length === 0) return false;
    return order.items.every((it: any) => {
      const stock = variantStockMap[it.variantId];
      return typeof stock !== 'number' || stock > 0;
    });
  };

  return {
    orders,
    orderTab,
    handleOrderTabChange,
    returnRequests,
    loadingReturns,
    showReturnForm,
    selectedReturnOrder,
    returnReason,
    returnDescription,
    returnEmail,
    selectedReturnProducts,
    returnedProducts,
    requestedProducts,
    handleReturnOrder,
    handleCloseReturnForm,
    handleProductSelection,
    handleSelectAllProducts,
    calculateRefundAmount,
    handleSubmitReturn,
    needRefund,
    mapReturnStatus,
    getOrderTabCounts,
    ORDER_TABS,
    getVnColorName,
    handleConfirmReceipt,
    handleCancelOrder,
    handleBuyAgain,
    canReturnOrder,
    canReviewOrder,
    handleOpenReviewModal,
    handleCloseReviewModal,
    canBuyAgain,
    isReviewModalOpen,
    selectedProduct,
    userReviews,
    canReviewProduct,
    getReviewableProducts,
    handleReviewSubmitted,
    setReturnReason,
    setReturnDescription,
    setReturnEmail,
  };
} 