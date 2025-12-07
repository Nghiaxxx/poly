import config from '../config/api';

export interface BankTransaction {
  _id: string;
  transactionID: string;
  amount: number;
  description: string;
  transactionDate: string;
  type: 'IN' | 'OUT';
  accountNumber: string;
  bankCode: string;
  status: 'pending' | 'completed' | 'failed';
  orderId?: string;
  userId?: string;
  matchedOrder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  success: boolean;
  data: {
    transactions: BankTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface AutoMatchResponse {
  success: boolean;
  message: string;
  data: {
    matchedCount: number;
    results: Array<{
      transactionId: string;
      orderId: string;
      amount: number;
      userId: string;
    }>;
  };
}

class BankTransactionService {
  private baseUrl = `${config.API_URL}/bank-transactions`;

  // Lấy danh sách giao dịch
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    accountNumber?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${queryParams}`);
    return response.json();
  }

  // Fetch giao dịch từ API ngân hàng
  async fetchBankTransactions(data: {
    bankCode: string;
    accountNumber: string;
    token: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Tự động match giao dịch
  async autoMatchTransactions(): Promise<AutoMatchResponse> {
    const response = await fetch(`${this.baseUrl}/auto-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  // Match thủ công giao dịch
  async manualMatchTransaction(data: {
    transactionId: string;
    orderId: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/manual-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Cập nhật trạng thái giao dịch
  async updateTransactionStatus(
    transactionId: string,
    data: { status: string; note?: string }
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${transactionId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Lấy thống kê giao dịch
  async getTransactionStats(params: {
    accountNumber: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/stats?${queryParams}`);
    return response.json();
  }

  // Kiểm tra giao dịch theo description và orderId
  async checkTransactionByDescription(data: {
    orderId: string;
    amount?: number;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/check-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Kiểm tra description và tự động chuyển trạng thái
  async checkDescriptionAndUpdateStatus(
    transactionId: string,
    expectedKeywords: string[],
    orderId?: string
  ): Promise<any> {
    try {
      // Lấy thông tin giao dịch
      const response = await fetch(`${this.baseUrl}/${transactionId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error('Không thể lấy thông tin giao dịch');
      }

      const transaction = result.data;
      const description = transaction.description.toLowerCase();

      // Kiểm tra xem description có chứa từ khóa mong đợi không
      const hasExpectedContent = expectedKeywords.some(keyword =>
        description.includes(keyword.toLowerCase())
      );

      if (hasExpectedContent) {
        // Nếu có nội dung đúng, cập nhật trạng thái thành công
        const updateData: any = {
          status: 'completed',
          note: 'Tự động xác nhận dựa trên nội dung giao dịch'
        };

        // Nếu có orderId, thực hiện match
        if (orderId) {
          const matchResult = await this.manualMatchTransaction({
            transactionId,
            orderId
          });
          
          if (matchResult.success) {
    
          }
        }

        // Cập nhật trạng thái
        const updateResult = await this.updateTransactionStatus(
          transactionId,
          updateData
        );

        return {
          success: true,
          message: 'Đã tự động xác nhận giao dịch dựa trên nội dung',
          data: updateResult
        };
      } else {
        return {
          success: false,
          message: 'Nội dung giao dịch không khớp với từ khóa mong đợi',
          data: null
        };
      }
    } catch (error) {
      
      throw error;
    }
  }

  // Kiểm tra và xử lý tất cả giao dịch pending
  async processAllPendingTransactions(
    expectedKeywords: string[],
    orderMapping?: { [key: string]: string } // Map amount -> orderId
  ): Promise<any> {
    try {
      // Lấy tất cả giao dịch pending
      const transactionsResponse = await this.getTransactions({
        status: 'pending',
        limit: 100
      });

      if (!transactionsResponse.success) {
        throw new Error('Không thể lấy danh sách giao dịch');
      }

      const transactions = transactionsResponse.data.transactions;
      const results = [];

      for (const transaction of transactions) {
        try {
          const orderId = orderMapping?.[transaction.amount.toString()];
          
          const result = await this.checkDescriptionAndUpdateStatus(
            transaction._id,
            expectedKeywords,
            orderId
          );

          results.push({
            transactionId: transaction.transactionID,
            success: result.success,
            message: result.message
          });

          // Delay nhỏ để tránh spam API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          results.push({
            transactionId: transaction.transactionID,
            success: false,
            message: errorMessage
          });
        }
      }

      return {
        success: true,
        message: `Đã xử lý ${transactions.length} giao dịch`,
        data: results
      };
    } catch (error: any) {
      
      throw error;
    }
  }
}

export const bankTransactionService = new BankTransactionService(); 