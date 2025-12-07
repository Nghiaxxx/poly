import React from 'react';

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const PROFILE_TABS = [
  { key: "info", label: "Thông tin tài khoản", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "address", label: "Địa chỉ nhận hàng", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657m10.607-2.121a8.001 8.001 0 00-11.314 0m11.314 0l.001.001h-.001zm-11.314 0L3.414 14.5a1.998 1.998 0 01-2.828 0L.343 12.343" },
  { key: "orders", label: "Đơn đặt hàng", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M17 12h.01" },
  { key: "wallet", label: "Ví PolyPay", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
  { key: "password", label: "Đổi mật khẩu", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { key: "avatar", label: "Ảnh đại diện", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" },
  { key: "voucher", label: "Kho Voucher", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" },
  { key: "reviews", label: "Lịch sử đánh giá sản phẩm", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function ProfileSidebar({ activeTab, onTabChange, isSidebarOpen, setSidebarOpen }: ProfileSidebarProps) {
  return (
    <>
      {/* Toggle menu ở mobile */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors"
        >
          <svg 
            className={`w-5 h-5 mr-2 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          {isSidebarOpen ? "Đóng menu" : "Menu profile"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md lg:shadow-none p-4 lg:p-6 w-full lg:w-64 lg:min-h-screen transition-all duration-300 border-r border-gray-200 ${
          isSidebarOpen ? "block" : "hidden"
        } lg:block`}
      >

        <nav className="space-y-2">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
              onClick={() => {
                onTabChange(tab.key);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg
                className={`w-5 h-5 mr-3 transition-colors ${
                  activeTab === tab.key ? "text-blue-600" : "text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={tab.icon}
                />
              </svg>
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
} 