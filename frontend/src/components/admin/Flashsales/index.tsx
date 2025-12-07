'use client';

import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';
import AddFlashSaleForm from './AddFlashSaleForm';
import EditFlashSaleForm from './EditFlashSaleForm';
import { showConfirmAlert } from '@/utils/sweetAlert';

interface FlashSaleVariantInEvent {
  id_variant: string;
  gia_flash_sale: number;
  so_luong: number;
  product_name?: string;
  variant_details?: string;
}

interface FlashSale {
  _id: string;
  ten_su_kien: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  an_hien: boolean;
  flashSaleVariants: FlashSaleVariantInEvent[];
}

const FlashSaleManagement = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState<FlashSale | null>(null);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm format thời gian để hiển thị
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        return 'Thời gian không hợp lệ';
      }
      
      // Format theo múi giờ Việt Nam (UTC+7)
      const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      
      const day = vietnamTime.getUTCDate().toString().padStart(2, '0');
      const month = (vietnamTime.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = vietnamTime.getUTCFullYear();
      const hours = vietnamTime.getUTCHours().toString().padStart(2, '0');
      const minutes = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:00 ${day}/${month}/${year}`;
    } catch (error) {
      console.error('Lỗi format thời gian:', error);
      return 'Lỗi thời gian';
    }
  };

  const getFlashSaleStatus = (flashSale: FlashSale) => {
    const now = new Date();
    const startTime = new Date(flashSale.thoi_gian_bat_dau);
    const endTime = new Date(flashSale.thoi_gian_ket_thuc);

    if (!flashSale.an_hien) {
      return { text: 'Ẩn', className: 'bg-gray-200 text-gray-800' };
    }

    if (now < startTime) {
      return { text: 'Sắp diễn ra', className: 'bg-yellow-200 text-yellow-800' };
    } else if (now >= startTime && now <= endTime) {
      return { text: 'Đang chạy', className: 'bg-green-200 text-green-800' };
    } else {
      // Kiểm tra xem flash sale đã kết thúc bao lâu
      const daysSinceEnd = Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceEnd > 30) {
        return { text: 'Đã kết thúc', className: 'bg-red-200 text-red-800' };
      } else {
        return { text: `Kết thúc ${daysSinceEnd} ngày trước`, className: 'bg-orange-200 text-orange-800' };
      }
    }
  };

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('flashsales'));
      const data = await response.json();
      
      // Filter thêm ở frontend để ẩn những flash sale đã kết thúc quá lâu
      let flashSalesData = Array.isArray(data.data) ? data.data : data;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      flashSalesData = flashSalesData.filter((fs: FlashSale) => {
        const endTime = new Date(fs.thoi_gian_ket_thuc);
        return endTime >= thirtyDaysAgo;
      });
      
      setFlashSales(flashSalesData);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchFlashSales();
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedFlashSale(null);
    fetchFlashSales();
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirmAlert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa flash sale này?', 'Xóa', 'Hủy');
    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`flashsales/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Lỗi khi xóa flash sale');
      }

      fetchFlashSales();
    } catch (error) {
      
      setError('Không thể xóa flash sale. Vui lòng thử lại sau.');
    }
  };

  const handleEdit = (flashSale: FlashSale) => {
    setSelectedFlashSale(flashSale);
    setShowEditForm(true);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <p>Đang tải danh sách Flash Sale...</p>
    </div>;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Quản lý Flash Sale" />

      <div className="w-full max-w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Thêm Flash Sale Mới
        </button>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}
        {flashSales.length === 0 ? (
          <p>Không có sự kiện Flash Sale nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-boxdark rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 dark:bg-meta-4 text-gray-700 dark:text-white uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Tên Sự Kiện</th>
                  <th className="py-3 px-6 text-left">Thời Gian Bắt Đầu</th>
                  <th className="py-3 px-6 text-left">Thời Gian Kết Thúc</th>
                  <th className="py-3 px-6 text-left">Trạng Thái</th>
                  <th className="py-3 px-6 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {flashSales.map((flashSale) => {
                  const status = getFlashSaleStatus(flashSale);
                  return (
                    <tr key={flashSale._id} className="border-b border-gray-200 dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{flashSale.ten_su_kien || 'N/A'}</td>
                      <td className="py-3 px-6 text-left">{flashSale.thoi_gian_bat_dau ? formatDateTime(flashSale.thoi_gian_bat_dau) : 'N/A'}</td>
                      <td className="py-3 px-6 text-left">{flashSale.thoi_gian_ket_thuc ? formatDateTime(flashSale.thoi_gian_ket_thuc) : 'N/A'}</td>
                      <td className="py-3 px-6 text-left">
                        <span className={`py-1 px-3 rounded-full text-xs ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center">
                          <button 
                            onClick={() => handleEdit(flashSale)}
                            className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(flashSale._id)}
                            className="w-4 mr-2 transform hover:text-red-500 hover:scale-110"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showAddForm && (
          <AddFlashSaleForm
            onClose={() => setShowAddForm(false)}
            onSuccess={handleAddSuccess}
          />
        )}

        {showEditForm && selectedFlashSale && (
          <EditFlashSaleForm
            flashSale={selectedFlashSale}
            onClose={() => {
              setShowEditForm(false);
              setSelectedFlashSale(null);
            }}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default FlashSaleManagement;
