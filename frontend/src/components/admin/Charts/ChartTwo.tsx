"use client";

import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/config/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatisticsData {
  sales: number[];
  revenue: number[];
  profit: number[];
  labels: string[];
}

const ChartTwo: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');
  const [statisticsData, setStatisticsData] = useState<StatisticsData>({
    sales: [44, 55, 41, 67, 22, 43, 65],
    revenue: [13, 23, 20, 8, 13, 27, 15],
    profit: [31, 32, 21, 59, 9, 16, 50],
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const options: ApexOptions = {
    colors: ["#3C50E0", "#80CAEE"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "bar",
      height: 335,
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    responsive: [
      {
        breakpoint: 1536,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 0,
              columnWidth: "25%",
            },
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 0,
        columnWidth: "25%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
    },

    xaxis: {
      categories: statisticsData.labels,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Satoshi",
      fontWeight: 500,
      fontSize: "14px",
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number, opts: any) {
          const seriesName = opts.seriesIndex === 0 ? "sản phẩm" : "triệu VNĐ";
          return val + " " + seriesName;
        },
      },
    },
  };

  // Fetch statistics data
  const fetchStatistics = async (period: 'today' | 'week' | 'month') => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`admin/statistics?period=${period}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatisticsData(data);
      } else {

      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(timeFilter);
  }, [timeFilter, token]);

  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'today' | 'week' | 'month';
    setTimeFilter(value);
  };

  const getPeriodLabel = (period: string) => {
    switch(period) {
      case 'today': return 'Hôm nay';
      case 'week': return 'Tuần này';
      case 'month': return 'Tháng này';
      default: return 'Tuần này';
    }
  };

  const series = [
    {
      name: "Số lượng bán",
      data: statisticsData.sales,
    },
    {
      name: "Doanh thu (triệu VNĐ)",
      data: statisticsData.revenue,
    },
  ];

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-lg dark:border-gray-700 dark:bg-boxdark hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Thống kê bán hàng
          </h4>
          <div className="group relative">
            <svg 
              className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Doanh thu từ đơn hàng đã thanh toán thành công
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div>
          <div className="relative z-20 inline-block">
            <select
              name="timeFilter"
              id="timeFilter"
              value={timeFilter}
              onChange={handleTimeFilterChange}
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none dark:text-white"
            >
              <option value="today" className="dark:bg-boxdark">
                Hôm nay
              </option>
              <option value="week" className="dark:bg-boxdark">
                Tuần này
              </option>
              <option value="month" className="dark:bg-boxdark">
                Tháng này
              </option>
            </select>
            <span className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.955772 0.54427 0.911642C0.647241 0.808672 0.809051 0.808672 0.912022 0.896932L4.85431 4.60386C4.92785 4.67741 5.06025 4.67741 5.14851 4.60386L9.09079 0.896932C9.19376 0.793962 9.35557 0.808672 9.45854 0.911642C9.56151 1.01461 9.5468 1.17642 9.44383 1.27939L5.50155 4.98632C5.22206 5.23639 4.78076 5.23639 4.51598 4.98632L0.558981 1.27939C0.50014 1.22055 0.47072 1.16171 0.47072 1.08816Z"
                  fill="#637381"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.22659 0.546578L5.00141 4.09604L8.76422 0.557869C9.08459 0.244537 9.54201 0.329403 9.79139 0.578788C10.112 0.899434 10.0277 1.36122 9.77668 1.61224L9.76644 1.62248L5.81552 5.33722C5.36257 5.74249 4.6445 5.7544 4.19352 5.32924C4.19327 5.32901 4.19377 5.32948 4.19352 5.32924L0.225953 1.61241C0.102762 1.48922 -4.20186e-08 1.31674 -3.20269e-08 1.08816C-2.40601e-08 0.905899 0.0780105 0.712197 0.211421 0.578787C0.494701 0.295506 0.935574 0.297138 1.21836 0.539529L1.22659 0.546578ZM4.51598 4.98632C4.78076 5.23639 5.22206 5.23639 5.50155 4.98632L9.44383 1.27939C9.5468 1.17642 9.56151 1.01461 9.45854 0.911642C9.35557 0.808672 9.19376 0.793962 9.09079 0.896932L5.14851 4.60386C5.06025 4.67741 4.92785 4.67741 4.85431 4.60386L0.912022 0.896932C0.809051 0.808672 0.647241 0.808672 0.54427 0.911642C0.500141 0.955772 0.47072 1.02932 0.47072 1.08816C0.47072 1.16171 0.50014 1.22055 0.558981 1.27939L4.51598 4.98632Z"
                  fill="#637381"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Ghi chú nhỏ */}
      <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
        💡 Doanh thu chưa bao gồm chi phí vận hành, phí giao hàng và các khoản khấu trừ
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-boxdark dark:bg-opacity-75 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <div id="chartTwo" className="w-full h-full">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;
