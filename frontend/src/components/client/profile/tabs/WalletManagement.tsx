import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import walletService, { WalletJournal } from '@/services/walletService';
import { momoService } from '@/services/momoService';
import config from '@/config/api';

const WalletManagement: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WalletJournal[]>([]);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<string>('');

  useEffect(() => {
    if (user?._id) {
      loadWalletData();
    }
  }, [user?._id]);

  // Xử lý redirect từ MoMo
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const amount = urlParams.get('amount');
    const newBalance = urlParams.get('newBalance');
    const errorMessage = urlParams.get('message');

    if (status === 'success' && amount) {
      setMessage({ 
        type: 'success', 
        text: `Nạp tiền thành công: ${parseInt(amount).toLocaleString('vi-VN')} VND. Số dư mới: ${parseInt(newBalance || '0').toLocaleString('vi-VN')} VND` 
      });
      
      // Reload wallet data
      loadWalletData();
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error' && errorMessage) {
      setMessage({ 
        type: 'error', 
        text: `Nạp tiền thất bại: ${decodeURIComponent(errorMessage)}` 
      });
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadWalletData = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const [balanceRes, historyRes] = await Promise.all([
        walletService.getBalance(user._id),
        walletService.getHistory(user._id, 20)
      ]);

      if (balanceRes.success) {
        setBalance(balanceRes.data.balance);
        console.log('Wallet balance loaded:', balanceRes.data);
      }

      if (historyRes.success) {
        setHistory(historyRes.data);
        console.log('Wallet history loaded:', historyRes.data);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setMessage({ type: 'error', text: 'Không thể tải thông tin ví' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !depositAmount || parseFloat(depositAmount) <= 0) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số tiền hợp lệ' });
      return;
    }

    try {
      setDepositLoading(true);
      const amount = parseFloat(depositAmount);
      
      console.log('Attempting MOMO wallet deposit:', { userId: user._id, amount });
      
      const response = await momoService.createWalletDeposit({
        userId: user._id,
        amount,
        orderInfo: `Nạp tiền vào ví PolyPay - ${amount.toLocaleString('vi-VN')} VND`
      });

      console.log('MOMO wallet deposit response:', response);

      if (response.success && response.data?.payUrl) {
        setMessage({ type: 'success', text: `Chuyển hướng thanh toán MOMO để nạp ${amount.toLocaleString('vi-VN')} VND vào ví...` });
        setDepositAmount('');
        setShowDepositForm(false);
        
        // Mở trang thanh toán MOMO
        setTimeout(() => {
          const payUrl = response.data?.payUrl;
          if (payUrl) {
            momoService.openMomoPayment(payUrl);
          }
        }, 1500);
        
        // Reload data sau khi nạp tiền
        setTimeout(() => {
          loadWalletData();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Nạp tiền bằng MOMO thất bại' });
      }
    } catch (error: any) {
      console.error('Error with MOMO wallet deposit:', error);
      setMessage({ type: 'error', text: `Có lỗi xảy ra khi nạp tiền bằng MOMO: ${error?.message || 'Unknown error'}` });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    setDepositAmount(amount);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return (
          <img 
            src="/images/Logo-MoMo-Circle.webp" 
            alt="MOMO" 
            className="w-8 h-8 rounded-full"
          />
        );
      case 'payment':
        return (
          <img 
            src="/images/polypay.png" 
            alt="PolyPay" 
            className="w-8 h-8 rounded-full"
          />
        );
      case 'refund':
        return (
          <img 
            src="/images/polypay.png" 
            alt="PolyPay" 
            className="w-8 h-8 rounded-full"
          />
        );
      case 'adjustment':
        return (
          <img 
            src="/images/polypay.png" 
            alt="PolyPay" 
            className="w-8 h-8 rounded-full"
          />
        );
      default:
        return (
          <img 
            src="/images/polypay.png" 
            alt="PolyPay" 
            className="w-8 h-8 rounded-full"
          />
        );
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'payment':
        return 'text-red-600';
      case 'refund':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionAmount = (transaction: WalletJournal) => {
    // Sử dụng So_tien từ model backend
    return transaction.So_tien;
  };

  const getTransactionDate = (transaction: WalletJournal) => {
    // Sử dụng date từ model backend
    return transaction.date;
  };

  if (!user?._id) {
    return (
      <div className="text-center py-8 text-gray-500">
        Vui lòng đăng nhập để quản lý ví tiền
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Ví PolyPay</h2>
        <p className="text-blue-100">Quản lý tài khoản và giao dịch của bạn</p>
      </div>

      {/* Balance Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Số dư hiện tại</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDepositForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Nạp tiền
            </button>
          </div>
        </div>
        
        <div className="text-3xl font-bold text-blue-600 mb-4">
          {loading ? '...' : formatAmount(balance)}
        </div>
      </div>

      {/* Form nạp tiền */}
      {showDepositForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Nạp tiền vào ví</h3>
            
            {/* Nhập số tiền */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập số tiền (₫)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="₫0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                min="1000"
                step="1000"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Số dư Ví hiện tại: {formatAmount(balance)}
              </p>
            </div>

            {/* Số tiền có sẵn */}
            <div className="mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAmountSelect('100000')}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    selectedAmount === '100000' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  100.000
                </button>
                <button
                  type="button"
                  onClick={() => handleAmountSelect('200000')}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    selectedAmount === '200000' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  200.000
                </button>
                <button
                  type="button"
                  onClick={() => handleAmountSelect('500000')}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    selectedAmount === '500000' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  500.000
                </button>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán
              </label>
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="/images/Logo-MoMo-Circle.webp" 
                      alt="MOMO" 
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium">MOMO</span>
                  </div>
                  <span className="text-sm text-gray-500">Đã chọn</span>
                </div>
              </div>
            </div>

            {/* Thông tin thanh toán */}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                <span>Nạp tiền:</span>
                <span className="font-medium">{depositAmount ? `₫${parseInt(depositAmount).toLocaleString('vi-VN')}` : '₫0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Tổng thanh toán:</span>
                <span className="font-medium text-red-600">{depositAmount ? `₫${parseInt(depositAmount).toLocaleString('vi-VN')}` : '₫0'}</span>
              </div>
            </div>

            {/* Thông báo */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700">
                  Nhấn "Nạp tiền ngay", bạn đã đồng ý tuân theo{' '}
                  <a href="#" className="underline font-medium">Điều khoản sử dụng</a> và{' '}
                  <a href="#" className="underline font-medium">Chính sách bảo mật</a> của PolyPay
                </p>
              </div>
            </div>

            {/* Nút nạp tiền */}
            <form onSubmit={handleDeposit}>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {depositLoading ? 'Đang xử lý...' : 'Nạp tiền ngay'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositForm(false);
                    setDepositAmount('');
                    setSelectedAmount('');
                  }}
                  className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch sử giao dịch</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Đang tải...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có giao dịch nào
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'deposit' ? 'Nạp tiền' : 
                       transaction.type === 'payment' ? 'Thanh toán' :
                       transaction.type === 'refund' ? 'Hoàn tiền' : 'Điều chỉnh'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(getTransactionDate(transaction))}
                    </p>
                    
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {getTransactionAmount(transaction) > 0 ? '+' : ''}{formatAmount(getTransactionAmount(transaction))}
                  </p>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagement;