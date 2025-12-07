import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';

interface PaymentStatusIndicatorProps {
  orderId: string;
  onPaymentSuccess: () => void;
}

const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({
  orderId,
  onPaymentSuccess
}) => {
  const [status, setStatus] = useState<'polling' | 'success' | 'error'>('polling');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    if (!orderId) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(getApiUrl(`orders/${orderId}`));
        if (!response.ok) {
          throw new Error('Failed to fetch order status');
        }

        const data = await response.json();
        setLastChecked(new Date());

        // Kiểm tra nếu thanh toán thành công

        // Kiểm tra nếu thanh toán thành công
        if (data.paymentStatus === 'paid' || 
            data.orderStatus === 'confirmed' || 
            data.orderStatus === 'packing') {

          setStatus('success');
          onPaymentSuccess();
          return;
        }
      } catch (error) {

        setStatus('error');
      }
    };

    // Kiểm tra ngay lập tức
    checkPaymentStatus();

    // Polling mỗi 3 giây
    const interval = setInterval(checkPaymentStatus, 3000);

    return () => clearInterval(interval);
  }, [orderId, onPaymentSuccess]);

  const getStatusText = () => {
    switch (status) {
      case 'polling':
        return 'Đang kiểm tra thanh toán...';
      case 'success':
        return 'Thanh toán thành công!';
      case 'error':
        return 'Lỗi kiểm tra thanh toán';
      default:
        return 'Đang kiểm tra...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'polling':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'polling':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${getDotColor()} ${status === 'polling' ? 'animate-pulse' : ''}`}></div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {status === 'polling' && (
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-2">
            Hệ thống đang theo dõi thanh toán tự động
          </p>
          <p className="text-xs text-gray-500">
            Cập nhật lần cuối: {lastChecked.toLocaleTimeString('vi-VN')}
          </p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center">
          <p className="text-xs text-green-600">
            ✅ Thanh toán đã được xác nhận!
          </p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-center">
          <p className="text-xs text-red-600">
            ⚠️ Có lỗi khi kiểm tra thanh toán
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusIndicator; 