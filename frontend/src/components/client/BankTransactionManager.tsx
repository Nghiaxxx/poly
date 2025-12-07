'use client';

import React, { useState, useEffect } from 'react';
import { bankTransactionService, BankTransaction } from '@/services/bankTransactionService';

interface BankTransactionManagerProps {
  expectedKeywords?: string[];
  orderMapping?: { [key: string]: string };
}

const BankTransactionManager: React.FC<BankTransactionManagerProps> = ({
  expectedKeywords = ['napavatar', 'shoptao', 'thanhtoan'],
  orderMapping = {}
}) => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Lấy danh sách giao dịch
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await bankTransactionService.getTransactions({
        status: 'pending',
        limit: 50
      });
      
      if (response.success) {
        setTransactions(response.data.transactions);
      } else {
        setMessage('Lỗi khi lấy danh sách giao dịch');
      }
    } catch (error: any) {
      setMessage(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thống kê
  const fetchStats = async () => {
    try {
      const response = await bankTransactionService.getTransactionStats({
        accountNumber: '8824882445' // Thay bằng số tài khoản thực tế
      });
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      
    }
  };

  // Kiểm tra description và cập nhật trạng thái
  const checkDescriptionAndUpdate = async (transaction: BankTransaction) => {
    try {
      const orderId = orderMapping[transaction.amount.toString()];
      
      const result = await bankTransactionService.checkDescriptionAndUpdateStatus(
        transaction._id,
        expectedKeywords,
        orderId
      );

      if (result.success) {
        setMessage(`✅ ${transaction.transactionID}: ${result.message}`);
        // Refresh danh sách
        await fetchTransactions();
      } else {
        setMessage(`❌ ${transaction.transactionID}: ${result.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Lỗi xử lý ${transaction.transactionID}: ${error.message}`);
    }
  };

  // Xử lý tất cả giao dịch pending
  const processAllPending = async () => {
    setProcessing(true);
    try {
      const result = await bankTransactionService.processAllPendingTransactions(
        expectedKeywords,
        orderMapping
      );

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        // Refresh danh sách
        await fetchTransactions();
        await fetchStats();
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Tự động match giao dịch
  const autoMatch = async () => {
    setProcessing(true);
    try {
      const result = await bankTransactionService.autoMatchTransactions();
      
      if (result.success) {
        setMessage(`✅ Đã match ${result.data.matchedCount} giao dịch`);
        await fetchTransactions();
        await fetchStats();
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Fetch giao dịch từ API ngân hàng
  const fetchBankTransactions = async () => {
    setProcessing(true);
    try {
      const result = await bankTransactionService.fetchBankTransactions({
        bankCode: 'Mk123456@',
        accountNumber: '8824882445',
        token: 'F33A14C5-1467-0CFD-7BF1-BF13780A420C'
      });

      if (result.success) {
        setMessage(`✅ Đã fetch ${result.data.newTransactions} giao dịch mới`);
        await fetchTransactions();
        await fetchStats();
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Quản lý Giao dịch Ngân hàng
        </h1>

        {/* Thống kê */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Tổng giao dịch</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Đang chờ</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Đã hoàn thành</h3>
              <p className="text-2xl font-bold text-green-600">{stats.completedCount}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Đã match</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.matchedCount}</p>
            </div>
          </div>
        )}

        {/* Các nút hành động */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={fetchBankTransactions}
            disabled={processing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {processing ? 'Đang xử lý...' : 'Fetch Giao dịch Mới'}
          </button>

          <button
            onClick={autoMatch}
            disabled={processing}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {processing ? 'Đang xử lý...' : 'Auto Match'}
          </button>

          <button
            onClick={processAllPending}
            disabled={processing}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {processing ? 'Đang xử lý...' : 'Kiểm tra Description'}
          </button>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        {/* Thông báo */}
        {message && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* Danh sách giao dịch */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Giao dịch
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {transaction.transactionID}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {transaction.amount.toLocaleString('vi-VN')} VND
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'completed' ? 'Hoàn thành' :
                       transaction.status === 'failed' ? 'Thất bại' : 'Đang chờ'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {transaction.status === 'pending' && (
                      <button
                        onClick={() => checkDescriptionAndUpdate(transaction)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Kiểm tra
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            Không có giao dịch nào đang chờ xử lý
          </div>
        )}
      </div>
    </div>
  );
};

export default BankTransactionManager; 