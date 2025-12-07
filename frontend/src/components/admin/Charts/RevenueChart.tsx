"use client";

import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/config/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface RevenueData {
  revenue: number[];
  labels: string[];
  period: string;
}

const RevenueChart: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
  const [revenueData, setRevenueData] = useState<RevenueData>({
    revenue: [77187, 36890, 62752],
    labels: ['2025-07-23', '2025-07-24', '2025-07-30'],
    period: 'Ngày'
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchRevenueData = async (period: 'day' | 'week' | 'month') => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`admin/statistics/revenue?type=${period}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      } else {

      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData(timeFilter);
  }, [timeFilter, token]);

  const handleTimeFilterChange = (filter: 'day' | 'week' | 'month') => {
    setTimeFilter(filter);
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      fontFamily: "Satoshi, sans-serif",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    colors: ["#3C50E0"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    grid: {
      borderColor: "#E2E8F0",
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: revenueData.labels,
      labels: {
        style: {
          colors: "#64748B",
          fontSize: "12px",
          fontFamily: "Satoshi",
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748B",
          fontSize: "12px",
          fontFamily: "Satoshi",
          fontWeight: 500,
        },
        formatter: function (value) {
          return value.toLocaleString('vi-VN') + "₫";
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return value.toLocaleString('vi-VN') + "₫";
        },
      },
    },
  };

  const series = [
    {
      name: "Doanh thu",
      data: revenueData.revenue,
    },
  ];

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-lg dark:border-gray-700 dark:bg-boxdark hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Doanh thu Theo ngày
          </h4>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'day', label: 'Ngày' },
            { key: 'week', label: 'Tuần' },
            { key: 'month', label: 'Tháng' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleTimeFilterChange(filter.key as 'day' | 'week' | 'month')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                timeFilter === filter.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-boxdark dark:bg-opacity-75 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <div id="revenueChart">
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="area"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueChart; 