'use client';

import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from '@/config/api';
import { FaEye, FaCheck, FaTimes, FaClock, FaHistory } from "react-icons/fa";

interface ReturnRequest {
  _id: string;
  orderId: {
    _id: string;
    items: any[];
    totalAmount: number;
    orderStatus: string;
    paymentMethod: string;
  };
  userId: {
    _id: string;
    TenKH: string;
    email: string;
    Sdt?: string;
  };
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
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: <FaClock /> },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800', icon: <FaCheck /> },
  processing: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-800', icon: <FaHistory /> },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: <FaCheck /> },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: <FaTimes /> }
};

export default function ReturnRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchReturnRequests();
  }, [selectedStatus]);

  const fetchReturnRequests = async () => {
    setLoading(true);
    try {
      const url = selectedStatus 
        ? getApiUrl(`return-requests?status=${selectedStatus}`) 
        : getApiUrl('return-requests');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching return requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (request: ReturnRequest) => {
    router.push(`/admin/return-requests/${request._id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
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

  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý yêu cầu trả hàng</h1>
          <p className="text-gray-600">Xử lý các yêu cầu trả hàng và hoàn tiền từ khách hàng</p>
        </div>

        {/* Bộ lọc */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="approved">Đã duyệt</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Bảng yêu cầu */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 max-w-48 min-w-48">
                  Lý do
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền hoàn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phương thức thanh toán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{request.orderId._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.userId.TenKH}</div>
                    <div className="text-sm text-gray-500">{request.userId.email}</div>
                  </td>
                  <td className="px-6 py-4 w-48 max-w-48 min-w-48">
                    <div className="text-sm text-gray-900 max-w-48 truncate whitespace-nowrap" title={request.reason}>
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(request.refundAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {request.orderId.paymentMethod === 'wallet' && 'Ví PolyPay'}
                      {request.orderId.paymentMethod === 'momo' && 'Ví MoMo'}
                      {request.orderId.paymentMethod === 'atm' && 'Chuyển khoản ATM'}
                      {request.orderId.paymentMethod === 'cod' && 'COD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[request.status].color}`}>
                      {statusMap[request.status].icon}
                      {statusMap[request.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm text-gray-900">{formatDate(request.createdAt).split(' ')[1]}</div>
                    <div className="text-sm text-gray-500">{formatDate(request.createdAt).split(' ')[0]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetail(request)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                    >
                      <FaEye /> Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {requests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có yêu cầu trả hàng nào
            </div>
          )}
        </div>


      </div>
    </DefaultLayout>
  );
} 