"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/api';

interface StatisticsSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalProducts: number;
  period: string;
  growthRates: {
    orders: string;
    revenue: string;
    products: string;
  };
}

interface OverallStats {
  totalUsers: number;
  totalAllOrders: number;
  totalProductsInDb: number;
  viewCount: string;
  growthRates: {
    users: string;
    orders: string;
    products: string;
    views: string;
  };
}

const StatisticsCards: React.FC = () => {
  const [stats, setStats] = useState<StatisticsSummary>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
    period: 'Tuần này',
    growthRates: {
      orders: '0',
      revenue: '0',
      products: '0'
    }
  });
  
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalUsers: 0,
    totalAllOrders: 0,
    totalProductsInDb: 0,
    viewCount: "0",
    growthRates: {
      users: "0",
      orders: "0",
      products: "0",
      views: "0"
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const { token } = useAuth();

  const periodOptions = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' }
  ];

  const fetchStatistics = async (period: string = selectedPeriod) => {
    if (!token) {
      console.log('No token available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching statistics with token:', token.substring(0, 20) + '...');
      const response = await fetch(getApiUrl(`admin/statistics?period=${period}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Statistics data:', data);
        setStats(data.summary);
        setOverallStats(data.overall);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [token]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    fetchStatistics(period);
  };

  const getGrowthIcon = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate > 0) return true; // levelUp
    if (numRate < 0) return false; // levelDown
    return true; // default to levelUp
  };

  const getGrowthRate = (rate: string) => {
    const numRate = parseFloat(rate);
    return `${numRate > 0 ? '+' : ''}${rate}%`;
  };

  const cards = [
    {
      title: 'Đơn hàng hoàn thành',
      value: stats.totalOrders,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      suffix: 'đơn hàng',
      period: stats.period
    },
    {
      title: 'Doanh thu thực tế',
      value: stats.totalRevenue,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      ),
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      suffix: 'triệu VNĐ',
      period: stats.period
    },
    {
      title: 'Lợi nhuận ước tính',
      value: stats.totalProfit,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      suffix: 'triệu VNĐ',
      period: stats.period
    },
    {
      title: 'Sản phẩm đã bán',
      value: stats.totalProducts,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      suffix: 'sản phẩm',
      period: stats.period
    },
    {
      title: 'Tổng lượt xem',
      value: overallStats.viewCount,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      ),
      color: 'text-cyan-600',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      borderColor: 'border-cyan-200',
      suffix: 'xem',
      period: 'Tổng quan',
      growthRate: getGrowthRate(overallStats.growthRates.views),
      levelUp: getGrowthIcon(overallStats.growthRates.views)
    },
    {
      title: 'Tổng sản phẩm',
      value: overallStats.totalProductsInDb,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      ),
      color: 'text-sky-600',
      bgColor: 'bg-gradient-to-br from-sky-50 to-sky-100',
      borderColor: 'border-sky-200',
      suffix: '',
      period: 'Tổng quan',
      growthRate: getGrowthRate(overallStats.growthRates.products),
      levelUp: getGrowthIcon(overallStats.growthRates.products)
    },
    {
      title: 'Tổng người dùng',
      value: overallStats.totalUsers,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      suffix: '',
      period: 'Tổng quan',
      growthRate: getGrowthRate(overallStats.growthRates.users),
      levelUp: getGrowthIcon(overallStats.growthRates.users)
    },
    {
      title: 'Tổng đơn hàng',
      value: overallStats.totalAllOrders,
      icon: (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      suffix: '',
      period: 'Tổng quan',
      growthRate: getGrowthRate(overallStats.growthRates.orders),
      levelUp: getGrowthIcon(overallStats.growthRates.orders)
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="bg-white dark:bg-boxdark rounded-lg shadow-lg p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="w-20 h-8 bg-gray-300 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[5, 6, 7, 8].map((index) => (
            <div key={index} className="bg-white dark:bg-boxdark rounded-lg shadow-lg p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="w-20 h-8 bg-gray-300 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCard = (card: any, index: number) => (
    <div key={index} className={`relative overflow-hidden rounded-2xl border ${card.borderColor} ${card.bgColor} p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 group`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          {card.icon}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.period}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-gray-700 transition-colors">
            {typeof card.value === 'string' ? card.value : card.value.toLocaleString('vi-VN')}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {card.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
            {card.suffix}
          </p>
          {card.growthRate && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${card.levelUp ? 'text-green-600' : 'text-red-600'}`}>
                {card.growthRate}
              </span>
              <svg 
                className={`w-4 h-4 ${card.levelUp ? 'text-green-600' : 'text-red-600'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {card.levelUp ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                )}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-8">
      {/* Period Selector */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Thống kê tổng quan
        </h2>
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="appearance-none bg-white dark:bg-boxdark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hàng 1: 4 cards đầu tiên */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.slice(0, 4).map((card, index) => renderCard(card, index))}
      </div>
      
      {/* Hàng 2: 4 cards còn lại */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.slice(4, 8).map((card, index) => renderCard(card, index + 4))}
      </div>
    </div>
  );
};

export default StatisticsCards; 