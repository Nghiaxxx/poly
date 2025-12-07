'use client';
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/admin/ui/button";
import { FaBoxOpen, FaUser, FaMoneyBill, FaHistory, FaArrowLeft, FaTruck, FaCheckCircle } from "react-icons/fa";
import { getApiUrl } from '@/config/api';
import Swal from 'sweetalert2';

interface OrderDetail {
  _id: string;
  customerInfo: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    note?: string;
    email?: string;
  };
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
    colorName?: string;
    imei?: string;
  }>;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
  transferContent?: string;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branch?: string;
  };
  shippingFee?: number;
  discount?: number;
  voucherCode?: string;
  voucherDiscount?: number;
  statusHistory?: Array<{
    status: string;
    time: string;
  }>;
}

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  confirming: { label: 'Chờ xác nhận', icon: <FaHistory />, color: 'text-yellow-500' },
  packing: { label: 'Chờ lấy hàng', icon: <FaBoxOpen />, color: 'text-blue-600' },
  shipping: { label: 'Chờ giao hàng', icon: <FaTruck />, color: 'text-orange-500' },
  delivered: { label: 'Đã giao', icon: <FaCheckCircle />, color: 'text-green-600' },
  returned: { label: 'Trả hàng', icon: <FaHistory />, color: 'text-purple-500' },
  cancelled: { label: 'Đã hủy', icon: <FaHistory />, color: 'text-red-500' },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`orders/${id}`));
        const data = await res.json();
        console.log('API Response:', data);
        // Backend trả về { order: {...} } nên cần lấy data.order
        const orderData = data.order || data;
        console.log('Order Data:', orderData);
        console.log('Items:', orderData?.items);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        setOrder(null);
      }
      setLoading(false);
    };
    if (id) fetchOrder();
  }, [id]);

  // Các hàm cập nhật trạng thái mới
  const handleConfirmOrder = async () => {
    if (!order || !order._id) return;
    
    const result = await Swal.fire({
      title: 'Xác nhận đơn hàng',
      text: 'Bạn có chắc chắn muốn xác nhận đơn hàng này và chuyển sang trạng thái "Chờ lấy hàng"?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        await fetch(getApiUrl(`orders/${order._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderStatus: 'packing' })
        });
        
        await Swal.fire({
          title: 'Thành công!',
          text: 'Đơn hàng đã được xác nhận.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        location.reload();
      } catch (error) {
        await Swal.fire({
          title: 'Lỗi!',
          text: 'Có lỗi xảy ra khi xác nhận đơn hàng.',
          icon: 'error'
        });
        setActionLoading(false);
      }
    }
  };
  
  const handleShippingOrder = async () => {
    if (!order || !order._id) return;
    
    const result = await Swal.fire({
      title: 'Chuyển sang giao hàng',
      text: 'Bạn có chắc chắn muốn chuyển đơn hàng này sang trạng thái "Chờ giao hàng"?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        await fetch(getApiUrl(`orders/${order._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderStatus: 'shipping' })
        });
        
        await Swal.fire({
          title: 'Thành công!',
          text: 'Đơn hàng đã được chuyển sang trạng thái giao hàng.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        location.reload();
      } catch (error) {
        await Swal.fire({
          title: 'Lỗi!',
          text: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.',
          icon: 'error'
        });
        setActionLoading(false);
      }
    }
  };
  
  const handleDeliveredOrder = async () => {
    if (!order || !order._id) return;
    
    const result = await Swal.fire({
      title: 'Xác nhận đã giao hàng',
      text: 'Bạn có chắc chắn đơn hàng này đã được giao thành công?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        await fetch(getApiUrl(`orders/${order._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderStatus: 'delivered' })
        });
        
        await Swal.fire({
          title: 'Thành công!',
          text: 'Đơn hàng đã được đánh dấu là đã giao.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        location.reload();
      } catch (error) {
        await Swal.fire({
          title: 'Lỗi!',
          text: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.',
          icon: 'error'
        });
        setActionLoading(false);
      }
    }
  };
  
  const handleCancelOrder = async () => {
    if (!order || !order._id) return;
    
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
    
    const result = await Swal.fire({
      title: 'Hủy đơn hàng',
      html: `
        <div class="text-left">
          <p class="mb-3">Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.</p>
          ${refundInfo ? `<div class="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm text-blue-700">
            <strong>Thông tin hoàn tiền:</strong><br/>
            ${refundInfo}
          </div>` : ''}
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Hủy đơn hàng',
      cancelButtonText: 'Giữ lại'
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        await fetch(getApiUrl(`orders/${order._id}/cancel`), { method: 'PUT' });
        
        // Xác định thông báo hoàn tiền
        let successMessage = 'Đơn hàng đã được hủy thành công.';
        if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cod') {
          successMessage = `Đơn hàng đã được hủy thành công. Số tiền ${order.totalAmount?.toLocaleString()}₫ đã được hoàn vào ví PolyPay.`;
        } else if (order.paymentStatus === 'paid' && order.paymentMethod === 'cod') {
          successMessage = `Đơn hàng đã được hủy thành công. Số tiền ${order.totalAmount?.toLocaleString()}₫ đã được hoàn vào ví PolyPay.`;
        }
        
        await Swal.fire({
          title: 'Đã hủy!',
          text: successMessage,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
        
        router.push('/admin/order/orders');
      } catch (error) {
        await Swal.fire({
          title: 'Lỗi!',
          text: 'Có lỗi xảy ra khi hủy đơn hàng.',
          icon: 'error'
        });
        setActionLoading(false);
      }
    }
  };

  if (loading) return <DefaultLayout><div className="p-8">Đang tải chi tiết đơn hàng...</div></DefaultLayout>;
  if (!order) return <DefaultLayout><div className="p-8 text-red-500">Không tìm thấy đơn hàng.</div></DefaultLayout>;

  // Tính toán tổng kết
  const discount = order.voucherDiscount ?? 0;
  const voucherCode = order.voucherCode ?? '';
  
  // Tính tổng tiền sản phẩm ban đầu (từ items)
  const originalProductTotal = order.items?.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0) ?? 0;
  
  // Tổng tiền cuối cùng (sau khi trừ voucher)
  const totalPayment = order.totalAmount ?? 0;

  return (
    <DefaultLayout>
      <div className="max-w-6xl mx-auto bg-white rounded shadow p-8">
        {/* Thanh điều hướng */}
        <div className="mb-6 flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/order/orders')} className="flex items-center gap-2"><FaArrowLeft /> Trở lại / Đơn hàng</Button>
        </div>

        {/* Thông tin đơn hàng */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><FaBoxOpen /> Thông tin đơn hàng</div>
          <div className="grid grid-cols-2 gap-2">
            <div>Mã đơn hàng: <b>#{order._id ? order._id.slice(-8).toUpperCase() : 'N/A'}</b></div>
            <div>Ngày đặt: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</div>
            <div>Trạng thái: <span className={`font-semibold ${statusMap[order.orderStatus || '']?.color || ''}`}>{statusMap[order.orderStatus || '']?.icon} {statusMap[order.orderStatus || '']?.label || 'Không xác định'}</span></div>
            <div>Phương thức thanh toán: {(order.paymentMethod || '') === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : (order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A')}</div>
            <div>Phương thức vận chuyển: Giao nhanh (2-3 ngày)</div>
          </div>
        </div>

        {/* Thông tin người nhận */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><FaUser /> Thông tin người nhận</div>
          <div>Họ tên: {order.customerInfo?.fullName || '-'}</div>
          <div>SĐT: {order.customerInfo?.phone || '-'}</div>
          <div>Địa chỉ: {order.customerInfo?.address || ''}, {order.customerInfo?.city || ''}</div>
          <div>Ghi chú: {order.customerInfo?.note || '-'}</div>
        </div>

        {/* Sản phẩm trong đơn hàng */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><FaBoxOpen /> Sản phẩm trong đơn hàng</div>
          
         
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Ảnh</th>
                  <th className="p-2 border">Tên sản phẩm</th>
                  <th className="p-2 border">SL</th>
                  <th className="p-2 border">Giá</th>
                  <th className="p-2 border">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border"><img src={item.image || '/images/no-image.svg'} alt={item.name || 'Product'} className="w-16 h-16 object-contain rounded" /></td>
                    <td className="p-2 border">
                      <div className="font-semibold">{item.name || 'N/A'}</div>
                      {item.colorName && <div className="text-xs text-gray-500">Màu: {item.colorName}</div>}
                      {item.imei && <div className="text-xs text-gray-500">IMEI: {item.imei}</div>}
                    </td>
                    <td className="p-2 border text-center">{item.quantity || 0}</td>
                    <td className="p-2 border">{(item.price || 0).toLocaleString()}₫</td>
                    <td className="p-2 border">{((item.price || 0) * (item.quantity || 0)).toLocaleString()}₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tổng kết đơn hàng */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><FaMoneyBill /> Tổng kết đơn hàng</div>
          <div className="grid grid-cols-2 gap-2">
            <div>Tổng tiền hàng:</div>
            <div className="text-right">{originalProductTotal.toLocaleString()}₫</div>
            {/* <div>Phí vận chuyển:</div>
            <div className="text-right">{shippingFee.toLocaleString()}₫</div> */}
            <div>Giảm giá {voucherCode && `(Mã: ${voucherCode})`}:</div>
            <div className="text-right">-{discount.toLocaleString()}₫</div>
            <div className="col-span-2 border-t my-2"></div>
            <div className="font-bold text-lg">Tổng thanh toán:</div>
            <div className="text-right font-bold text-blue-600 text-lg">{totalPayment.toLocaleString()}₫</div>
          </div>
        </div>

        {/* Lịch sử trạng thái đơn hàng */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><FaHistory /> Trạng thái đơn hàng</div>
          <div className="space-y-1">
            <div>✅ Đã đặt hàng: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
            {order.orderStatus === 'packing' && <div>✅ Đã xác nhận: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</div>}
            {order.orderStatus === 'shipping' && <div>🚚 Đang giao: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</div>}
            {order.orderStatus === 'delivered' && <div>✅ Đã giao: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</div>}
            {order.orderStatus === 'cancelled' && <div>❌ Đã hủy: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</div>}
            {/* Có thể bổ sung lịch sử chi tiết nếu backend trả về */}
          </div>
        </div>

        {/* Hành động */}
        <div className="border rounded-lg p-4 bg-gray-50 flex gap-2">
          {order.orderStatus === 'confirming' && (
            <Button
              onClick={handleConfirmOrder}
              disabled={actionLoading}
              className="bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              Xác nhận đơn (Chuyển sang Chờ lấy hàng)
            </Button>
          )}
          {order.orderStatus === 'packing' && (
            <Button
              onClick={handleShippingOrder}
              disabled={actionLoading}
              className="bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              Chuyển sang Chờ giao hàng
            </Button>
          )}
          {order.orderStatus === 'shipping' && (
            <Button
              onClick={handleDeliveredOrder}
              disabled={actionLoading}
              className="bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              Chuyển sang Đã giao
            </Button>
          )}
          {['confirming','packing'].includes(order.orderStatus || '') && (
            <Button variant="destructive" onClick={handleCancelOrder} disabled={actionLoading}>Huỷ đơn hàng</Button>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
} 