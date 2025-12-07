import { getApiUrl } from '@/config/api';

export interface MomoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
}

export interface MomoPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    payUrl: string;
    orderId: string;
    requestId: string;
    amount: number;
  };
  error?: any;
}

export interface MomoPaymentStatus {
  success: boolean;
  data?: {
    orderId: string;
    paymentStatus: string;
    orderStatus: string;
    amount: number;
  };
  message?: string;
}

export interface MomoWalletDepositRequest {
  userId: string;
  amount: number;
  orderInfo?: string;
}

export interface MomoWalletDepositResponse {
  success: boolean;
  message: string;
  data?: {
    payUrl: string;
    orderId: string;
    requestId: string;
    amount: number;
    type: string;
  };
  error?: any;
}

class MomoService {
  // Tạo yêu cầu thanh toán MOMO
  async createPayment(request: MomoPaymentRequest): Promise<MomoPaymentResponse> {
    try {
      const response = await fetch(getApiUrl('momo/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      return data;
    } catch (error) {

      return {
        success: false,
        message: 'Đã có lỗi xảy ra khi tạo yêu cầu thanh toán MOMO',
        error: error,
      };
    }
  }

  // Kiểm tra trạng thái thanh toán
  async checkPaymentStatus(orderId: string): Promise<MomoPaymentStatus> {
    try {
      const response = await fetch(getApiUrl(`momo/status/${orderId}`));
      const data = await response.json();
      return data;
    } catch (error) {

      return {
        success: false,
        message: 'Đã có lỗi xảy ra khi kiểm tra trạng thái thanh toán',
      };
    }
  }

  // Mở trang thanh toán MOMO
  openMomoPayment(payUrl: string): void {
    if (payUrl) {
      window.open(payUrl, '_blank');
    }
  }

  // Tạo yêu cầu nạp tiền vào ví bằng MOMO
  async createWalletDeposit(request: MomoWalletDepositRequest): Promise<MomoWalletDepositResponse> {
    try {
      const response = await fetch(getApiUrl('momo/wallet-deposit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating MOMO wallet deposit:', error);
      return {
        success: false,
        message: 'Đã có lỗi xảy ra khi tạo yêu cầu nạp tiền vào ví bằng MOMO',
        error: error,
      };
    }
  }
}

export const momoService = new MomoService(); 