"use client";
import { useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/config/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        getApiUrl("users/forgot-password"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra");
      setMessage("Mật khẩu mới đã được gửi về email của bạn");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200/60 via-white/60 to-blue-100/80 py-8 px-2">
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-8 border border-blue-100 backdrop-blur-md bg-white/60 relative">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center text-blue-700">
          Quên mật khẩu
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Nhập email đã đăng ký để nhận mật khẩu mới.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            className="w-full border border-blue-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base bg-white/80 placeholder-gray-400"
            placeholder="Nhập email đã đăng ký"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!message}
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-700 text-white py-2 rounded-full font-semibold shadow-lg transition-all text-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || !!message}
          >
            {loading ? "Đang gửi..." : "Gửi mật khẩu mới"}
          </button>
        </form>
        {message && (
          <>
            <div className="mt-6 text-green-600 text-center font-semibold">
              {message}
            </div>
            <Link
              href="/login"
              className="block mt-6 w-full text-center bg-gradient-to-r from-blue-500 via-blue-400 to-blue-700 text-white py-2 rounded-full font-semibold shadow-lg transition-all text-lg hover:opacity-90"
            >
              Quay lại trang đăng nhập
            </Link>
          </>
        )}
        {error && (
          <div className="mt-4 text-red-600 text-center font-semibold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
