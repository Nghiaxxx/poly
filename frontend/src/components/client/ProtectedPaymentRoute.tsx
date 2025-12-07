"use client";
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import type { RootState } from '@/store';
import { fetchApi, API_ENDPOINTS } from '@/config/api';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import LoginRequiredModal from './LoginRequiredModal';

interface ProtectedPaymentRouteProps {
  children: React.ReactNode;
}

const ProtectedPaymentRoute: React.FC<ProtectedPaymentRouteProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state.user.user);
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsChecking(false);
          setIsLoading(false);
          return;
        }

        // Kiểm tra session với server
        const response = await fetchApi(API_ENDPOINTS.GET_USER);
        if (response && response.user) {
          dispatch(setUser({
            _id: response.user._id,
            TenKH: response.user.TenKH,
            email: response.user.email,
            Sdt: response.user.Sdt,
            gioi_tinh: response.user.gioi_tinh,
            sinh_nhat: response.user.sinh_nhat,
            dia_chi: response.user.dia_chi,
            avatar: response.user.avatar,
            role: response.user.role,
          }));
        } else {
          // Token không hợp lệ, xóa token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {

        // Xóa token nếu có lỗi
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsChecking(false);
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  useEffect(() => {
    if (!isChecking && !isLoggedIn) {
      // Hiển thị modal yêu cầu đăng nhập thay vì redirect ngay
      setShowLoginModal(true);
    }
  }, [isLoggedIn, isChecking]);

  // Hiển thị loading khi đang kiểm tra
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-800">Đang kiểm tra đăng nhập...</p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, không hiển thị gì (sẽ redirect)
  if (!isLoggedIn) {
    return null;
  }

  // Nếu đã đăng nhập, hiển thị children
  return (
    <>
      {children}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Vui lòng đăng nhập để tiếp tục thanh toán"
      />
    </>
  );
};

export default ProtectedPaymentRoute; 