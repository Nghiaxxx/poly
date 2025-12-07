"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Head from "next/head";
import { getApiUrl, getBaseUrl } from "@/config/api";

const getImageUrl = (url: string | string[]) => {
  if (Array.isArray(url)) url = url[0];
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || getBaseUrl();
  if (url.startsWith('/images/')) return `${backendUrl}${url}`;
  return `${backendUrl}/images/${url}`;
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    TenKH: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    TenKH: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {
      TenKH: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!form.TenKH.trim()) {
      newErrors.TenKH = "Vui lòng nhập họ và tên";
    }

    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!form.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(form.password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái, số và ký tự đặc biệt";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return !newErrors.TenKH && !newErrors.email && !newErrors.password && !newErrors.confirmPassword;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return "Vui lòng nhập email";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Email không hợp lệ";
    }
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return "Vui lòng nhập mật khẩu";
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(password)) {
      return "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái, số và ký tự đặc biệt";
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) {
      return "Vui lòng xác nhận mật khẩu";
    }
    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation
    if (name === 'email') {
      const emailError = validateEmail(value);
      setErrors(prev => ({
        ...prev,
        email: emailError
      }));
    } else if (name === 'password') {
      const passwordError = validatePassword(value);
      setErrors(prev => ({
        ...prev,
        password: passwordError
      }));
      // Also validate confirm password when password changes
      if (form.confirmPassword) {
        const confirmPasswordError = validateConfirmPassword(form.confirmPassword, value);
        setErrors(prev => ({
          ...prev,
          confirmPassword: confirmPasswordError
        }));
      }
    } else if (name === 'confirmPassword') {
      const confirmPasswordError = validateConfirmPassword(value, form.password);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordError
      }));
    } else {
      // Clear error when user starts typing in other fields
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [name]: ""
        }));
      }
    }
  };

  // Chèn script reCAPTCHA vào body khi component mount
  useEffect(() => {
    if (!(window as any).grecaptcha) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

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
              const res = await fetch(getApiUrl('users/register'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TenKH: form.TenKH,
          email: form.email,
          password: form.password,
          role: "user"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
      setSuccess("Đăng ký thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  // Ảnh minh họa lấy từ backend (ví dụ: /images/register.png)
  const illustration = getImageUrl("/images/register_banner.jpeg");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-200/60 via-white/60 to-blue-100/80 py-8 px-2">
      <div className="flex flex-col md:flex-row w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-blue-100 backdrop-blur-md bg-white/60 relative">
        {/* Cột trái: Ảnh */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-200 to-blue-400 items-center justify-center p-8">
          <Image
            src={illustration}
            alt="Đăng ký"
            width={500}
            height={500}
            className="object-contain rounded-2xl shadow-lg border border-blue-100"
            style={{ width: '100%', height: 'auto', marginTop: 0 }}
            unoptimized
          />
        </div>
        {/* Cột phải: Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center relative z-10">
          <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-center text-gray-500 mb-6">Chào mừng bạn đến với PolySmart!<br/>Vui lòng điền thông tin để đăng ký.</p>
          {error && <div className="mb-4 text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded py-2">{error}</div>}
          {success && <div className="mb-4 text-green-600 text-center font-medium bg-green-50 border border-green-200 rounded py-2 flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Họ và tên */}
            <div>
              <div className={`flex items-center border rounded-full bg-white/80 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition shadow-sm ${errors.TenKH ? 'border-red-300' : 'border-blue-200'}`}>
                <span className="text-blue-400 mr-2 flex items-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  name="TenKH"
                  value={form.TenKH}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-base"
                  placeholder="Họ và tên"
                />
              </div>
              {errors.TenKH && (
                <p className="text-red-500 text-sm mt-1 ml-4">{errors.TenKH}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <div className={`flex items-center border rounded-full bg-white/80 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition shadow-sm ${errors.email ? 'border-red-300' : 'border-blue-200'}`}>
                <span className="text-blue-400 mr-2 flex items-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                </span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-base"
                  placeholder="E-mail"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 ml-4">{errors.email}</p>
              )}
            </div>
            {/* Mật khẩu */}
            <div>
              <div className={`flex items-center border rounded-full bg-white/80 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition shadow-sm relative ${errors.password ? 'border-red-300' : 'border-blue-200'}`}>
                <span className="text-blue-400 mr-2 flex items-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
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
              <div className="text-xs text-gray-400 ml-1">Mật khẩu tối thiểu 6 ký tự, gồm chữ, số và ký tự đặc biệt</div>
            </div>
            {/* Xác nhận mật khẩu */}
            <div>
              <div className={`flex items-center border rounded-full bg-white/80 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition shadow-sm relative ${errors.confirmPassword ? 'border-red-300' : 'border-blue-200'}`}>
                <span className="text-blue-400 mr-2 flex items-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-base pr-8"
                  placeholder="Xác nhận mật khẩu"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? (
                    // Eye-off icon
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.27-3.11-11-8 1.02-2.53 2.77-4.66 5-6.06M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97"/></svg>
                  ) : (
                    // Eye icon
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 ml-4">{errors.confirmPassword}</p>
              )}
            </div>
            {/* reCAPTCHA */}
            {/* <div className="mb-2">
              <div className="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"></div>
            </div> */}
            <div className="text-xs text-gray-500 text-center">
              Bằng việc đăng ký tài khoản, bạn đồng ý với <a href="#" className="text-blue-600 underline">điều khoản bảo mật</a> & sử dụng thông tin cá nhân của PolySmart
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-700 text-white py-2 rounded-full font-semibold shadow-lg hover:scale-105 hover:from-blue-600 hover:to-blue-800 transition-all text-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !!success}
            >
              {loading ? "Đang đăng ký..." : success ? "Đăng ký thành công!" : "Đăng ký"}
            </button>
            <div className="mt-4 text-center text-sm">
              Đã có tài khoản? <a href="/login" className="text-blue-600 underline font-medium">Đăng nhập ngay</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
