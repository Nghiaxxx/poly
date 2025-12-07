'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';

interface Voucher {
    _id: string;
    ma_voucher: string;
    mo_ta: string;
    phan_tram_giam_gia: number;
    giam_toi_da: number;
    don_hang_toi_thieu: number;
    so_luong: number;
    da_su_dung: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    trang_thai: string;
    danh_muc: string[];
}

interface CategoryVouchersProps {
    categoryId: string;
}

const CategoryVouchers: React.FC<CategoryVouchersProps> = ({ categoryId }) => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    useEffect(() => {
        if (categoryId) {
            fetchVouchers();
        }
    }, [categoryId]);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl(`vouchers/public/${categoryId}`));
            const data = await response.json();
            
            if (data.success) {
                setVouchers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            console.error('Failed to copy code:', error);
        }
    };

    const handleShowConditions = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setShowConditionModal(true);
    };

    const closeModal = () => {
        setShowConditionModal(false);
        setSelectedVoucher(null);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="w-full py-8">
                <div className="flex justify-center">
                    <div className="animate-pulse text-gray-500">Đang tải voucher...</div>
                </div>
            </div>
        );
    }

    if (vouchers.length === 0) {
        return null; // Không hiển thị gì nếu không có voucher
    }

    return (
        <div className="w-full py-8">
            <style jsx>{`
                .ticket-shape::before,
                .ticket-shape::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 20px;
                    height: 20px;
                    background: #f3f4f6;
                    border-radius: 50%;
                    z-index: 10;
                }
                .ticket-shape::before {
                    left: -10px;
                }
                .ticket-shape::after {
                    right: -10px;
                }
            `}</style>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-4">
                {vouchers.map((voucher) => {
                    const total = (voucher.so_luong ?? 0) + (voucher.da_su_dung ?? 0);
                    const remainingVouchers = Math.max(0, voucher.so_luong ?? 0);
                    
                    return (
                        <div
                            key={voucher._id}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-visible border border-gray-200 relative ticket-shape"
                        >
                            <div className="p-4">
                                {/* Header với mã voucher */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-blue-600 font-bold text-[14px]">Mã: {voucher.ma_voucher}</div>
                                    </div>
                                    <div className="text-right text-gray-500 text-[14px]">
                                        HSD: {formatDate(voucher.ngay_ket_thuc)}
                                    </div>
                                </div>

                                {/* Mô tả */}
                                <div className="mb-4">
                                    <p className="text-gray-800 text-[14px] leading-relaxed">{voucher.mo_ta}</p>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleShowConditions(voucher)}
                                        className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-white text-red-500 border-2 border-red-500 hover:bg-red-50"
                                    >
                                        Điều kiện
                                    </button>
                                    
                                    <button
                                        onClick={() => handleCopyCode(voucher.ma_voucher)}
                                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                            copiedCode === voucher.ma_voucher
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {copiedCode === voucher.ma_voucher ? 'Đã sao chép!' : 'Sao chép mã'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal thông tin điều kiện voucher */}
            {showConditionModal && selectedVoucher && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-blue-600">
                                Mã: {selectedVoucher.ma_voucher}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4"> 
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phần trăm giảm giá:</span>
                                    <span className="font-semibold text-red-600">
                                        {selectedVoucher.phan_tram_giam_gia}%
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Giảm tối đa:</span>
                                    <span className="font-semibold text-red-600">
                                        {formatCurrency(selectedVoucher.giam_toi_da)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Đơn hàng tối thiểu:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(selectedVoucher.don_hang_toi_thieu)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngày hết hạn:</span>
                                    <span className="font-semibold">
                                        {formatDate(selectedVoucher.ngay_ket_thuc)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Còn lại:</span>
                                    <span className="font-semibold text-green-600">
                                        {Math.max(0, selectedVoucher.so_luong ?? 0)} voucher
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex gap-3 p-4 border-t border-gray-200">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    handleCopyCode(selectedVoucher.ma_voucher);
                                    closeModal();
                                }}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                            >
                                Sao chép
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryVouchers; 