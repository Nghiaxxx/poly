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
import { bankTransactionService } from '@/services/bankTransactionService';
import PaymentModal from '@/components/client/PaymentModal';
import CopySuccessModal from '@/components/client/CopySuccessModal';
import PaymentStatusIndicator from '@/components/client/PaymentStatusIndicator';

export default function BankingPaymentByOrderIdPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const user = useSelector((state: RootState) => state.user.user);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'loading';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'loading',
    title: '',
    message: ''
  });
  const [copyModalState, setCopyModalState] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: ''
  });

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
    
    // Polling kiểm tra trạng thái đơn hàng mỗi 3 giây
    const interval = setInterval(async () => {
      try {
        console.log("🔄 Polling order status for order:", orderData._id);
        const res = await fetch(getApiUrl(`orders/${orderData._id}`));
        
        if (!res.ok) {
          console.error('❌ Failed to fetch order status:', res.status);
          return;
        }
        
        const data = await res.json();
        console.log("📊 Order status polling result:", {
          orderId: data._id,
          paymentStatus: data.paymentStatus,
          orderStatus: data.orderStatus
        });
        
        // Kiểm tra nếu paymentStatus là 'paid' thì chuyển hướng ngay lập tức
        if (data.paymentStatus === 'paid') {
          console.log("✅ Payment confirmed! Redirecting to success page...");
          clearInterval(interval);
          router.push(`/payment-result?status=success&orderId=${orderData._id}`);
          return;
        }
        
        // Kiểm tra thêm orderStatus nếu cần
        if (data.orderStatus === 'confirmed' || data.orderStatus === 'packing') {
          console.log("✅ Order confirmed! Redirecting to success page...");
          clearInterval(interval);
          router.push(`/payment-result?status=success&orderId=${orderData._id}`);
          return;
        }
        
        console.log("⏳ Order still pending, continuing to poll...");
      } catch (err) {
        console.error('❌ Error polling order status:', err);
      }
    }, 3000); // Polling mỗi 3 giây

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

      // Kiểm tra trạng thái thanh toán - nếu đã thanh toán thì chuyển hướng ngay
      if (order.paymentStatus === 'paid') {
        console.log("✅ Order already paid, redirecting to success page...");
        router.push(`/payment-result?status=success&orderId=${order._id}`);
        return;
      }
      
      // Kiểm tra thêm orderStatus
      if (order.orderStatus === 'confirmed' || order.orderStatus === 'packing') {
        console.log("✅ Order already confirmed, redirecting to success page...");
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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyModalState({
      isOpen: true,
      message: `Đã sao chép ${label} vào clipboard!`
    });
  };

  const handleVerifyPayment = async () => {
    if (!orderData) return;

    setIsVerifying(true);
    
    // Hiển thị modal loading
    setModalState({
      isOpen: true,
      type: 'loading',
      title: 'Đang kiểm tra thanh toán',
      message: 'Vui lòng chờ trong giây lát...'
    });

    try {
      console.log("🔍 Checking bank transaction for order:", orderData._id);
      
      // Sử dụng service để kiểm tra giao dịch theo description
      const checkData = await bankTransactionService.checkTransactionByDescription({
        orderId: orderData.transferContent, // Sử dụng transferContent để tìm trong description của giao dịch
        amount: orderData.totalAmount
      });
      
      console.log("📊 Bank transaction check result:", checkData);
      
      if (checkData.success && checkData.data.found) {
        console.log("✅ Found matching bank transaction! Redirecting to success...");
        
        // Hiển thị modal thành công
        setModalState({
          isOpen: true,
          type: 'success',
          title: 'Thanh toán thành công!',
          message: 'Đã tìm thấy giao dịch thanh toán. Hệ thống sẽ chuyển hướng bạn đến trang kết quả.',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }));
            router.push(`/payment-result?status=success&orderId=${orderData._id}`);
          }
        });
        return;
      } else {
        console.log("❌ No matching bank transaction found");
        
        // Hiển thị modal thông báo
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Thanh toán đang được duyệt',
          message: 'Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ nếu đã chuyển khoản.',
          onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      
      // Hiển thị modal lỗi
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Lỗi hệ thống',
        message: 'Đã có lỗi xảy ra khi kiểm tra thanh toán. Vui lòng thử lại sau.',
        onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handlePaymentSuccess = () => {
    console.log("🎉 Payment success detected! Redirecting...");
    router.push(`/payment-result?status=success&orderId=${orderData?._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Thanh toán đơn hàng</h1>
          {/* <p className="text-gray-600 mb-2">
            Mã đơn hàng: <span className="font-semibold text-blue-600">{orderData._id}</span>
          </p>
          <p className="text-gray-600">
            Vui lòng chuyển khoản theo thông tin bên dưới
          </p> */}
        </div>

        {/* Order Summary */}
        <OrderSummary order={orderData} showItems={false} />

        {/* Payment Amount */}
        <div className="text-center mb-6">
          <p className="text-gray-700 font-semibold">Số tiền thanh toán:</p>
          <p className="text-3xl font-bold text-blue-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.totalAmount)}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <img 
              src={`https://img.vietqr.io/image/ACB-17418271-compact.png?amount=${orderData.totalAmount}&addInfo=${orderData.transferContent}&accountName=${encodeURIComponent('Chu Quang Dũng')}`}
              alt="VietQR Payment Code"
              className="w-48 h-48 object-contain"
            />
            <p className="text-sm text-gray-500 text-center mt-2">Quét mã để thanh toán</p>
          </div>
        </div>

        {/* Bank Information */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Thông tin chuyển khoản:</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">17418271</span>
                <button
                  onClick={() => handleCopyText('17418271', 'số tài khoản')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tên tài khoản:</span>
              <span className="font-medium">Chu Quang Dũng</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ngân hàng:</span>
              <span className="font-medium">ACB Bank</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chi nhánh:</span>
              <span className="font-medium">HCM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nội dung chuyển khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-600">{orderData.transferContent}</span>
                <button
                  onClick={() => handleCopyText(orderData.transferContent, 'nội dung chuyển khoản')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleVerifyPayment}
            disabled={isVerifying}
            className={`w-full py-3 bg-blue-600 text-white font-semibold rounded-lg ${
              isVerifying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isVerifying ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản'}
          </button>
          <button
            onClick={() => router.push('/')}
            disabled={isVerifying}
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
              Lưu ý: Hệ thống sẽ tự động kiểm tra thanh toán mỗi 3 giây. Bạn có thể đóng trang này và quay lại sau.
            </p>
          </div>
        </div>
        
        {/* Payment Status Indicator */}
        {orderData && (
          <PaymentStatusIndicator
            orderId={orderData._id}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.type === 'success' ? 'Tiếp tục' : 'Đóng'}
        cancelText="Hủy"
      />

      {/* Copy Success Modal */}
      <CopySuccessModal
        isOpen={copyModalState.isOpen}
        onClose={() => setCopyModalState(prev => ({ ...prev, isOpen: false }))}
        message={copyModalState.message}
      />
    </div>
  );
} 