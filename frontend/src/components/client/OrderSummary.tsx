import React from 'react';

interface OrderSummaryProps {
  order: any;
  showItems?: boolean;
}

export default function OrderSummary({ order, showItems = true }: OrderSummaryProps) {
  if (!order) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="font-semibold text-gray-800 mb-3">Thông tin đơn hàng:</h3>
      
      {/* Order Info */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Mã đơn hàng:</span>
          <span className="font-medium text-blue-600">{order._id || order.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Khách hàng:</span>
          <span className="font-medium">{order.customerInfo?.TenKH || order.customerInfo?.fullName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Số điện thoại:</span>
          <span className="font-medium">{order.customerInfo?.Sdt || order.customerInfo?.phone || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Địa chỉ:</span>
          <span className="font-medium">{order.customerInfo?.Dia_chi || order.customerInfo?.address || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Số sản phẩm:</span>
          <span className="font-medium">{order.items?.length || 0} sản phẩm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Trạng thái:</span>
          <span className={`font-medium ${
            order.paymentStatus === 'paid' ? 'text-green-600' : 
            order.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
             order.paymentStatus === 'pending' ? 'Chờ thanh toán' : 'Chưa thanh toán'}
          </span>
        </div>
      </div>

      {/* Order Items */}
      {showItems && order.items && order.items.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3">Sản phẩm:</h4>
          <div className="space-y-2">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.name || item.productName}</p>
                  {item.colorName && (
                    <p className="text-gray-500 text-xs">Màu: {item.colorName}</p>
                  )}
                  <p className="text-gray-500 text-xs">SL: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800">Tổng tiền:</span>
          <span className="text-xl font-bold text-blue-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
} 