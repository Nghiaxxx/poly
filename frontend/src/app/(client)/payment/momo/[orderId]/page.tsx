"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { orderService } from '@/services/orderService';
import type { OrderResponse } from '@/services/orderService';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import OrderSummary from '@/components/client/OrderSummary';
import { getApiUrl } from '@/config/api';
import { momoService } from '@/services/momoService';
import { showInfoAlert, showErrorAlert } from '@/utils/sweetAlert';

export default function MomoPaymentByOrderIdPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const user = useSelector((state: RootState) => state.user.user);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('Mã đơn hàng không hợp lệ');
      setLoading(false);
      return;
    }

    fetchOrderData();
  }, [orderId]);

  useEffect(() => {
    if (!orderData) return;
    
    // Polling kiểm tra trạng thái đơn hàng mỗi 5 giây
    const interval = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl(`orders/${orderData._id}`));
        const data = await res.json();
        console.log("Order status polling:", data);
        
        if (data.paymentStatus === 'paid' || data.orderStatus === 'confirmed') {
          clearInterval(interval);
          router.push(`/payment-result?status=success&orderId=${orderData._id}`);
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderData, router]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      console.log('Fetching order with ID:', orderId);
      const order = await orderService.getOrderById(orderId);
      console.log('Order result:', order);
      
      if (!order) {
        console.log('Order not found for ID:', orderId);
        setError('Không tìm thấy đơn hàng');
        return;
      }

      // Kiểm tra quyền truy cập
      if (user && order.customerInfo?.userId !== user._id) {
        setError('Bạn không có quyền truy cập đơn hàng này');
        return;
      }

      // Kiểm tra trạng thái thanh toán
      if (order.paymentStatus === 'paid') {
        router.push(`/payment-result?status=success&orderId=${order._id}`);
        return;
      }

      setOrderData(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Đã có lỗi xảy ra khi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderData) return;

    setIsVerifying(true);
    try {
      const res = await fetch(getApiUrl(`orders/${orderData._id}`));
      const data = await res.json();
      
      if (data.paymentStatus === 'paid' || data.orderStatus === 'confirmed') {
        router.push(`/payment-result?status=success&orderId=${orderData._id}`);
      } else {
        showInfoAlert('Thông báo', 'Xin chờ đến khi thanh toán thành công! Đơn hàng của bạn vẫn đang được xử lý.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      showErrorAlert('Lỗi', 'Đã có lỗi xảy ra khi xác nhận thanh toán');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderData) return;

    try {
      // Tạo yêu cầu thanh toán MOMO mới
      const momoResult = await momoService.createPayment({
        orderId: orderData._id,
        amount: orderData.totalAmount,
        orderInfo: `Thanh toan don hang TechStore - ${orderData._id}`
      });
      
      if (momoResult.success && momoResult.data?.payUrl) {
        momoService.openMomoPayment(momoResult.data.payUrl);
      } else {
        throw new Error(momoResult.message || 'Lỗi tạo yêu cầu thanh toán MOMO');
      }
    } catch (error) {
      console.error('Error retrying MOMO payment:', error);
      showErrorAlert('Lỗi', 'Không thể tạo yêu cầu thanh toán mới. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
            <p className="text-gray-800">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Thanh toán qua MOMO</h1>
          <p className="text-gray-600">
            Mã đơn hàng: <span className="font-semibold text-pink-600">{orderData._id}</span>
          </p>
        </div>

        {/* Order Summary */}
        <OrderSummary order={orderData} showItems={false} />

        {/* Payment Amount */}
        <div className="text-center mb-6">
          <p className="text-gray-700 font-semibold">Số tiền thanh toán:</p>
          <p className="text-3xl font-bold text-pink-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.totalAmount)}
          </p>
        </div>

        {/* MOMO Payment Status */}
        <div className="bg-pink-50 p-6 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-pink-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.482-.22-2.121-.659-1.172-.879-1.172-2.303 0-3.182s3.07-.879 4.242 0l.879.659" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Đang chờ thanh toán</h3>
            <p className="text-gray-600 mb-4">
              Vui lòng hoàn tất thanh toán trong ứng dụng MOMO của bạn
            </p>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Hướng dẫn thanh toán:</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start space-x-2">
              <span className="text-pink-600 font-bold">1.</span>
              <span>Mở ứng dụng MOMO trên điện thoại của bạn</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-pink-600 font-bold">2.</span>
              <span>Quét mã QR hoặc nhập thông tin thanh toán</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-pink-600 font-bold">3.</span>
              <span>Xác nhận thông tin và hoàn tất thanh toán</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-pink-600 font-bold">4.</span>
              <span>Chờ xác nhận từ hệ thống (tự động trong 30 giây)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleVerifyPayment}
            disabled={isVerifying}
            className={`w-full py-3 bg-pink-600 text-white font-semibold rounded-lg ${
              isVerifying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700'
            }`}
          >
            {isVerifying ? 'Đang xác nhận...' : 'Tôi đã thanh toán xong'}
          </button>
          
          <button
            onClick={handleRetryPayment}
            className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700"
          >
            Thử lại thanh toán
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Về trang chủ
          </button>
        </div>

        {/* Payment Status */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800">
              Lưu ý: Hệ thống sẽ tự động kiểm tra thanh toán mỗi 5 giây. Bạn có thể đóng trang này và quay lại sau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 