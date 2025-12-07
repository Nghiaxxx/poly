"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import ChartTwo from "../Charts/ChartTwo";
import CardDataStats from "../CardDataStats";
import StatisticsCards from "./StatisticsCards";
import OrderStatusChart from "../Charts/OrderStatusChart";
import RevenueChart from "../Charts/RevenueChart";


import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/config/api";

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

const ECommerce: React.FC = () => {
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
  const { token } = useAuth();

  // Fetch overall statistics
  const fetchOverallStats = async () => {
    if (!token) {
      
      return;
    }
    
    setLoading(true);
    try {
      
      const response = await fetch(getApiUrl('admin/statistics?period=week'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      
      
      if (response.ok) {
        const data = await response.json();

        setOverallStats(data.overall);
      } else {
        const errorData = await response.json();
        
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallStats();
  }, [token]);

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tổng quan về hiệu suất kinh doanh và thống kê cửa hàng
        </p>
      </div>

      {/* Row 1: Statistics Cards - Thống kê thật từ đơn hàng */}
      <StatisticsCards />

      {/* Row 2: Revenue Chart */}
      <div className="grid grid-cols-12 gap-6 2xl:gap-7.5">
        <div className="col-span-12">
          <RevenueChart />
        </div>
      </div>

      {/* Row 3: Sales Statistics and Order Status */}
      <div className="grid grid-cols-12 gap-6 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-6 h-[500px]">
          <ChartTwo />
        </div>
        <div className="col-span-12 xl:col-span-6 h-[500px]">
          <OrderStatusChart />
        </div>
      </div>



    </div>
  );
};

export default ECommerce;

