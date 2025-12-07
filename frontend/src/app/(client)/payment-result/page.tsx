"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/store/cartSlice';
import { orderService } from '@/services/orderService';
import OrderSummary from '@/components/client/OrderSummary';

function PaymentResultContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // Clear cart when payment is successful
    if (status === 'success') {
      dispatch(clearCart());
      
      // Auto redirect to home page after 5 seconds
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, dispatch, router]);

  const fetchOrderData = async () => {
    try {
      const order = await orderService.getOrderById(orderId!);
      setOrderData(order);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-800">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Result Header */}
        <div className="text-center mb-8">
          {isSuccess ? (
            <>
              <div className="text-green-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">Đặt hàng thành công!</h1>
              <p className="text-gray-600">
                Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang chờ xác nhận.
              </p>
              
              {/* Auto redirect countdown */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Tự động chuyển về trang chủ sau <span className="font-bold text-green-800">{countdown}</span> giây
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">Thanh toán thất bại</h1>
              <p className="text-gray-600">
                Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
              </p>
            </>
          )}
        </div>

        {/* Order Information */}
        {orderData && (
          <div className="mb-8">
            <OrderSummary order={orderData} />
          </div>
        )}

        {/* Next Steps */}
        {isSuccess && (
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Các bước tiếp theo:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Chúng tôi sẽ gửi email xác nhận đơn hàng
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Đơn hàng sẽ được xử lý trong 1-2 ngày làm việc
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Bạn sẽ nhận được thông báo khi đơn hàng được giao
              </li>
            </ul>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Thông tin liên hệ:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 w-24">Hotline:</span>
              <span className="font-medium">1900 3636</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">Email:</span>
              <span className="font-medium">support@polysmart.com</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">Zalo:</span>
              <span className="font-medium">PolySmart Support</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isSuccess && (
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Về trang chủ
            </button>
          )}
          {orderData && (
            <button
              onClick={() => router.push(`/payment/banking/${orderData._id}`)}
              className="w-full py-3 text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Xem lại thông tin thanh toán
            </button>
          )}
          
          <button
            onClick={() => router.push('/profile')}
            className="w-full py-3 text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Xem đơn hàng của tôi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
} 