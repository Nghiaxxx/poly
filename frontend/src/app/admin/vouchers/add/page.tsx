'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DefaultLayout from '@/components/admin/Layouts/DefaultLayout';
import Breadcrumb from '@/components/admin/Breadcrumbs/Breadcrumb';
import { getApiUrl } from '@/config/api';

interface Category {
    _id: string;
    ten_danh_muc: string;
    an_hien: boolean;
}

const AddVoucherPage = () => {
    const [formData, setFormData] = useState({
        ma_voucher: '',
        mo_ta: '',
        phan_tram_giam_gia: 0,
        giam_toi_da: 0,
        don_hang_toi_thieu: 0,
        so_luong: 100,
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        trang_thai: 'active',
        popup: false,
        hien_thi_cong_khai: false,
        danh_muc: [] as string[],
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    // Tính ngày hôm nay theo định dạng yyyy-mm-dd để dùng cho input[min]
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(getApiUrl('categories?an_hien=true'));
            const data = await response.json();
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const generateVoucherCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'POLY';
        // Tạo mã dài hơn để giảm khả năng trùng lặp
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Thêm timestamp để đảm bảo unique
        const timestamp = Date.now().toString().slice(-4);
        result += timestamp;
        setFormData({ ...formData, ma_voucher: result });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Ràng buộc cho ngày bắt đầu: không cho nhỏ hơn hôm nay
        if (name === 'ngay_bat_dau') {
            const chosen = value;
            if (chosen && chosen < todayStr) {
                // Nếu chọn ngày quá khứ, đặt về hôm nay
                setFormData({
                    ...formData,
                    ngay_bat_dau: todayStr,
                    // Nếu ngày kết thúc nhỏ hơn ngày bắt đầu mới, xóa để buộc chọn lại
                    ngay_ket_thuc: formData.ngay_ket_thuc && formData.ngay_ket_thuc < todayStr ? '' : formData.ngay_ket_thuc,
                });
                setError('Ngày bắt đầu không được trước hôm nay.');
                return;
            }

            // Nếu hợp lệ, cập nhật và đảm bảo ngày kết thúc không trước ngày bắt đầu
            setFormData({
                ...formData,
                ngay_bat_dau: chosen,
                ngay_ket_thuc: formData.ngay_ket_thuc && formData.ngay_ket_thuc < chosen ? '' : formData.ngay_ket_thuc,
            });
            setError('');
            return;
        }

        if (name === 'ngay_ket_thuc') {
            const chosen = value;
            // Không cho ngày kết thúc trước ngày bắt đầu (nếu đã chọn)
            if (formData.ngay_bat_dau && chosen < formData.ngay_bat_dau) {
                setError('Ngày kết thúc phải sau ngày bắt đầu.');
                setFormData({ ...formData, ngay_ket_thuc: '' });
                return;
            }
            setError('');
        }

        setFormData({
            ...formData,
            [name]: value,
        });
        
        // Kiểm tra mã voucher khi người dùng nhập
        if (name === 'ma_voucher' && value.trim()) {
            checkVoucherCode(value.trim());
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            danh_muc: prev.danh_muc.includes(categoryId)
                ? prev.danh_muc.filter(id => id !== categoryId)
                : [...prev.danh_muc, categoryId]
        }));
    };

    const checkVoucherCode = async (code: string) => {
        if (code.length < 4) return;
        
        try {
            const response = await fetch(getApiUrl(`vouchers/check/${code}`));
            const data = await response.json();
            
            if (data.exists) {
                setError('Mã voucher này đã tồn tại. Vui lòng chọn mã khác.');
            } else {
                setError(''); // Xóa lỗi nếu mã hợp lệ
            }
        } catch (err) {
            console.error('Lỗi khi kiểm tra mã voucher:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.ma_voucher.trim()) {
            setError('Mã voucher là bắt buộc.');
            return;
        }
        if (!formData.mo_ta.trim()) {
            setError('Mô tả là bắt buộc.');
            return;
        }
        if (!formData.ngay_bat_dau) {
            setError('Ngày bắt đầu là bắt buộc.');
            return;
        }
        if (!formData.ngay_ket_thuc) {
            setError('Ngày kết thúc là bắt buộc.');
            return;
        }
        // Không cho phép ngày bắt đầu trong quá khứ
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (new Date(formData.ngay_bat_dau) < startOfToday) {
            setError('Ngày bắt đầu không được trước hôm nay.');
            return;
        }
        if (new Date(formData.ngay_bat_dau) >= new Date(formData.ngay_ket_thuc)) {
            setError('Ngày bắt đầu phải trước ngày kết thúc.');
            return;
        }
        if (formData.phan_tram_giam_gia <= 0 || formData.phan_tram_giam_gia > 100) {
            setError('Phần trăm giảm giá phải từ 1-100%.');
            return;
        }
        if (formData.giam_toi_da <= 0) {
            setError('Mức giảm tối đa phải lớn hơn 0.');
            return;
        }
        if (formData.so_luong <= 0) {
            setError('Số lượng voucher phải lớn hơn 0.');
            return;
        }

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('admin_token');
            if (!token) {
                setError('Bạn cần đăng nhập để thực hiện thao tác này.');
                return;
            }

            const response = await fetch(getApiUrl('vouchers'), {
                method: 'POST',
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
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Thêm voucher thành công! Đang chuyển hướng...');
                setTimeout(() => {
                    router.push('/admin/vouchers');
                }, 2000);
            } else {
                setError(data.message || 'Thêm voucher thất bại.');
            }
        } catch (err) {
            console.error('Lỗi khi tạo voucher:', err);
            setError('Lỗi server khi tạo voucher.');
        }
    };

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Thêm Voucher Mới" />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">Form Thêm Voucher</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6.5">
                    {error && <div className="mb-4 text-red-500 bg-red-100 border border-red-400 p-3 rounded">{error}</div>}
                    {success && <div className="mb-4 text-green-500 bg-green-100 border border-green-400 p-3 rounded">{success}</div>}

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Mã Voucher</label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                name="ma_voucher"
                                value={formData.ma_voucher}
                                onChange={handleChange}
                                placeholder="POLYSMART123"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                required
                            />
                            <button type="button" onClick={generateVoucherCode} className="whitespace-nowrap bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">
                                Tạo mã ngẫu nhiên
                            </button>
                        </div>
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Mô tả</label>
                        <input
                            type="text"
                            name="mo_ta"
                            value={formData.mo_ta}
                            onChange={handleChange}
                            placeholder="Voucher giảm giá cho khách hàng mới"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
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
                                min="1" max="100" required
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
                                min="1" required
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
                                min="1"
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
                            min="1" required
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
                                min={todayStr}
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
                                min={formData.ngay_bat_dau || todayStr}
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
                        Thêm Voucher
                    </button>
                </form>
            </div>
        </DefaultLayout>
    );
};

export default AddVoucherPage; 