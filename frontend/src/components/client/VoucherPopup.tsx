'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Copy, CheckCircle } from 'lucide-react';
import { getPopupVoucher, VoucherPopupData } from '@/services/voucherService';

const VoucherPopup = () => {
    const [voucher, setVoucher] = useState<VoucherPopupData | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);
    const pathname = usePathname();

    // Chỉ hiển thị popup ở trang client, không hiển thị ở admin
    const isAdminPage = pathname?.startsWith('/admin');
    
    // Track user interaction
    useEffect(() => {
        const handleInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
            }
        };

        // Listen for user interactions
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, [hasInteracted]);
    
    useEffect(() => {
        // Nếu là trang admin, không hiển thị popup
        if (isAdminPage) {
            setLoading(false);
            return;
        }

        // Chỉ fetch và hiển thị popup sau khi user đã tương tác
        if (!hasInteracted) {
            setLoading(false);
            return;
        }

        // Kiểm tra xem popup đã được hiển thị trong session này chưa
        const hasShownPopup = sessionStorage.getItem('voucher_popup_shown');
        if (!hasShownPopup) {
            // Delay 3 giây sau khi user tương tác trước khi hiển thị popup
            const timer = setTimeout(() => {
                fetchPopupVoucher();
            }, 3000);
            
            return () => clearTimeout(timer);
        } else {
            setLoading(false);
        }
    }, [isAdminPage, hasInteracted]);

    const fetchPopupVoucher = async () => {
        try {
            const popupVoucher = await getPopupVoucher();
            
            if (popupVoucher) {
                setVoucher(popupVoucher);
                setIsVisible(true);
                // Đánh dấu đã hiển thị popup trong session này
                sessionStorage.setItem('voucher_popup_shown', 'true');
            }
        } catch (error) {
            console.warn('Failed to fetch voucher popup:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleCopyCode = async () => {
        if (voucher) {
            try {
                await navigator.clipboard.writeText(voucher.ma_voucher);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (error) {
                console.warn('Failed to copy voucher code:', error);
                // Fallback cho các trình duyệt không hỗ trợ clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = voucher.ma_voucher;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
        }
    };

    const formatCurrency = (num: number) => {
        return num.toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading || !isVisible || !voucher) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-lg bg-gradient-to-br from-red-600 to-red-800 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header với nút đóng */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={handleClose}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Background với hiệu ứng ánh sáng */}
                <div className="absolute inset-0">
                    {/* Radial gradient từ trung tâm */}
                    <div className="absolute inset-0 bg-gradient-radial from-red-500 via-red-600 to-red-800"></div>
                    
                    {/* Các tia sáng vàng từ trên xuống */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
                        <div className="absolute top-0 left-1/4 w-1 h-32 bg-gradient-to-b from-yellow-300 to-transparent opacity-60"></div>
                        <div className="absolute top-0 left-1/2 w-1 h-40 bg-gradient-to-b from-yellow-300 to-transparent opacity-60"></div>
                        <div className="absolute top-0 left-3/4 w-1 h-28 bg-gradient-to-b from-yellow-300 to-transparent opacity-60"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative p-8 text-center text-white">
                    {/* Main Title */}
                    <h1 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                        XẢ KHO VOUCHER
                    </h1>
                    
                    {/* Banner "CỰC ĐÃ" */}
                    <div className="relative mb-6">
                        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full px-8 py-3 shadow-lg">
                            <h2 className="text-2xl font-black text-red-600">
                                CỰC ĐÃ
                            </h2>
                        </div>
                        {/* Golden outline */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full px-8 py-3 -z-10 blur-sm"></div>
                    </div>

                    {/* Quà tặng đến 500K */}
                    <div className="bg-red-500 rounded-2xl px-6 py-3 mb-8 inline-block">
                        <p className="text-lg font-bold text-white">
                            QUÀ TẶNG ĐẾN {formatCurrency(voucher.giam_toi_da)}
                        </p>
                    </div>
                    {/* Spotlights */}
                    <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
                        {/* Left spotlight */}
                        <div className="absolute bottom-0 left-4 w-16 h-16">
                            <div className="grid grid-cols-4 gap-1">
                                {[...Array(16)].map((_, i) => (
                                    <div key={i} className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
                                ))}
                            </div>
                            {/* Light beam */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-yellow-300 to-transparent opacity-60"></div>
                        </div>

                        {/* Right spotlight */}
                        <div className="absolute bottom-0 right-4 w-16 h-16">
                            <div className="grid grid-cols-4 gap-1">
                                {[...Array(16)].map((_, i) => (
                                    <div key={i} className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
                                ))}
                            </div>
                            {/* Light beam */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-yellow-300 to-transparent opacity-60"></div>
                        </div>
                    </div>

                    {/* Flying Voucher Envelopes */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Left side envelopes */}
                        <div className="absolute left-8 top-32 animate-bounce">
                            <div className="bg-red-500 w-16 h-20 rounded-lg border-2 border-yellow-400 relative">
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold">
                                    {formatCurrency(voucher.don_hang_toi_thieu)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="absolute left-12 top-20 animate-bounce" style={{animationDelay: '0.5s'}}>
                            <div className="bg-red-500 w-20 h-24 rounded-lg border-2 border-yellow-400 relative">
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold text-center">
                                    <div>1 TRIỆU</div>
                                </div>
                            </div>
                        </div>

                        {/* Right side envelopes */}
                        <div className="absolute right-8 top-32 animate-bounce" style={{animationDelay: '0.3s'}}>
                            <div className="bg-red-500 w-16 h-20 rounded-lg border-2 border-yellow-400 relative">
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold">
                                    {formatCurrency(voucher.giam_toi_da)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="absolute right-12 top-20 animate-bounce" style={{animationDelay: '0.8s'}}>
                            <div className="bg-red-500 w-20 h-24 rounded-lg border-2 border-yellow-400 relative">
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold text-center">
                                    <div>500K</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voucher code section */}
                    <div className="relative z-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-yellow-300">
                        <p className="text-yellow-200 text-sm mb-3">Mã voucher của bạn:</p>
                        <div className="flex items-center justify-center space-x-3">
                            <code className="text-2xl font-mono font-bold text-yellow-300 bg-white bg-opacity-20 px-4 py-2 rounded-lg border border-yellow-400">
                                {voucher.ma_voucher}
                            </code>
                            <button
                                onClick={handleCopyCode}
                                className="p-2 text-yellow-200 hover:text-yellow-300 transition-colors bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
                                title="Copy mã voucher"
                            >
                                {isCopied ? (
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                ) : (
                                    <Copy className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Discount info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="text-center bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-yellow-300">
                            <p className="text-3xl font-bold text-yellow-300">
                                {voucher.phan_tram_giam_gia}%
                            </p>
                            <p className="text-sm text-yellow-200">Giảm giá</p>
                        </div>
                        <div className="text-center bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-yellow-300">
                            <p className="text-2xl font-bold text-yellow-300">
                                {formatCurrency(voucher.giam_toi_da)}
                            </p>
                            <p className="text-sm text-yellow-200">Giảm tối đa</p>
                        </div>
                    </div>

                    {/* Voucher conditions and dates */}
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-2 mb-2 border border-yellow-300">
                        <div className="grid grid-cols-1 gap-0">
                            <div className="flex justify-between items-center">
                                <span className="text-yellow-200 text-sm">Đơn hàng tối thiểu:</span>
                                <span className="text-white font-semibold">{formatCurrency(voucher.don_hang_toi_thieu)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-yellow-200 text-sm">Ngày bắt đầu:</span>
                                <span className="text-white font-semibold">{formatDate(voucher.ngay_bat_dau)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-yellow-200 text-sm">Ngày kết thúc:</span>
                                <span className="text-white font-semibold">{formatDate(voucher.ngay_ket_thuc)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sparkles/Bokeh effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${1 + Math.random() * 2}s`
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-yellow-200 mt-6 relative z-10">
                        Voucher này chỉ có hiệu lực trong thời gian giới hạn. Hãy sử dụng sớm!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoucherPopup; 