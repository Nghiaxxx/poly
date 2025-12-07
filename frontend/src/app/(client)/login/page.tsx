"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi, API_ENDPOINTS, getApiUrl } from "@/config/api";
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import { GoogleLogin } from '@react-oauth/google';
import { showErrorAlert, showWarningAlert } from '@/utils/sweetAlert';

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // Kiểm tra URL parameters cho redirect và message
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const message = urlParams.get('message');
    
    if (message) {
      setRedirectMessage(decodeURIComponent(message));
    }

    const checkSession = async () => {
      try {
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
          
          // Nếu có redirect, chuyển hướng đến trang đó
          if (redirect === 'payment') {
            router.push('/payments');
          } else {
            router.push('/');
          }
        }
      } catch (error: any) {
        // Bỏ qua lỗi khi chưa đăng nhập
        console.log('Chưa đăng nhập');
      }
    };
    checkSession();
  }, [router, dispatch]);

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };

    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    }

    if (!form.password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await fetchApi(API_ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (data && data.token) {
        localStorage.setItem('token', data.token);
      } else if (typeof data === 'string') {
        localStorage.setItem('token', data);
      }
      const userResponse = await fetchApi(API_ENDPOINTS.GET_USER);
      if (userResponse) {
        localStorage.setItem('user', JSON.stringify(userResponse));
        dispatch(setUser({
          _id: userResponse._id,
          TenKH: userResponse.TenKH,
          email: userResponse.email,
          Sdt: userResponse.Sdt,
          gioi_tinh: userResponse.gioi_tinh,
          sinh_nhat: userResponse.sinh_nhat,
          dia_chi: userResponse.dia_chi,
          avatar: userResponse.avatar,
          role: userResponse.role,
        }));
      }
      
      // Hiển thị thông báo thành công
      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      
      // Chuyển hướng sau 1.5 giây để người dùng thấy thông báo
      setTimeout(() => {
        // Kiểm tra URL parameters cho redirect
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect === 'payment') {
          router.push('/payments');
        } else {
          router.push("/");
        }
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200/60 via-white/60 to-blue-100/80 py-8 px-2">
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-8 border border-blue-100 backdrop-blur-md bg-white/60 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0" style={{background: 'linear-gradient(135deg,rgba(59,130,246,0.08) 0%,rgba(59,130,246,0.18) 100%)'}}></div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700 tracking-tight relative z-10">Đăng nhập</h2>
        <p className="text-center text-gray-500 mb-6 relative z-10">Chào mừng bạn quay lại PolySmart!</p>
        {redirectMessage && (
          <div className="rounded-md bg-blue-50 p-3 border border-blue-200 text-center text-blue-700 font-medium text-sm mb-4">
            {redirectMessage}
          </div>
        )}
        <form className="space-y-5 relative z-10" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200 text-center text-red-700 font-medium text-sm mb-2">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 border border-green-200 text-center text-green-700 font-medium text-sm mb-2 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}
          {/* Email */}
          <div>
            <div className={`flex items-center border rounded-full bg-white/80 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition shadow-sm ${errors.email ? 'border-red-300' : 'border-blue-200'}`}>
              <span className="text-blue-400 mr-2 flex items-center transition-colors duration-200">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-base"
                placeholder="Email"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 ml-4">{errors.email}</p>
            )}
          </div>
          {/* Password */}
          <div>
            <div className={`flex items-center border rounded-full bg-white/80 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition shadow-sm relative ${errors.password ? 'border-red-300' : 'border-blue-200'}`}>
              <span className="text-blue-400 mr-2 flex items-center transition-colors duration-200">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-base pr-8"
                placeholder="Mật khẩu"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 focus:outline-none"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.27-3.11-11-8 1.02-2.53 2.77-4.66 5-6.06M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97"/></svg>
                ) : (
                  // Eye icon
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 ml-4">{errors.password}</p>
            )}
          </div>
          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center text-sm text-gray-700">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              Ghi nhớ đăng nhập
            </label>
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
              Quên mật khẩu?
            </Link>
          </div>
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-700 text-white py-2 rounded-full font-semibold shadow-lg hover:scale-105 hover:from-blue-600 hover:to-blue-800 transition-all text-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang đăng nhập..." : success ? "Đăng nhập thành công!" : "Đăng nhập"}
          </button>
        </form>
        {/* Google Login Button */}
        <div className="my-4 flex items-center justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                console.log('Google login attempt with credential:', credentialResponse.credential?.substring(0, 50) + '...');
                
                const res = await fetch(getApiUrl('users/google-login'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                });
                
                if (!res.ok) {
                  const errorData = await res.json();
                  console.error('Google login API error:', errorData);
                  throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
                }
                
                const data = await res.json();
                if (data.token) {
                  localStorage.setItem('token', data.token);
                  
                  // Lấy user info và lưu redux/localStorage
                  try {
                    const userResponse = await fetchApi(API_ENDPOINTS.GET_USER);
                    if (userResponse) {
                      localStorage.setItem('user', JSON.stringify(userResponse));
                      dispatch(setUser({
                        _id: userResponse._id,
                        TenKH: userResponse.TenKH,
                        email: userResponse.email,
                        Sdt: userResponse.Sdt,
                        gioi_tinh: userResponse.gioi_tinh,
                        sinh_nhat: userResponse.sinh_nhat,
                        dia_chi: userResponse.dia_chi,
                        avatar: userResponse.avatar,
                        role: userResponse.role,
                      }));
                    }
                  } catch (userError) {
                    console.warn('Could not fetch user info:', userError);
                  }
                  
                  // Hiển thị thông báo thành công cho Google login
                  setSuccess("Đăng nhập Google thành công! Đang chuyển hướng...");
                  
                  // Chuyển hướng sau 1.5 giây
                  setTimeout(() => {
                    router.push("/");
                  }, 1500);
                } else {
                  console.error('No token received from Google login');
                  showErrorAlert('Đăng nhập thất bại', data.message || 'Đăng nhập Google thất bại - Không nhận được token');
                }
              } catch (err: any) {
                console.error('Google login error:', err);
                showErrorAlert('Đăng nhập thất bại', `Đăng nhập Google thất bại: ${err.message}`);
              }
            }}
            onError={() => {
              console.error('Google OAuth error');
              showErrorAlert('Đăng nhập thất bại', 'Đăng nhập Google thất bại - Lỗi xác thực Google');
            }}
            width="100%"
          />
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
