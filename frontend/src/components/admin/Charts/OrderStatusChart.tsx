"use client";

import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/config/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface OrderStatusData {
  chartData: Array<{
    label: string;
    value: number;
    color: string;
    icon: string;
  }>;
  summaryCards: Array<{
    status: string;
    count: number;
    color: string;
    icon: string;
  }>;
}

const OrderStatusChart: React.FC = () => {
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData>({
    chartData: [],
    summaryCards: []
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchOrderStatusData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('admin/statistics/order-status-detailed'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrderStatusData(data);
      } else {

      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatusData();
  }, [token]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 300,
      fontFamily: "Satoshi, sans-serif",
    },
    colors: orderStatusData.chartData.map(item => item.color),
    labels: orderStatusData.chartData.map(item => item.label),
    legend: {
      position: "bottom",
      fontFamily: "Satoshi",
      fontSize: "12px",
      markers: {
        size: 8,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: function(seriesName, opts) {
        return seriesName;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          background: "transparent",
        },
        offsetY: 0,
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: function(value) {
          return value + ' đơn hàng';
        }
      }
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };

  const series = orderStatusData.chartData.map(item => item.value);

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-lg dark:border-gray-700 dark:bg-boxdark hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="mb-4">
        <h4 className="text-xl font-semibold text-black dark:text-white mb-2">
          Tỷ Lệ Trạng Thái Đơn Hàng
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Phân bổ trạng thái đơn hàng
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Donut Chart */}
        <div className="flex-1 mb-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div id="orderStatusChart" className="flex justify-center">
              <ReactApexChart
                options={chartOptions}
                series={series}
                type="donut"
                height={300}
                width={350}
              />
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {orderStatusData.summaryCards.map((card, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: card.color + '20', 
                backgroundColor: card.color + '08' 
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm"
                style={{ backgroundColor: card.color }}
              >
                <div className="text-white">
                  {card.icon === 'check' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {card.icon === 'clock' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {card.status}
                </p>
                <p className="text-lg font-bold" style={{ color: card.color }}>
                  {card.count} đơn
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart; 