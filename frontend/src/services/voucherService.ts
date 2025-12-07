import { getApiUrl } from '@/config/api';

export interface VoucherPopupData {
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
    popup: boolean;
}

export const getPopupVoucher = async (): Promise<VoucherPopupData | null> => {
    try {
        const response = await fetch(getApiUrl('vouchers/popup'));
        const data = await response.json();
        
        if (data.success && data.data) {
            return data.data;
        }
        return null;
    } catch (error) {

        return null;
    }
}; 