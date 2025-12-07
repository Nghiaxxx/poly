'use client';

import React, { useState } from 'react';
import BankTransactionManager from '@/components/client/BankTransactionManager';
import { useBankTransaction } from '@/hooks/useBankTransaction';

const BankTransactionsPage = () => {
  const [expectedKeywords, setExpectedKeywords] = useState<string[]>([
    'napavatar', 'shoptao', 'thanhtoan', 'nguyen trong thuong'
  ]);
  const [orderMapping, setOrderMapping] = useState<{ [key: string]: string }>({
    '10000': 'order_123',
    '20000': 'order_456',
    '50000': 'order_789'
  });

  const { autoProcessNewTransactions, loading, error, success } = useBankTransaction();

  const handleAutoProcess = async () => {
    await autoProcessNewTransactions(expectedKeywords, orderMapping);
  };

  const addKeyword = () => {
    const newKeyword = prompt('Nhập từ khóa mới:');
    if (newKeyword && !expectedKeywords.includes(newKeyword)) {
      setExpectedKeywords([...expectedKeywords, newKeyword]);
    }
  };

  const removeKeyword = (keyword: string) => {
    setExpectedKeywords(expectedKeywords.filter(k => k !== keyword));
  };

  const addOrderMapping = () => {
    const amount = prompt('Nhập số tiền:');
    const orderId = prompt('Nhập ID đơn hàng:');
    if (amount && orderId) {
      setOrderMapping({ ...orderMapping, [amount]: orderId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hệ thống Thanh toán Tự động
          </h1>
          <p className="text-gray-600">
            Quản lý và tự động xử lý giao dịch ngân hàng dựa trên nội dung mô tả
          </p>
        </div>

        {/* Cấu hình */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Cấu hình Hệ thống</h2>
          
          {/* Từ khóa mong đợi */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Từ khóa mong đợi trong description:</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {expectedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={addKeyword}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Thêm từ khóa
            </button>
          </div>

          {/* Mapping đơn hàng */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Mapping số tiền - ID đơn hàng:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {Object.entries(orderMapping).map(([amount, orderId]) => (
                <div
                  key={amount}
                  className="bg-green-100 p-3 rounded-lg flex justify-between items-center"
                >
                  <span className="text-green-800">
                    {parseInt(amount).toLocaleString('vi-VN')} VND → {orderId}
                  </span>
                  <button
                    onClick={() => {
                      const newMapping = { ...orderMapping };
                      delete newMapping[amount];
                      setOrderMapping(newMapping);
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOrderMapping}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Thêm mapping
            </button>
          </div>

          {/* Nút xử lý tự động */}
          <div className="border-t pt-4">
            <button
              onClick={handleAutoProcess}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : '🚀 Xử lý Tự động Tất cả Giao dịch'}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Tự động fetch giao dịch mới, kiểm tra description và cập nhật trạng thái
            </p>
          </div>

          {/* Thông báo */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{success}</p>
            </div>
          )}
        </div>

        {/* Component quản lý giao dịch */}
        <BankTransactionManager
          expectedKeywords={expectedKeywords}
          orderMapping={orderMapping}
        />

        {/* Hướng dẫn sử dụng */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Hướng dẫn sử dụng</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900">1. Cấu hình từ khóa:</h3>
              <p>Thêm các từ khóa mà bạn mong đợi xuất hiện trong description của giao dịch hợp lệ.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">2. Mapping đơn hàng:</h3>
              <p>Liên kết số tiền giao dịch với ID đơn hàng để tự động match.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">3. Xử lý tự động:</h3>
              <p>Hệ thống sẽ tự động kiểm tra description và chuyển trạng thái thành công nếu có từ khóa phù hợp.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">4. Ví dụ giao dịch hợp lệ:</h3>
              <p className="bg-gray-100 p-3 rounded font-mono text-sm">
                "REM Tfr Ac:1770260769 O@L_080005_211601_0_0_202419501_92905827637 0785776411 NAPAVATAR 2300"
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Giao dịch này sẽ được xác nhận vì có chứa từ khóa "napavatar"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransactionsPage; 