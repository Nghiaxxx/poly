import { useState, useCallback } from 'react';
import { bankTransactionService, BankTransaction } from '../services/bankTransactionService';

export const useBankTransaction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Kiểm tra description có chứa từ khóa mong đợi
  const checkDescriptionContent = useCallback((description: string, keywords: string[]): boolean => {
    const lowerDescription = description.toLowerCase();
    return keywords.some(keyword => lowerDescription.includes(keyword.toLowerCase()));
  }, []);

  // Xử lý giao dịch dựa trên description
  const processTransactionByDescription = useCallback(async (
    transaction: BankTransaction,
    expectedKeywords: string[],
    orderId?: string
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Kiểm tra description
      const hasValidContent = checkDescriptionContent(transaction.description, expectedKeywords);

      if (hasValidContent) {
        // Nếu description hợp lệ, cập nhật trạng thái thành công
        const result = await bankTransactionService.checkDescriptionAndUpdateStatus(
          transaction._id,
          expectedKeywords,
          orderId
        );

        if (result.success) {
          setSuccess(`✅ Giao dịch ${transaction.transactionID} đã được xác nhận tự động`);
          return {
            success: true,
            message: 'Giao dịch hợp lệ và đã được xác nhận',
            transaction: transaction
          };
        } else {
          setError(`❌ Lỗi khi cập nhật giao dịch: ${result.message}`);
          return {
            success: false,
            message: result.message
          };
        }
      } else {
        setError(`❌ Giao dịch ${transaction.transactionID}: Nội dung không khớp với từ khóa mong đợi`);
        return {
          success: false,
          message: 'Nội dung giao dịch không hợp lệ'
        };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(`❌ Lỗi xử lý giao dịch: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [checkDescriptionContent]);

  // Xử lý hàng loạt giao dịch
  const processBatchTransactions = useCallback(async (
    transactions: BankTransaction[],
    expectedKeywords: string[],
    orderMapping?: { [key: string]: string }
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const transaction of transactions) {
      try {
        const orderId = orderMapping?.[transaction.amount.toString()];
        
        const result = await processTransactionByDescription(
          transaction,
          expectedKeywords,
          orderId
        );

        results.push({
          transactionId: transaction.transactionID,
          success: result.success,
          message: result.message
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Delay nhỏ để tránh spam API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err: any) {
        results.push({
          transactionId: transaction.transactionID,
          success: false,
          message: err.message
        });
        errorCount++;
      }
    }

    setLoading(false);
    
    if (successCount > 0) {
      setSuccess(`✅ Đã xử lý thành công ${successCount}/${transactions.length} giao dịch`);
    }
    
    if (errorCount > 0) {
      setError(`❌ Có ${errorCount} giao dịch gặp lỗi`);
    }

    return {
      results,
      successCount,
      errorCount,
      totalCount: transactions.length
    };
  }, [processTransactionByDescription]);

  // Tự động xử lý giao dịch mới
  const autoProcessNewTransactions = useCallback(async (
    expectedKeywords: string[],
    orderMapping?: { [key: string]: string }
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Fetch giao dịch mới từ API ngân hàng
      const fetchResult = await bankTransactionService.fetchBankTransactions({
        bankCode: 'Mk123456@',
        accountNumber: '8824882445',
        token: 'F33A14C5-1467-0CFD-7BF1-BF13780A420C'
      });

      if (!fetchResult.success) {
        throw new Error(fetchResult.message);
      }

      // 2. Lấy danh sách giao dịch pending
      const transactionsResponse = await bankTransactionService.getTransactions({
        status: 'pending',
        limit: 100
      });

      if (!transactionsResponse.success) {
        throw new Error('Không thể lấy danh sách giao dịch');
      }

      const pendingTransactions = transactionsResponse.data.transactions;

      if (pendingTransactions.length === 0) {
        setSuccess('✅ Không có giao dịch nào cần xử lý');
        return { success: true, message: 'Không có giao dịch nào cần xử lý' };
      }

      // 3. Xử lý từng giao dịch
      const batchResult = await processBatchTransactions(
        pendingTransactions,
        expectedKeywords,
        orderMapping
      );

      return {
        success: true,
        message: `Đã xử lý ${batchResult.successCount}/${batchResult.totalCount} giao dịch`,
        data: batchResult
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(`❌ Lỗi: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [processBatchTransactions]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    checkDescriptionContent,
    processTransactionByDescription,
    processBatchTransactions,
    autoProcessNewTransactions,
    clearMessages
  };
}; 