"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/orderService';

export default function PaymentSearchPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      setError('Vui lòng nhập mã đơn hàng');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const order = await orderService.getOrderById(orderId.trim());
      
      if (!order) {
        setError('Không tìm thấy đơn hàng với mã này');
        return;
      }

      // Kiểm tra trạng thái thanh toán
      if (order.paymentStatus === 'paid') {
        router.push(`/payment-result?status=success&orderId=${order._id}`);
        return;
      }

      // Chuyển đến trang thanh toán
      router.push(`/payment/banking/${order._id}`);
      
    } catch (error) {
      console.error('Error searching order:', error);
      setError('Đã có lỗi xảy ra khi tìm kiếm đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Tìm kiếm đơn hàng</h1>
          <p className="text-gray-600">
            Nhập mã đơn hàng để tiếp tục thanh toán
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              Mã đơn hàng
            </label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Nhập mã đơn hàng..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-blue-600 text-white font-semibold rounded-lg ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Về trang chủ
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Hướng dẫn:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Mã đơn hàng thường có dạng: 64f8a1b2c3d4e5f6a7b8c9d0</li>
            <li>• Bạn có thể tìm thấy mã đơn hàng trong email xác nhận</li>
            <li>• Hoặc trong lịch sử đơn hàng của tài khoản</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 