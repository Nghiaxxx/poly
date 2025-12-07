import config from '../config/api';

export interface VirtualWallet {
  _id: string;
  Id_nguoi_dung: string;
  So_tien: number;
}

export interface NapTien {
  _id: string;
  Id_vi: string;
  So_tien: number;
  Ngay_nap_tien: string;
}

export interface HoanTien {
  _id: string;
  Id_vi: string;
  So_tien: number;
  Ngay_hoan_tien: string;
}

export interface WalletJournal {
  _id: string;
  Id_vi: string;
  So_tien: number;
  Ngay_nap_tien?: string;
  Ngay_hoan_tien?: string;
  type: 'deposit' | 'payment' | 'refund' | 'adjustment';
  date: string;
  table: 'Nap_tien' | 'Hoan_tien';
}

export interface WalletBalanceResponse {
  success: boolean;
  data: {
    balance: number;
    walletId: string;
  };
  message?: string;
}

export interface WalletHistoryResponse {
  success: boolean;
  data: WalletJournal[];
  message?: string;
}

export interface WalletDepositRequest {
  userId: string;
  amount: number;
  idempotencyKey?: string;
  metadata?: any;
}

export interface WalletPayRequest {
  userId: string;
  amount: number;
  referenceId?: string;
  idempotencyKey?: string;
  metadata?: any;
}

export interface WalletPayOrderRequest {
  userId: string;
  orderId: string;
  amount: number;
  idempotencyKey?: string;
}

class WalletService {
  private baseUrl = `${config.API_URL}/wallet`;

  async getBalance(userId: string): Promise<WalletBalanceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/balance?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  async deposit(data: WalletDepositRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error depositing to wallet:', error);
      throw error;
    }
  }

  async pay(data: WalletPayRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error paying with wallet:', error);
      throw error;
    }
  }

  async getHistory(userId: string, limit: number = 20): Promise<WalletHistoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/history?userId=${userId}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting wallet history:', error);
      throw error;
    }
  }

  async payOrder(data: WalletPayOrderRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/pay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error paying order with wallet:', error);
      throw error;
    }
  }
}

export default new WalletService(); 