'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DefaultLayout from '@/components/admin/Layouts/DefaultLayout';
import Breadcrumb from '@/components/admin/Breadcrumbs/Breadcrumb';
import Link from 'next/link';
import { getApiUrl } from '@/config/api';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmAlert } from '@/utils/sweetAlert';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Calendar, 
    Percent, 
    Gift, 
    Users, 
    Clock,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    User
} from 'lucide-react';

interface Voucher {
    _id: string;
    ma_voucher: string;
    loai: 'public' | 'gift';
    mo_ta: string;
    phan_tram_giam_gia: number;
    giam_toi_da: number;
    don_hang_toi_thieu: number;
    so_luong: number;
    da_su_dung: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    trang_thai: 'active' | 'inactive' | 'expired';
    popup: boolean;
    hien_thi_cong_khai: boolean;
    
    // Fields đặc biệt cho Gift Voucher
    name?: string;
    phone?: string;
    email?: string;
    da_vo_hieu_hoa?: boolean;
    email_da_gui?: boolean;
    qua_duoc_chon?: number;
}

const VouchersPage = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
    const [voucherType, setVoucherType] = useState<'all' | 'public' | 'gift'>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(3);
    const router = useRouter();

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                showWarningAlert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để xem danh sách voucher');
                setError('Bạn cần đăng nhập để xem danh sách voucher');
                setLoading(false);
                return;
            }

            // Fetch tất cả voucher từ collection vouchers duy nhất (sau khi migration)
            const response = await fetch(getApiUrl('vouchers'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    showWarningAlert('Phiên đăng nhập hết hạn', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else if (response.status === 403) {
                    showWarningAlert('Không có quyền', 'Bạn không có quyền truy cập trang này.');
                    setError('Bạn không có quyền truy cập trang này.');
                } else {
                    showErrorAlert('Lỗi', 'Không thể tải danh sách voucher');
                    setError('Không thể tải danh sách voucher');
                }
                setLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                // Sử dụng field loai có sẵn từ database
                setVouchers(data.data);
            } else {
                setError(data.message || 'Không thể tải danh sách voucher');
            }
            
        } catch (err) {
            console.error('Lỗi khi fetch vouchers:', err);
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await showConfirmAlert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa voucher này?', 'Xóa', 'Hủy');
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('admin_token');
                if (!token) {
                    showWarningAlert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để thực hiện thao tác này');
                    return;
                }

                const response = await fetch(getApiUrl(`vouchers/${id}`), {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        showWarningAlert('Phiên đăng nhập hết hạn', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    } else if (response.status === 403) {
                        showWarningAlert('Không có quyền', 'Bạn không có quyền thực hiện thao tác này.');
                    } else {
                        showErrorAlert('Lỗi', 'Lỗi khi xóa voucher');
                    }
                    return;
                }

                const data = await response.json();
                if (data.success) {
                    showSuccessAlert('Thành công', 'Xóa voucher thành công');
                    fetchVouchers();
                } else {
                    showErrorAlert('Thất bại', 'Xóa voucher thất bại: ' + data.message);
                }
            } catch (err) {
                console.error('Lỗi khi xóa voucher:', err);
                showErrorAlert('Lỗi', 'Lỗi khi xóa voucher');
            }
        }
    };

    const handleDisableGiftVoucher = async (id: string) => {
        const result = await showConfirmAlert('Xác nhận vô hiệu hóa', 'Bạn có chắc chắn muốn vô hiệu hóa voucher này?', 'Vô hiệu hóa', 'Hủy');
        if (result.isConfirmed) {
            try {
                await fetch(getApiUrl(`gift-vouchers/${id}/disable`), { method: 'PATCH' });
                fetchVouchers();
            } catch (err) {
                showErrorAlert('Lỗi', 'Vô hiệu hóa voucher thất bại!');
            }
        }
    };

    const resendEmail = async (email: string) => {
        try {
            const response = await fetch(getApiUrl(`gift-vouchers/resend-email/${email}`), {
                method: 'POST',
            });
            const data = await response.json();
            
            if (data.success) {
                showSuccessAlert('Thành công', 'Email đã được gửi lại thành công!');
                fetchVouchers(); // Refresh data
            } else {
                showErrorAlert('Thất bại', 'Gửi email thất bại: ' + data.message);
            }
        } catch (error) {
            showErrorAlert('Lỗi', 'Lỗi khi gửi email');
        }
    };

    const formatCurrency = (num: number | undefined | null) =>
        typeof num === 'number' && !isNaN(num) ? num.toLocaleString('vi-VN') + '₫' : '0₫';
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

    const getStatusIcon = (status: 'active' | 'inactive' | 'expired') => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'inactive':
                return <XCircle className="w-4 h-4 text-yellow-600" />;
            case 'expired':
                return <Clock className="w-4 h-4 text-gray-600" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: 'active' | 'inactive' | 'expired') => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Hoạt động</Badge>;
            case 'inactive':
                return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Ngừng</Badge>;
            case 'expired':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Hết hạn</Badge>;
            default:
                return null;
        }
    };

    const getUsagePercentage = (used: number, total: number) => {
        return Math.round((used / total) * 100);
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 80) return 'text-red-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getVoucherTypeBadge = (type: 'public' | 'gift') => {
        switch (type) {
            // case 'public':
            //     return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Công khai</Badge>;
            // case 'gift':
            //     return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Quà tặng</Badge>;
            default:
                return null;
        }
    };

    const filteredVouchers = vouchers.filter(voucher => {
        const matchesSearch = voucher.ma_voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             voucher.mo_ta.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || voucher.trang_thai === statusFilter;
        const matchesType = voucherType === 'all' || voucher.loai === voucherType;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Reset to page 1 when filters/search change
    useEffect(() => { setPage(1); }, [searchTerm, statusFilter, voucherType]);

    const totalItems = filteredVouchers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (page - 1) * pageSize;
    const paginatedVouchers = filteredVouchers.slice(startIndex, startIndex + pageSize);

    if (loading) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Đang tải danh sách voucher...</p>
                    </div>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Quản lý Voucher" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-2">
                        <Link href="vouchers/add">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white">
                                <Plus className="w-4 h-4 mr-2 text-white" />
                                Thêm Voucher Công Khai
                            </Button>
                        </Link>
                        {/* <Link href="gift-vouchers/add">
                            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white">
                                <Gift className="w-4 h-4 mr-2 text-white" />
                                Thêm Gift Voucher
                            </Button>
                        </Link> */}
                    </div>
                </div>
            </div>

            {/* Voucher Type Tabs */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex gap-3 mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setVoucherType('all')}
                            size="sm"
                            className={voucherType === 'all' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                            }
                        >
                            Tất cả
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setVoucherType('public')}
                            size="sm"
                            className={voucherType === 'public' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                            }
                        >
                            Voucher Công Khai
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setVoucherType('gift')}
                            size="sm"
                            className={voucherType === 'gift' 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
                                : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                            }
                        >
                            Gift Vouchers
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã voucher"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 text-base"
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStatusFilter('all')}
                                size="sm"
                                className={statusFilter === 'all' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
                                }
                            >
                                Tất cả
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setStatusFilter('active')}
                                size="sm"
                                className={statusFilter === 'active' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
                                }
                            >
                                Hoạt động
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setStatusFilter('inactive')}
                                size="sm"
                                className={statusFilter === 'inactive' 
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' 
                                    : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                                }
                            >
                                Ngừng
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setStatusFilter('expired')}
                                size="sm"
                                className={statusFilter === 'expired' 
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' 
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }
                            >
                                Hết hạn
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={pageSize}
                                onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                                className="border rounded-md px-2 py-2 text-sm"
                            >
                                <option value={3}>3</option>
                                <option value={6}>6</option>
                                <option value={9}>9</option>
                                <option value={12}>12</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Vouchers Grid */}
            {filteredVouchers.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có voucher nào</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== 'all' || voucherType !== 'all'
                                ? 'Không tìm thấy voucher phù hợp với bộ lọc'
                                : 'Bắt đầu tạo voucher đầu tiên để thu hút khách hàng'
                            }
                        </p>
                        {!searchTerm && statusFilter === 'all' && voucherType === 'all' && (
                            <div className="flex gap-2 justify-center">
                                <Link href="vouchers/add">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo Voucher Công Khai
                                    </Button>
                                </Link>
                                <Link href="gift-vouchers/add">
                                    <Button variant="outline">
                                        <Gift className="w-4 h-4 mr-2" />
                                        Tạo Gift Voucher
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedVouchers.map((voucher) => (
                        <Card key={voucher._id} className="hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CardTitle className="text-lg font-mono text-blue-600">
                                                {voucher.ma_voucher}
                                            </CardTitle>
                                            {getVoucherTypeBadge(voucher.loai)}
                                        </div>
                                        <CardDescription className="mt-2 line-clamp-2">
                                            {voucher.mo_ta}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(voucher.trang_thai)}
                                        {getStatusBadge(voucher.trang_thai)}
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                                {/* Gift Voucher Specific Info */}
                                {voucher.loai === 'gift' && (
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Gift className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-700">Thông tin người nhận</span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <User className="w-3 h-3 text-purple-600" />
                                                <span className="text-purple-800">{voucher.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Phone className="w-3 h-3 text-purple-600" />
                                                <span className="text-purple-800">{voucher.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Mail className="w-3 h-3 text-purple-600" />
                                                <span className="text-purple-800">{voucher.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Discount Info */}
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Percent className="w-5 h-5 text-blue-600" />
                                        <span className="font-semibold text-blue-900">
                                            Giảm {voucher.phan_tram_giam_gia}%
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Tối đa</p>
                                        <p className="font-semibold text-blue-900">
                                            {formatCurrency(voucher.giam_toi_da)}
                                        </p>
                                    </div>
                                </div>

                                {/* Usage Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Số lượng còn lại:</span>
                                        {(() => {
                                            const isGift = voucher.loai === 'gift';
                                            const total = isGift ? 1 : ((voucher.so_luong ?? 0) + (voucher.da_su_dung ?? 0));
                                            const remaining = isGift ? ((voucher.da_su_dung ? 0 : 1)) : (voucher.so_luong ?? 0);
                                            const usedPercent = isGift
                                                ? (voucher.da_su_dung ? 100 : 0)
                                                : (total > 0 ? Math.round(((voucher.da_su_dung ?? 0) / total) * 100) : 0);
                                            return (
                                                <span className={`font-semibold ${getUsageColor(usedPercent)}`}>
                                                    {remaining} / {total}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {(() => {
                                        const isGift = voucher.loai === 'gift';
                                        const total = isGift ? 1 : ((voucher.so_luong ?? 0) + (voucher.da_su_dung ?? 0));
                                        const usedPercent = isGift
                                            ? (voucher.da_su_dung ? 100 : 0)
                                            : (total > 0 ? Math.round(((voucher.da_su_dung ?? 0) / total) * 100) : 0);
                                        return (
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        usedPercent >= 80 
                                                            ? 'bg-red-500' 
                                                            : usedPercent >= 60 
                                                                ? 'bg-yellow-500' 
                                                                : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${usedPercent}%` }}
                                                ></div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Requirements - Only for public vouchers */}
                                {voucher.loai === 'public' && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <TrendingUp className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">Yêu cầu đơn hàng</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Đơn tối thiểu: <span className="font-semibold">{formatCurrency(voucher.don_hang_toi_thieu)}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Date Range */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Thời gian hiệu lực</span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>Từ: <span className="font-medium">{formatDate(voucher.ngay_bat_dau)}</span></p>
                                        <p>Đến: <span className="font-medium">{formatDate(voucher.ngay_ket_thuc)}</span></p>
                                    </div>
                                </div>

                                {/* Popup Status - Only for public vouchers */}
                                {voucher.loai === 'public' && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Users className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">Hiển thị popup</span>
                                        </div>
                                        <Badge 
                                            className={voucher.popup 
                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                : 'bg-gray-600 text-white border-gray-600'
                                            }
                                        >
                                            {voucher.popup ? 'Có' : 'Không'}
                                        </Badge>
                                    </div>
                                )}

                                {/* Gift Voucher Status */}
                                {voucher.loai === 'gift' && (
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-purple-700">Email đã gửi</span>
                                            <Badge 
                                                className={voucher.email_da_gui 
                                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                                    : 'bg-red-100 text-red-800 border-red-200'
                                                }
                                            >
                                                {voucher.email_da_gui ? 'Đã gửi' : 'Chưa gửi'}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0">
                                <div className="flex w-full space-x-2">
                                    {voucher.loai === 'public' ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => router.push(`/admin/vouchers/edit/${voucher._id}`)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Sửa
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                                onClick={() => handleDelete(voucher._id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Xóa
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {/* <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => router.push(`/admin/gift-vouchers/edit/${voucher._id}`)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Sửa
                                            </Button> */}
                                            {!voucher.email_da_gui && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                                    onClick={() => resendEmail(voucher.email!)}
                                                >
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Gửi Email
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                                                onClick={() => handleDisableGiftVoucher(voucher._id)}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Vô hiệu
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Results Summary */}
            {filteredVouchers.length > 0 && (
                <div className="mt-8 flex flex-col items-center gap-3">
                    {/* <div className="text-sm text-gray-500">
                        Hiển thị {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} / {totalItems} voucher
                        {searchTerm && ` cho "${searchTerm}"`}
                        {statusFilter !== 'all' && ` với trạng thái "${statusFilter}"`}
                        {voucherType !== 'all' && ` loại "${voucherType === 'public' ? 'Công khai' : 'Gift'}"`}
                    </div> */}
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >«</button>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >Trước</button>
                        <span className="text-sm text-gray-700 px-2">Trang {page} / {totalPages}</span>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >Sau</button>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >»</button>
                    </div>
                </div>
            )}
        </DefaultLayout>
    );
};

export default VouchersPage; 