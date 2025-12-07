"use client";

import React, { useState, useEffect } from 'react';

interface SystemStatusProps {
  className?: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ className = "" }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isOnline ? 'Hệ thống hoạt động' : 'Hệ thống offline'}
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="text-sm text-gray-600">
              {formatDate(currentTime)}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Database</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">API</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Frontend</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600">Tất cả hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus; 