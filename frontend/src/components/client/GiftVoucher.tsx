'use client';

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getApiUrl } from '@/config/api';

// Tạo danh sách phần quà với phần trăm giảm giá ngẫu nhiên từ 1% đến 10%
const gifts = Array.from({ length: 6 }, (_, i) => {
  const percent = Math.floor(Math.random() * 10) + 1;
  return { id: i + 1, img: `/images/gift-${i % 3 === 0 ? 'red' : i % 3 === 1 ? 'yellow' : 'green'}.png`, percent };
});

const GiftVoucher = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [checked, setChecked] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGiftSelect = (id: number) => {
    setSelectedGift(id);
    const gift = gifts.find(g => g.id === id);
    setSelectedPercent(gift ? gift.percent : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Tính hạn sử dụng 10 ngày kể từ hôm nay
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const expiresAtStr = expires.toISOString();

    try {
      const response = await fetch(getApiUrl('gift-vouchers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          qua_duoc_chon: selectedGift,
          phan_tram: selectedPercent,
          het_han: expiresAtStr
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVoucherCode(data.data.ma_voucher);
        setShowResult(true);
        setExpiresAt(data.data.het_han || expiresAtStr);
        
        // Hiển thị thông báo về email
        if (data.data.email_da_gui) {
          toast.success('Voucher đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.');
        } else {
          toast.error('Voucher đã được tạo nhưng gửi email thất bại. Vui lòng liên hệ hỗ trợ.');
        }
      } else {
        setErrorMessage(data.message || 'Có lỗi xảy ra khi tạo voucher');
      }
    } catch (error) {
      
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    setShowResult(false);
    setSelectedGift(null);
    setSelectedPercent(null);
    setForm({ name: '', phone: '', email: '' });
    setChecked(true);
    setVoucherCode('');
    setErrorMessage('');
  };

  return (
    <div>
      {/* Nút nhận voucher bằng hình ảnh */}
      <img
        src="/images/voucher-btn.webp"
        alt="Nhận voucher"
        className="fixed bottom-8 left-8 w-20 h-20 cursor-pointer z-50"
        onClick={() => setShowPopup(true)}
      />

      {/* Popup nhận quà */}
      {showPopup && !showResult && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="relative w-[370px] max-w-full rounded-[24px] border-4 border-white shadow-2xl bg-[#E53935] overflow-visible animate-fadeIn">
            {/* Dòng chữ trên cùng */}
            <div className="w-full text-center text-white font-bold text-base pt-3 pb-1 uppercase tracking-wide">
              Nhận voucher cùng Poly Smart
            </div>
            <div className="pt-3 pb-6 px-4">
              <div className="bg-white rounded-[18px] border-2 border-white shadow-lg px-2 pt-2 pb-4 mb-4 relative">
                <h2 className="text-base font-bold text-center text-[#E53935] mb-2 tracking-wide">CHỌN MỘT MÓN QUÀ NHÉ!</h2>
                {/* Hộp quà */}
                <div className="grid grid-cols-3 gap-2">
                  {gifts.map((gift) => (
                    <button
                      type="button"
                      key={gift.id}
                      className={`flex flex-col items-center justify-center p-1 ${selectedGift === gift.id ? 'border-[#E53935] scale-110' : 'border-[#E53935]/30'}`}
                      onClick={() => handleGiftSelect(gift.id)}
                    >
                      <img
                        src="/images/gift.webp"
                        alt=""
                        className="w-16 h-16 mb-0"
                      />
                      <span className={`text-xs font-bold rounded-full border px-3 py-1 mt-0 ${selectedGift === gift.id ? 'border-[#E53935] bg-[#E53935] text-white' : 'border-[#E53935] bg-white text-[#E53935]'}`}>
                        Chọn
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Form nhập thông tin */}
              <div className="text-center text-white font-bold text-base mb-2 tracking-wide">NHẬP THÔNG TIN</div>
              <form onSubmit={handleSubmit} className="space-y-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Nhập họ tên"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full border-none rounded-[10px] px-3 py-2 focus:outline-none text-base bg-[#fff] placeholder:text-[#E53935]"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại"
                  value={form.phone}
                  onChange={handleInputChange}
                  className="w-full border-none rounded-[10px] px-3 py-2 focus:outline-none text-base bg-[#fff] placeholder:text-[#E53935]"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Nhập email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full border-none rounded-[10px] px-3 py-2 focus:outline-none text-base bg-[#fff] placeholder:text-[#E53935]"
                  required
                />
                <div className="flex items-start mt-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setChecked(!checked)}
                    className="accent-[#E53935] mt-1 mr-2"
                    id="voucher-checkbox"
                  />
                  <label htmlFor="voucher-checkbox" className="text-xs text-white select-none">
                    Món quà đặc biệt dành tặng bạn mới chưa mua hàng tại Poly Smart trong 1 năm qua!
                  </label>
                </div>
                
                {/* Hiển thị lỗi */}
                {errorMessage && (
                  <div className="text-yellow-300 text-xs text-center bg-red-800 bg-opacity-50 rounded-lg p-2">
                    {errorMessage}
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-[#FFE066] text-[#E53935] py-2 rounded-full font-bold text-base mt-2 shadow hover:bg-yellow-300 transition disabled:opacity-50 border-2 border-[#FFE066]"
                  disabled={!form.name || !form.phone || !form.email || !selectedGift || !checked || isLoading}
                >
                  {isLoading ? 'ĐANG XỬ LÝ...' : 'NHẬN QUÀ NGAY'}
                </button>
              </form>
            </div>
            {/* Nút đóng */}
            <button
              className="absolute top-1 right-2 text-white text-2xl font-bold z-30"
              onClick={handleClose}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Popup kết quả nhận thưởng */}
      {showPopup && showResult && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="relative w-[370px] max-w-full rounded-[24px] border-4 border-white shadow-2xl bg-[#E53935] overflow-visible animate-fadeIn">
            {/* Nút đóng */}
            <button
              className="absolute top-1 right-2 text-white text-2xl font-bold z-30"
              onClick={handleClose}
              aria-label="Đóng"
            >
              ×
            </button>
            <div className="flex flex-col items-center px-6 pb-6 pt-2">
              <div className="text-center text-[#E53935] font-bold text-lg mb-2 mt-2 uppercase tracking-wide">XIN CHÚC MỪNG</div>
              <img
                src="/images/opengift.png"
                alt="Voucher thành công"
                className="w-32 h-24 object-contain mb-2"
              />
              <div className="text-white text-sm text-center mb-2">
                Bạn trúng <b>voucher giảm ngay {selectedPercent || 10}%</b> mua hàng Online tại Poly Smart.<br/>
                Tư vấn viên sẽ liên hệ ngay qua số điện thoại và gửi mã code đến email của bạn.<br/>
                Gọi tổng đài <b>1800.1234</b> miễn phí hoặc qua cửa hàng để được hỗ trợ nhanh hơn.<br/>
                Hạn sử dụng: <b>{expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : '-'}</b>
              </div>
              <div className="w-full flex flex-col items-center">
                <div className="bg-white text-[#E53935] font-bold text-lg rounded-lg px-6 py-2 border-2 border-[#E53935] mb-2 tracking-widest select-all">
                  {voucherCode}
                </div>
                <div className="text-yellow-300 text-xs text-center">
                  Mã voucher cũng đã được gửi đến email của bạn!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default GiftVoucher; 