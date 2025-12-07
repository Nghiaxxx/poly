"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ 
  isOpen, 
  onClose, 
  message = "Vui lòng đăng nhập để tiếp tục thanh toán" 
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    router.push('/login?redirect=payment&message=' + encodeURIComponent(message));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Yêu cầu đăng nhập
          </h3>
          
          {/* Message */}
          <p className="text-sm text-gray-500 mb-6">
            {message}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Đăng nhập ngay
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Hủy
            </button>
          </div>
          
          {/* Register link */}
          <div className="mt-4 text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal; 