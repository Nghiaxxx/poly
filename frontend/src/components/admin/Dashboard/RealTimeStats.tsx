"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/api';

interface RealTimeStats {
  today: {
    revenue: number;
    orderCount: number;
    productCount: number;
  };
  yesterday: {
    revenue: number;
    orderCount: number;
    productCount: number;
  };
  growthRates: {
    revenue: string;
    orders: string;
    products: string;
  };
  pendingOrders: number;
  recentOrders: Array<{
    _id: string;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
    customerInfo: {
      fullName: string;
      email: string;
    };
  }>;
}

const RealTimeStats: React.FC = () => {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchRealTimeStats = async () => {
    if (!token) {
      
      return;
    }
    
    setLoading(true);
    try {
      
      const response = await fetch(getApiUrl('admin/statistics/realtime'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      
      
      if (response.ok) {
        const data = await response.json();

        setStats(data);
      } else {
        const errorData = await response.json();
        
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRealTimeStats, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const getGrowthIcon = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate > 0) {
      return (
        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      );
    } else if (numRate < 0) {
      return (
        <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
        </svg>
      </div>
    );
  };

  const getGrowthColor = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate > 0) return 'text-green-600 bg-green-50';
    if (numRate < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-700 bg-green-100 border-green-200';
      case 'shipping': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'packing': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'confirming': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'cancelled': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Đã giao';
      case 'shipping': return 'Đang giao';
      case 'packing': return 'Đang đóng gói';
      case 'confirming': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Thống kê hôm nay
            </h3>
            <p className="text-indigo-100 text-sm">Dữ liệu cập nhật thời gian thực</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">
              {stats.today.revenue.toLocaleString('vi-VN')}
            </div>
            <div className="text-sm text-blue-600 font-medium">Triệu VNĐ</div>
            <div className="flex items-center justify-center mt-2">
              {getGrowthIcon(stats.growthRates.revenue)}
              <span className={`text-xs font-semibold ml-2 px-2 py-1 rounded-full ${getGrowthColor(stats.growthRates.revenue)}`}>
                {parseFloat(stats.growthRates.revenue) > 0 ? '+' : ''}{stats.growthRates.revenue}%
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-2xl font-bold text-green-900">
              {stats.today.orderCount}
            </div>
            <div className="text-sm text-green-600 font-medium">Đơn hàng</div>
            <div className="flex items-center justify-center mt-2">
              {getGrowthIcon(stats.growthRates.orders)}
              <span className={`text-xs font-semibold ml-2 px-2 py-1 rounded-full ${getGrowthColor(stats.growthRates.orders)}`}>
                {parseFloat(stats.growthRates.orders) > 0 ? '+' : ''}{stats.growthRates.orders}%
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-900">
              {stats.today.productCount}
            </div>
            <div className="text-sm text-purple-600 font-medium">Sản phẩm</div>
            <div className="flex items-center justify-center mt-2">
              {getGrowthIcon(stats.growthRates.products)}
              <span className={`text-xs font-semibold ml-2 px-2 py-1 rounded-full ${getGrowthColor(stats.growthRates.products)}`}>
                {parseFloat(stats.growthRates.products) > 0 ? '+' : ''}{stats.growthRates.products}%
              </span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 mb-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-semibold text-orange-900">Đơn hàng chờ xử lý</h4>
                <p className="text-sm text-orange-600">Cần xác nhận ngay</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                {stats.pendingOrders}
              </div>
              <div className="text-sm text-orange-500">đơn hàng</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Đơn hàng gần đây
          </h4>
          <div className="space-y-3">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {order.customerInfo?.fullName || 'Khách hàng'}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">
                    {order.totalAmount.toLocaleString('vi-VN')} ₫
                  </div>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                    {getStatusText(order.orderStatus)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStats; 