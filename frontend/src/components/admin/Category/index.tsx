"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FaEdit, FaEye, FaEyeSlash, FaPlus, FaHome, FaImage } from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getApiUrl, getBaseUrl } from '@/config/api';

interface Category {
  _id: string;
  ten_danh_muc: string;
  video?: string;
  an_hien?: boolean;
}

const getVideoUrl = (videoUrl: string | undefined): string => {
  if (!videoUrl) return '';
  if (videoUrl.startsWith('http')) return videoUrl;
      return `${getBaseUrl()}/video/${videoUrl.replace(/^\/video\//, '')}`;
};

export default function CategoryAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    ten_danh_muc: "",
    video: ""
  });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const router = useRouter();

  useEffect(() => {
          fetch(getApiUrl('categories'))
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu danh mục");
        return res.json();
      })
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Lọc và phân trang
  const filtered = categories.filter(c =>
    c.ten_danh_muc.toLowerCase().includes(globalFilter.toLowerCase())
  );
  const pageCount = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const openEditModal = (category: Category) => {
    setEditCategory(category);
    setNewCategory({
      ten_danh_muc: category.ten_danh_muc || "",
      video: category.video || ""
    });
    setShowModal(true);
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    
    
    
    // Kiểm tra kích thước file (giới hạn 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setImageError('Video quá lớn. Vui lòng chọn video nhỏ hơn 50MB');
      return;
    }
    
    // Kiểm tra định dạng file
    if (!file.type.startsWith('video/')) {
      setImageError('Vui lòng chọn file video hợp lệ');
      return;
    }
    
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      
      
      const res = await fetch(getApiUrl('categories/upload-video'), {
        method: 'POST',
        body: formData,
      });
      
      
      
      if (!res.ok) {
        const errorText = await res.text();
        
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      
      if (data.url) {
        
        setNewCategory(prev => ({ ...prev, video: data.url }));
        setImageError("");
        toast.success('Upload video thành công!');
        
        // Log state sau khi update

      } else {
        
        setImageError(data.message || 'Lỗi: Không nhận được URL video từ server');
      }
    } catch (error) {
      
      setImageError('Lỗi upload video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.ten_danh_muc.trim()) {
      toast.error("Vui lòng nhập tên danh mục!");
      return;
    }

    setSaving(true);

    // Chuẩn bị dữ liệu để gửi
    const categoryData: any = {
      ten_danh_muc: newCategory.ten_danh_muc.trim(),
      an_hien: true // Mặc định hiển thị khi tạo mới
    };

    // Chỉ thêm video nếu có
    if (newCategory.video && newCategory.video.trim()) {
      categoryData.video = newCategory.video.trim();
      
    } else {
      
    }

    

    try {
      if (editCategory) {
        // Sửa danh mục
        const res = await fetch(getApiUrl(`categories/${editCategory._id}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData)
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setCategories(prev => prev.map(c => c._id === data._id ? data : c));
        setShowModal(false);
        setEditCategory(null);
        setNewCategory({ ten_danh_muc: "", video: "" });
        toast.success('Đã cập nhật danh mục thành công!');
      } else {
        // Thêm danh mục mới

        
        
        const res = await fetch(getApiUrl('categories'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData)
        });




        if (!res.ok) {
          let errorMessage = `HTTP error! status: ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
  
          } catch (parseError) {

          }
          throw new Error(errorMessage);
        }

        const data = await res.json();

        setCategories(prev => [data, ...prev]);
        setShowModal(false);
        setNewCategory({ ten_danh_muc: "", video: "" });
        toast.success('Đã thêm danh mục thành công!');
      }
    } catch (error) {
      
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = (categoryId: string) => {
            fetch(getApiUrl(`categories/${categoryId}/toggle-visibility`), {
      method: 'PATCH',
    })
      .then(res => {
        if (!res.ok) throw new Error('Lỗi khi thay đổi trạng thái danh mục');
        return res.json();
      })
      .then(data => {
        setCategories(prev => prev.map(c => c._id === data._id ? data : c));
        const status = data.an_hien ? 'hiện' : 'ẩn';
        toast.success(`Đã ${status} danh mục thành công!`);
      })
      .catch(err => {
        toast.error(err.message);
      });
  };

  const handleDeleteCategory = () => {
    if (!deleteId) return;
            fetch(getApiUrl(`categories/${deleteId}`), {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Lỗi khi xóa danh mục');
        setCategories(prev => prev.filter(c => c._id !== deleteId));
        toast.success('Đã xóa danh mục thành công!');
        setDeleteId(null);
      })
      .catch(err => {
        toast.error(err.message);
        setDeleteId(null);
      });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Quản lý danh mục
        </h2>
        <div className="flex gap-4">
          <input
            placeholder="Tìm kiếm danh mục..."
            value={globalFilter}
            onChange={e => { setGlobalFilter(e.target.value); setPageIndex(0); }}
            className="w-64 border rounded px-3 py-2"
          />
                  <button
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow flex items-center gap-2"
          onClick={() => { 
            setShowModal(true); 
            setEditCategory(null); 
            setImageError(""); 
            setNewCategory({ ten_danh_muc: "", video: "" });
          }}
        >
          <FaPlus /> Thêm danh mục
        </button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full border rounded-lg overflow-hidden text-black">
          <thead>
            <tr className="text-black">
              <th className="border px-4 py-2 text-left">STT</th>
              <th className="border px-4 py-2 text-left">Tên danh mục</th>
              <th className="border px-4 py-2 text-left">Video</th>
              <th className="border px-4 py-2 text-center">Trạng thái</th>
              <th className="border px-4 py-2 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">Chưa có danh mục nào.</td>
              </tr>
            ) : (
              paged.map((c, idx) => (
                <tr key={c._id}>
                  <td className="border px-4 py-2">{pageIndex * pageSize + idx + 1}</td>
                  <td className="border px-4 py-2">{c.ten_danh_muc}</td>
                  <td className="border px-4 py-2">
                    {c.video ? (
                      <video width={120} height={60} controls style={{ borderRadius: 8 }}>
                        <source src={getVideoUrl(c.video)} type="video/mp4" />
                        Trình duyệt không hỗ trợ video.
                      </video>
                    ) : (
                      <span className="text-gray-400 italic">Không có video</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.an_hien 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {c.an_hien ? 'Đang hiện' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Sửa"
                        className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full shadow flex items-center justify-center"
                        onClick={() => openEditModal(c)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        title={c.an_hien ? "Ẩn" : "Hiện"}
                        className={`p-2 rounded-full shadow flex items-center justify-center ${
                          c.an_hien 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        onClick={() => handleToggleVisibility(c._id)}
                      >
                        {c.an_hien ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded"
            onClick={() => setPageIndex(i => Math.max(i - 1, 0))}
            disabled={pageIndex === 0}
          >
            Trước
          </button>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => setPageIndex(i => Math.min(i + 1, pageCount - 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            Sau
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Trang {pageIndex + 1} / {pageCount || 1}
          </span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 20, 30, 40, 50].map(sz => (
              <option key={sz} value={sz}>Hiển thị {sz}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal thêm/sửa danh mục */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative animate-slide-down text-black">
            <h2 className="text-xl font-bold mb-4 text-blue-700">{editCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục *
                </label>
                <input
                  className="w-full border rounded px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên danh mục..."
                  value={newCategory.ten_danh_muc}
                  onChange={e => setNewCategory({ ...newCategory, ten_danh_muc: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && handleSaveCategory()}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-black font-medium">
                  <FaImage /> Video danh mục (tùy chọn)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="border rounded px-3 py-2 text-black"
                  onChange={handleVideoChange}
                />
                {newCategory.video && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Video đã chọn:</p>
                    <video width={200} height={100} controls style={{ borderRadius: 8 }}>
                      <source src={getVideoUrl(newCategory.video)} type="video/mp4" />
                      Trình duyệt không hỗ trợ video.
                    </video>
                    <button
                      type="button"
                      onClick={() => setNewCategory(prev => ({ ...prev, video: "" }))}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Xóa video
                    </button>
                  </div>
                )}
                {imageError && (
                  <div className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded">{imageError}</div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
                onClick={() => { 
                  setShowModal(false); 
                  setEditCategory(null); 
                  setImageError(""); 
                  setNewCategory({ ten_danh_muc: "", video: "" });
                }}
                disabled={saving}
              >Đóng</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveCategory}
                disabled={!newCategory.ten_danh_muc.trim() || saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />

      {/* Modal xác nhận xóa */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm text-center animate-slide-down">
            <h3 className="text-xl font-bold mb-4 text-red-600">Xác nhận xóa danh mục</h3>
            <p className="mb-6 text-black">Bạn có chắc chắn muốn xóa danh mục này không?</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
                onClick={() => setDeleteId(null)}
              >Hủy</button>
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleDeleteCategory}
              >Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}