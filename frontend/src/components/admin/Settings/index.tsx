'use client';
import React, { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { getApiUrl, getBaseUrl } from '@/config/api'; 

interface Setting {
  _id: string;
  Logo: string;
  Banner: string;
  Page: string;
  So_dien_thoai: string;
  Thong_bao: string;
}

const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/images/no-image.svg';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${getBaseUrl()}${imageUrl.startsWith('/images/') ? imageUrl : '/images/' + imageUrl}`;
};

export default function SettingsPage() {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [form, setForm] = useState<Omit<Setting, '_id'>>({
    Logo: '',
    Banner: '',
    Page: '',
    So_dien_thoai: '',
    Thong_bao: ''
  });

  useEffect(() => {
    fetch(getApiUrl('settings'))
      .then(res => res.json())
      .then(data => {
        setSetting(data);
        setForm({
          Logo: data.Logo || '',
          Banner: data.Banner || '',
          Page: data.Page || '',
          So_dien_thoai: data.So_dien_thoai || '',
          Thong_bao: data.Thong_bao || ''
        });
        setLoading(false);
      });
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'Logo' | 'Banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(getApiUrl('settings/upload-image'), {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.url) {
      setForm(prev => ({ ...prev, [field]: data.url }));
      if (field === 'Logo') setLogoError('');
      if (field === 'Banner') setBannerError('');
      toast.success('Upload ảnh thành công!');
    } else {
      if (field === 'Logo') setLogoError(data.message || 'Lỗi upload ảnh');
      if (field === 'Banner') setBannerError(data.message || 'Lỗi upload ảnh');
      toast.error(data.message || 'Lỗi upload ảnh');
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('image', files[i]);
      const res = await fetch(getApiUrl('settings/upload-image'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
    setForm(prev => ({ ...prev, Banner: urls.join('|') }));
    setBannerError('');
    toast.success('Upload ảnh banner thành công!');
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append('image', files[i]);
    const res = await fetch(getApiUrl('settings/upload-image'), {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.url) urls.push(data.url);
  }
      setForm(prev => ({ ...prev, Logo: urls.join('|') }));
      setLogoError('');
      toast.success('Upload ảnh logo thành công!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setting) return;
    const res = await fetch(getApiUrl(`settings/${setting._id}`), {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success('Cập nhật thành công!');
    } else {
      toast.error('Cập nhật thất bại!');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Đang tải...</div>;
  if (!setting) return <div className="flex justify-center items-center min-h-screen">Không có dữ liệu cài đặt</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Cài đặt website</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Bên trái: Banner & Logo */}
          <div className="md:w-1/2 w-full flex flex-col gap-6">
            <div>
              <label className="block font-medium mb-1">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} />
              <div className="flex flex-wrap gap-2 mt-2">
                {form.Logo && form.Logo.split('|').map((url, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(url)}
                    alt={`Logo ${idx + 1}`}
                    className="w-20 h-20 object-contain border rounded bg-gray-50"
                  />
                ))}
              </div>
              {logoError && <div className="text-red-600 text-sm">{logoError}</div>}
            </div>
            <div>
              <label className="block font-medium mb-1">Banner</label>
              <input type="file" accept="image/*" multiple onChange={handleBannerChange} />
              <div className="flex flex-col gap-2 mt-2">
                {form.Banner && form.Banner.split('|').map((url, idx, arr) => (
                  <div key={idx} className="relative group flex items-center gap-2">
                    <img
                      src={getImageUrl(url)}
                      alt={`Banner ${idx + 1}`}
                      className="w-full h-28 object-cover border rounded"
                    />
                    {/* Nút di chuyển lên */}
                    <button
                      type="button"
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs font-semibold ml-2"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const banners = form.Banner.split('|');
                        [banners[idx - 1], banners[idx]] = [banners[idx], banners[idx - 1]];
                        setForm(prev => ({ ...prev, Banner: banners.join('|') }));
                      }}
                    >
                      ↑
                    </button>
                    {/* Nút di chuyển xuống */}
                    <button
                      type="button"
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs font-semibold"
                      disabled={idx === arr.length - 1}
                      onClick={() => {
                        if (idx === arr.length - 1) return;
                        const banners = form.Banner.split('|');
                        [banners[idx], banners[idx + 1]] = [banners[idx + 1], banners[idx]];
                        setForm(prev => ({ ...prev, Banner: banners.join('|') }));
                      }}
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
              {bannerError && <div className="text-red-600 text-sm">{bannerError}</div>}
            </div>
          </div>
          {/* Bên phải: Thông tin */}
          <div className="md:w-1/2 w-full flex flex-col gap-5">
            <div>
              <label className="block font-medium mb-1">Tên trang</label>
              <input
                type="text"
                name="Page"
                value={form.Page}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Số điện thoại</label>
              <input
                type="text"
                name="So_dien_thoai"
                value={form.So_dien_thoai}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Thông báo</label>
              <textarea
                name="Thong_bao"
                value={form.Thong_bao}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 min-h-[80px]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2 self-end"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </form>
      <Toaster position="top-right" />
    </div>
  );
}