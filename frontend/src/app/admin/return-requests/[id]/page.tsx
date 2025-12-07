'use client';

import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from '@/config/api';
import { FaArrowLeft, FaCheck, FaTimes, FaClock, FaHistory, FaUser, FaBoxOpen, FaMoneyBill } from "react-icons/fa";
import Swal from 'sweetalert2';

interface ReturnRequest {
  _id: string;
  orderId: {
    _id: string;
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
    orderStatus: string;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
  };
  userId: {
    _id: string;
    TenKH: string;
    email: string;
    Sdt?: string;
  };
  selectedProducts: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
    colorName?: string;
  }>;
  reason: string;
  description: string;
  email: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  refundAmount: number;
  refundMethod: string;
  adminNotes?: string;
  processedBy?: {
    _id: string;
    TenKH: string;
    email: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusMap = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <FaClock /> },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <FaCheck /> },
  processing: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <FaHistory /> },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 border-green-200', icon: <FaCheck /> },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800 border-red-200', icon: <FaTimes /> }
};

export default function ReturnRequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (id) {
      fetchReturnRequest();
    }
  }, [id]);

  // Cập nhật newStatus khi request.status thay đổi
  useEffect(() => {
    if (request) {
      const currentStatus = request.status;
      let defaultNewStatus = '';
      
      switch (currentStatus) {
        case 'pending':
          defaultNewStatus = 'approved';
          break;
        case 'approved':
          defaultNewStatus = 'processing';
          break;
        case 'processing':
          defaultNewStatus = 'completed';
          break;
        case 'completed':
        case 'rejected':
          defaultNewStatus = currentStatus;
          break;
        default:
          defaultNewStatus = '';
      }
      
      setNewStatus(defaultNewStatus);
    }
  }, [request]);

  const renderStatusOptions = () => {
    if (!request) return null;
    
    switch (request.status) {
      case 'pending':
        return (
          <>
            <option value="approved">Duyệt yêu cầu</option>
            <option value="rejected">Từ chối</option>
          </>
        );
      case 'approved':
        return (
          <>
            <option value="processing">Đang xử lý</option>
            <option value="rejected">Từ chối</option>
          </>
        );
      case 'processing':
        return (
          <>
            <option value="completed">Hoàn thành</option>
            <option value="rejected">Từ chối</option>
          </>
        );
      case 'completed':
        return <option value="completed" disabled>Hoàn thành</option>;
      case 'rejected':
        return <option value="rejected" disabled>Từ chối</option>;
      default:
        return null;
    }
  };

  const fetchReturnRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`return-requests/${id}`));
      const data = await response.json();
      
      if (data.success) {
        setRequest(data.data);
        setAdminNotes(data.data.adminNotes || '');
        // newStatus sẽ được cập nhật tự động bởi useEffect
      } else {
        await Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể tải thông tin yêu cầu trả hàng',
          icon: 'error'
        });
        router.push('/admin/return-requests');
      }
    } catch (error) {
      console.error('Error fetching return request:', error);
      await Swal.fire({
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi tải dữ liệu',
        icon: 'error'
      });
      router.push('/admin/return-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!request) return;

    // Kiểm tra logic trạng thái
    const currentStatus = request.status;
    
    console.log('Status update check:', {
      currentStatus,
      newStatus,
      isSame: newStatus === currentStatus
    });
    
    // Không cho phép cập nhật nếu đã hoàn thành hoặc từ chối
    if (currentStatus === 'completed' || currentStatus === 'rejected') {
      await Swal.fire({
        title: 'Không thể cập nhật!',
        text: `Yêu cầu trả hàng đã ở trạng thái "${statusMap[currentStatus].label}" và không thể thay đổi.`,
        icon: 'warning'
      });
      return;
    }

    // Kiểm tra nếu newStatus rỗng hoặc không hợp lệ
    if (!newStatus || newStatus.trim() === '') {
      await Swal.fire({
        title: 'Lỗi!',
        text: 'Vui lòng chọn trạng thái mới.',
        icon: 'error'
      });
      return;
    }

    // Kiểm tra nếu trạng thái mới giống trạng thái hiện tại
    if (newStatus === currentStatus) {
      await Swal.fire({
        title: 'Thông báo',
        text: 'Trạng thái mới giống với trạng thái hiện tại. Vui lòng chọn trạng thái khác.',
        icon: 'info'
      });
      return;
    }

    // Kiểm tra logic chuyển trạng thái hợp lệ
    const validTransitions: Record<string, string[]> = {
      'pending': ['approved', 'rejected'],
      'approved': ['processing', 'rejected'],
      'processing': ['completed', 'rejected'],
      'completed': [], // Không thể chuyển sang trạng thái nào khác
      'rejected': []   // Không thể chuyển sang trạng thái nào khác
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      await Swal.fire({
        title: 'Chuyển trạng thái không hợp lệ!',
        text: `Không thể chuyển từ "${statusMap[currentStatus as keyof typeof statusMap].label}" sang "${statusMap[newStatus as keyof typeof statusMap].label}".`,
        icon: 'error'
      });
      return;
    }

    // Tạo thông điệp xác nhận dựa trên trạng thái mới
    let confirmTitle = 'Cập nhật trạng thái';
    let confirmText = 'Bạn có chắc chắn muốn cập nhật trạng thái yêu cầu trả hàng này?';
    let confirmButtonText = 'Cập nhật';
    let confirmButtonColor = '#3085d6';

    switch (newStatus) {
      case 'approved':
        confirmTitle = 'Duyệt yêu cầu trả hàng';
        confirmText = 'Bạn có chắc chắn muốn duyệt yêu cầu trả hàng này? Hệ thống sẽ chuyển sang trạng thái "Đã duyệt" để xác nhận yêu cầu. Lưu ý: Không thể quay lại trạng thái "Chờ xử lý".';
        confirmButtonText = 'Duyệt yêu cầu';
        confirmButtonColor = '#10b981';
        break;
      case 'processing':
        confirmTitle = 'Bắt đầu xử lý';
        confirmText = 'Bạn có chắc chắn muốn bắt đầu xử lý yêu cầu trả hàng này? Hệ thống sẽ chuyển sang trạng thái "Đang xử lý" để nhận hàng về từ khách hàng. Lưu ý: Không thể quay lại trạng thái "Đã duyệt".';
        confirmButtonText = 'Bắt đầu xử lý';
        confirmButtonColor = '#3b82f6';
        break;
      case 'completed':
        confirmTitle = 'Hoàn thành yêu cầu';
        confirmText = 'Bạn có chắc chắn yêu cầu trả hàng này đã được hoàn thành? Hệ thống sẽ thực hiện hoàn tiền vào ví PolyPay của khách hàng. Hành động này không thể hoàn tác.';
        confirmButtonText = 'Hoàn thành';
        confirmButtonColor = '#10b981';
        break;
      case 'rejected':
        confirmTitle = 'Từ chối yêu cầu';
        confirmText = 'Bạn có chắc chắn muốn từ chối yêu cầu trả hàng này? Hành động này không thể hoàn tác.';
        confirmButtonText = 'Từ chối';
        confirmButtonColor = '#ef4444';
        break;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: newStatus === 'rejected' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Hủy bỏ'
    });

    if (!result.isConfirmed) return;

    setUpdating(true);
    try {
      console.log('Updating status:', {
        requestId: request._id,
        currentStatus,
        newStatus,
        adminNotes,
        url: getApiUrl(`return-requests/${request._id}/status`)
      });

      const response = await fetch(getApiUrl(`return-requests/${request._id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        await Swal.fire({
          title: 'Thành công!',
          text: 'Cập nhật trạng thái yêu cầu trả hàng thành công.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        fetchReturnRequest(); // Reload data
      } else {
        await Swal.fire({
          title: 'Lỗi!',
          text: `Cập nhật thất bại: ${data.message || 'Có lỗi xảy ra'}`,
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating return request:', error);
      await Swal.fire({
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi cập nhật trạng thái.',
        icon: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/images/placeholder.jpg';
    return imagePath.startsWith('http') ? imagePath : `/images/${imagePath}`;
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </DefaultLayout>
    );
  }

  if (!request) {
    return (
      <DefaultLayout>
        <div className="text-center py-8">
          <div className="text-gray-500">Không tìm thấy yêu cầu trả hàng</div>
          <button
            onClick={() => router.push('/admin/return-requests')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/return-requests')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FaArrowLeft /> Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết yêu cầu trả hàng #{request._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600">Đơn hàng #{request.orderId._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái - Thông tin chi tiết */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin đơn hàng */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaBoxOpen className="text-blue-600" />
                <h2 className="text-lg font-semibold">Thông tin đơn hàng</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Mã đơn hàng:</span>
                  <span className="font-medium">#{request.orderId._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Ngày đặt:</span>
                  <span className="font-medium">{formatDate(request.orderId.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Tổng tiền:</span>
                  <span className="font-medium text-blue-600 font-semibold">{formatCurrency(request.orderId.totalAmount)}</span>
                </div>
                
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Trạng thái đơn hàng:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Đã giao hàng
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Trạng thái thanh toán:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Đã thanh toán
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaUser className="text-green-600" />
                <h2 className="text-lg font-semibold">Thông tin khách hàng</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Họ tên:</span>
                  <span className="font-medium">{request.userId.TenKH}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Email:</span>
                  <span className="font-medium">{request.userId.email}</span>
                </div>
                {request.userId.Sdt && (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-gray-600 whitespace-nowrap">Số điện thoại:</span>
                    <span className="font-medium">{request.userId.Sdt}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-600 whitespace-nowrap">Email liên hệ:</span>
                  <span className="font-medium">{request.email}</span>
                </div>
              </div>
            </div>

            {/* Sản phẩm được trả hàng */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Sản phẩm được yêu cầu trả hàng</h2>
              <div className="space-y-4">
                {request.selectedProducts?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-red-50 border-red-200">
                    <img
                      src={getImageUrl(item.image || '')}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.colorName && (
                        <p className="text-sm text-gray-600">Màu: {item.colorName}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chi tiết yêu cầu trả hàng */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Chi tiết yêu cầu trả hàng</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 text-sm">Lý do trả hàng:</span>
                  <p className="font-medium mt-1">{request.reason}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Mô tả chi tiết:</span>
                  <p className="mt-1 bg-gray-50 p-3 rounded-md">{request.description}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Ngày tạo yêu cầu:</span>
                  <p className="font-medium mt-1">{formatDate(request.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải - Thông tin hoàn tiền và xử lý */}
          <div className="space-y-6">
            {/* Thông tin hoàn tiền */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaMoneyBill className="text-yellow-600" />
                <h2 className="text-lg font-semibold">Thông tin hoàn tiền</h2>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Số tiền hoàn lại</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(request.refundAmount)}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Phương thức thanh toán gốc:</span>
                  <p className="font-medium mt-1">
                    {request.orderId.paymentMethod === 'wallet' && 'Ví PolyPay'}
                    {request.orderId.paymentMethod === 'momo' && 'Ví MoMo'}
                    {request.orderId.paymentMethod === 'atm' && 'Chuyển khoản ATM'}
                    {request.orderId.paymentMethod === 'cod' && 'Thanh toán khi nhận hàng (COD)'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Phương thức hoàn tiền:</span>
                  <p className="font-medium mt-1 text-green-600">Ví PolyPay</p>
                </div>
                {/* <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Thông tin hoàn tiền</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>Quy trình xử lý:</strong><br/>
                    1. <strong>Duyệt</strong> (approved): Xác nhận yêu cầu trả hàng<br/>
                    2. <strong>Xử lý</strong> (processing): Nhận hàng về từ khách hàng<br/>
                    3. <strong>Hoàn thành</strong> (completed): Thực hiện hoàn tiền vào ví PolyPay<br/>
                    <br/>
                    <strong>Lưu ý:</strong> Hoàn tiền chỉ xảy ra khi trạng thái là "Hoàn thành"<br/>
                    <strong>Quy tắc:</strong> Không thể quay lại trạng thái cũ, chỉ tiến tới trạng thái tiếp theo
                  </p>
                </div> */}
              </div>
            </div>

            {/* Trạng thái hiện tại */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Trạng thái hiện tại</h2>
              <div className="text-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusMap[request.status].color}`}>
                  {statusMap[request.status].icon}
                  {statusMap[request.status].label}
                </span>
                {request.processedBy && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Xử lý bởi: {request.processedBy.TenKH}</p>
                    {request.processedAt && (
                      <p>Vào lúc: {formatDate(request.processedAt)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form cập nhật */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Cập nhật trạng thái</h2>
              {(request.status === 'completed' || request.status === 'rejected') ? (
                <div className="text-center py-4">
                  <div className="text-gray-500 mb-2">
                    Yêu cầu trả hàng đã được xử lý
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái mới:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      {renderStatusOptions()}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú của admin:
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Ghi chú về việc xử lý yêu cầu trả hàng..."
                    />
                  </div>
                  
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                  </button>
                </div>
              )}
            </div>

            {/* Ghi chú hiện tại */}
            {request.adminNotes && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Ghi chú hiện tại:</h3>
                <p className="text-sm text-blue-800">{request.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
} 