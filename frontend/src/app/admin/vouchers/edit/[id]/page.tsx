'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DefaultLayout from '@/components/admin/Layouts/DefaultLayout';
import Breadcrumb from '@/components/admin/Breadcrumbs/Breadcrumb';
import { getApiUrl } from '@/config/api';

interface Category {
    _id: string;
    ten_danh_muc: string;
    an_hien: boolean;
}

const EditVoucherPage = () => {
    const [formData, setFormData] = useState({
        ma_voucher: '',
        mo_ta: '',
        phan_tram_giam_gia: 0,
        giam_toi_da: 0,
        don_hang_toi_thieu: 0,
        so_luong: 0,
        da_su_dung: 0,
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        trang_thai: 'active',
        popup: false,
        hien_thi_cong_khai: false,
        danh_muc: [] as string[],
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    useEffect(() => {
        if (id) {
            fetchVoucherDetails();
        }
        fetchCategories();
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(getApiUrl('categories?an_hien=true'));
            const data = await response.json();
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchVoucherDetails = async () => {
        setLoading(true);
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('admin_token');
            if (!token) {
                setError('Bạn cần đăng nhập để xem thông tin voucher');
                setLoading(false);
                return;
            }

            const response = await fetch(getApiUrl(`vouchers/${id}`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else if (response.status === 403) {
                    setError('Bạn không có quyền truy cập trang này.');
                } else {
                    setError('Không thể tải thông tin voucher');
                }
                return;
            }

            const data = await response.json();
            if (data.success && data.data) {
                const voucher = data.data;
                setFormData({
                    ma_voucher: voucher.ma_voucher,
                    mo_ta: voucher.mo_ta,
                    phan_tram_giam_gia: voucher.phan_tram_giam_gia,
                    giam_toi_da: voucher.giam_toi_da,
                    don_hang_toi_thieu: voucher.don_hang_toi_thieu,
                    so_luong: voucher.so_luong,
                    da_su_dung: voucher.da_su_dung,
                    ngay_bat_dau: new Date(voucher.ngay_bat_dau).toISOString().split('T')[0],
                    ngay_ket_thuc: new Date(voucher.ngay_ket_thuc).toISOString().split('T')[0],
                    trang_thai: voucher.trang_thai,
                    popup: voucher.popup || false,
                    hien_thi_cong_khai: voucher.hien_thi_cong_khai || false,
                    danh_muc: voucher.danh_muc || [],
                });
            } else {
                setError(data.message || 'Không thể tải thông tin voucher');
            }
        } catch (err) {
            console.error('Lỗi khi fetch voucher details:', err);
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCategoryChange = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            danh_muc: prev.danh_muc.includes(categoryId)
                ? prev.danh_muc.filter(id => id !== categoryId)
                : [...prev.danh_muc, categoryId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (new Date(formData.ngay_bat_dau) >= new Date(formData.ngay_ket_thuc)) {
            setError('Ngày bắt đầu phải trước ngày kết thúc.');
            return;
        }

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('admin_token');
            if (!token) {
                setError('Bạn cần đăng nhập để thực hiện thao tác này');
                return;
            }

            const response = await fetch(getApiUrl(`vouchers/${id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                     ...formData,
                    phan_tram_giam_gia: Number(formData.phan_tram_giam_gia),
                    giam_toi_da: Number(formData.giam_toi_da),
                    don_hang_toi_thieu: Number(formData.don_hang_toi_thieu),
                    so_luong: Number(formData.so_luong),
                    popup: Boolean(formData.popup),
                    hien_thi_cong_khai: Boolean(formData.hien_thi_cong_khai),
                    danh_muc: formData.danh_muc,
                }),
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else if (response.status === 403) {
                    setError('Bạn không có quyền thực hiện thao tác này.');
                } else {
                    setError('Lỗi khi cập nhật voucher');
                }
                return;
            }

            const data = await response.json();
            if (data.success) {
                setSuccess('Cập nhật voucher thành công! Đang chuyển hướng...');
                setTimeout(() => {
                    router.push('/admin/vouchers');
                }, 3000);
            } else {
                setError(data.message || 'Cập nhật voucher thất bại.');
            }
        } catch (err) {
            setError('Lỗi kết nối server.');
        }
    };

    if (loading) {
        return <DefaultLayout><div className="flex justify-center items-center h-64">Đang tải...</div></DefaultLayout>;
    }

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Chỉnh Sửa Voucher" />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                 <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">Form Chỉnh Sửa Voucher</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6.5">
                    {error && <div className="mb-4 text-red-500 bg-red-100 border border-red-400 p-3 rounded">{error}</div>}
                    {success && <div className="mb-4 text-green-500 bg-green-100 border border-green-400 p-3 rounded">{success}</div>}

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Mã Voucher (Không thể thay đổi)</label>
                        <input
                            type="text"
                            name="ma_voucher"
                            value={formData.ma_voucher}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
                            disabled
                        />
                    </div>
                     <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Đã sử dụng</label>
                        <input
                            type="number"
                            name="da_su_dung"
                            value={formData.da_su_dung}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
                            disabled
                        />
                    </div>
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Mô tả</label>
                        <input
                            type="text"
                            name="mo_ta"
                            value={formData.mo_ta}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                            required
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Phần trăm giảm giá (%)</label>
                            <input
                                type="number"
                                name="phan_tram_giam_gia"
                                value={formData.phan_tram_giam_gia}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                                min="0" max="100"
                            />
                        </div>
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Giảm tối đa (VNĐ)</label>
                            <input
                                type="number"
                                name="giam_toi_da"
                                value={formData.giam_toi_da}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                                min="0"
                            />
                        </div>
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Đơn hàng tối thiểu (VNĐ)</label>
                            <input
                                type="number"
                                name="don_hang_toi_thieu"
                                value={formData.don_hang_toi_thieu}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                                min="0"
                            />
                        </div>
                    </div>
                     <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Số lượng</label>
                        <input
                            type="number"
                            name="so_luong"
                            value={formData.so_luong}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                            min={formData.da_su_dung || 0}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Ngày bắt đầu</label>
                            <input
                                type="date"
                                name="ngay_bat_dau"
                                value={formData.ngay_bat_dau}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                                required
                            />
                        </div>
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Ngày kết thúc</label>
                            <input
                                type="date"
                                name="ngay_ket_thuc"
                                value={formData.ngay_ket_thuc}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4.5">
                         <label className="mb-2.5 block text-black dark:text-white">Trạng thái</label>
                        <select
                            name="trang_thai"
                            value={formData.trang_thai}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary"
                        >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Ngừng</option>
                        </select>
                    </div>

                    <div className="mb-4.5">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="popup"
                                checked={formData.popup}
                                onChange={(e) => setFormData({ ...formData, popup: e.target.checked })}
                                className="rounded border-[1.5px] border-stroke bg-transparent"
                            />
                            <span className="text-black dark:text-white">Hiển thị trong popup khi vào trang web</span>
                        </label>
                    </div>

                    <div className="mb-4.5">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="hien_thi_cong_khai"
                                checked={formData.hien_thi_cong_khai}
                                onChange={(e) => setFormData({ ...formData, hien_thi_cong_khai: e.target.checked })}
                                className="rounded border-[1.5px] border-stroke bg-transparent"
                            />
                            <span className="text-black dark:text-white">Hiển thị công khai trong danh mục</span>
                        </label>
                    </div>

                    {formData.hien_thi_cong_khai && (
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Chọn danh mục hiển thị</label>
                            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto border border-stroke rounded p-3">
                                {categories.map((category) => (
                                    <label key={category._id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.danh_muc.includes(category._id)}
                                            onChange={() => handleCategoryChange(category._id)}
                                            className="rounded border-[1.5px] border-stroke bg-transparent"
                                        />
                                        <span className="text-black dark:text-white text-sm">{category.ten_danh_muc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                        Lưu thay đổi
                    </button>
                </form>
            </div>
        </DefaultLayout>
    );
};

export default EditVoucherPage; 