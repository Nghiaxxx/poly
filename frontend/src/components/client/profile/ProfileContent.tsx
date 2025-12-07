import React, { Suspense } from 'react';
import AddressManager from '@/components/client/AddressManager';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

// Lazy load tab components for better performance
const AccountInfo = React.lazy(() => import('./tabs/AccountInfo'));
const PasswordChange = React.lazy(() => import('./tabs/PasswordChange'));
const AvatarUpload = React.lazy(() => import('./tabs/AvatarUpload'));
const OrderManagement = React.lazy(() => import('./tabs/OrderManagement'));
const ReviewHistory = React.lazy(() => import('./tabs/ReviewHistory'));
const VoucherManagement = React.lazy(() => import('./tabs/VoucherManagement'));
const WalletManagement = React.lazy(() => import('./tabs/WalletManagement'));

interface ProfileContentProps {
  activeTab: string;
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
    <p className="text-gray-600 font-medium">Đang tải nội dung...</p>
    <p className="text-sm text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
  </div>
);

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
        <p className="text-gray-600 mb-4">Không thể tải nội dung. Vui lòng thử lại.</p>
        <button 
          onClick={() => setHasError(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors interactive-hover"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// Address management using existing AddressManager
const AddressManagement = () => {
  const user = useSelector((state: RootState) => state.user.user);
  
  return (
    <div>
      {user?._id ? (
        <AddressManager userId={user._id} />
      ) : (
        <div className="text-center py-8 text-gray-500">
          Vui lòng đăng nhập để quản lý địa chỉ
        </div>
      )}
    </div>
  );
};

export default function ProfileContent({ activeTab }: ProfileContentProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <AccountInfo />
            </ErrorBoundary>
          </Suspense>
        );
      case "address":
        return (
          <ErrorBoundary>
            <AddressManagement />
          </ErrorBoundary>
        );
      case "orders":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <OrderManagement />
            </ErrorBoundary>
          </Suspense>
        );
      case "wallet":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <WalletManagement />
            </ErrorBoundary>
          </Suspense>
        );
      case "voucher":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <VoucherManagement />
            </ErrorBoundary>
          </Suspense>
        );
      case "password":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <PasswordChange />
            </ErrorBoundary>
          </Suspense>
        );
      case "avatar":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <AvatarUpload />
            </ErrorBoundary>
          </Suspense>
        );
      case "reviews":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <ReviewHistory />
            </ErrorBoundary>
          </Suspense>
        );
      case "system":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Hệ thống</h2>
            <p className="text-gray-600">
              Nội dung hệ thống, thông tin về các chức năng và cập nhật của hệ thống.
            </p>
          </div>
        );
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Tab không tồn tại. Vui lòng chọn tab khác.
          </div>
        );
    }
  };

  return (
    <div className="min-h-[400px]">
      <div className="fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
} 