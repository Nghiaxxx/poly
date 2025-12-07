import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export default function VoucherManagement() {
  const user = useSelector((state: RootState) => state.user.user);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [voucherFilter, setVoucherFilter] = useState("all");
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Fetch user vouchers from backend
  const fetchUserVouchers = async () => {
    if (!user || !user._id) return;
    setLoadingVouchers(true);
    setVoucherError("");
    try {
      const res = await fetch(`/api/user-vouchers?nguoi_dung=${user._id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUserVouchers(data.data);
      } else {
        setUserVouchers([]);
        setVoucherError("Không thể tải kho voucher.");
      }
    } catch (err) {
      setUserVouchers([]);
      setVoucherError("Có lỗi khi tải kho voucher.");
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchUserVouchers();
      setVoucherMessage("");
      setVoucherError("");
    }
  }, [user]);

  // Handle adding voucher
  const handleAddVoucher = async () => {
    setVoucherMessage("");
    setVoucherError("");
    const code = voucherCodeInput.trim();
    if (!code) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    if (!user || !user._id) {
      setVoucherError("Bạn cần đăng nhập để lưu voucher!");
      return;
    }
    // Check for duplicates
    if (
      userVouchers.some(
        (v) => (v.ma_voucher || v.voucherCode) === code.toUpperCase()
      )
    ) {
      setVoucherError("Bạn đã lưu mã này rồi!");
      return;
    }
    try {
      // Call backend API to save voucher to user-voucher
      const res = await fetch("/api/user-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nguoi_dung: user._id, code }),
      });
      const data = await res.json();
      if (data.success) {
        setVoucherMessage("Đã lưu voucher thành công!");
        setVoucherCodeInput("");
        fetchUserVouchers(); // Reload list
        return;
      }
      setVoucherError(
        data.message ||
          "Mã voucher không hợp lệ hoặc đã hết lượt sử dụng/vô hiệu hóa."
      );
    } catch (err) {
      setVoucherError("Có lỗi khi kiểm tra/lưu mã voucher");
    }
  };

  // Filter vouchers
  const filteredVouchers = userVouchers.filter((v) => {
    let het_han =
      v.detail?.ngay_ket_thuc ||
      v.het_han ||
      v.expiresAt ||
      v.ngay_ket_thuc;
    if (voucherFilter === "expiring" && het_han) {
      const timeLeft = new Date(het_han).getTime() - new Date().getTime();
      const hoursLeft = timeLeft / (1000 * 3600);
      return hoursLeft > 0 && hoursLeft < 12; // Under 12 hours
    }
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Kho Voucher</h2>
      </div>
      
      {/* Voucher input */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex items-center gap-4">
        <label
          htmlFor="voucher-code"
          className="font-semibold text-gray-700"
        >
          Mã Voucher
        </label>
        <input
          id="voucher-code"
          type="text"
          placeholder="Nhập mã voucher tại đây"
          className="flex-grow border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={voucherCodeInput}
          onChange={(e) => setVoucherCodeInput(e.target.value)}
        />
        <button
          className="bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-md hover:bg-gray-300"
          onClick={handleAddVoucher}
        >
          Lưu
        </button>
      </div>
      
      {voucherMessage && (
        <div className="text-green-600 mb-2">{voucherMessage}</div>
      )}
      {voucherError && (
        <div className="text-red-500 mb-2">{voucherError}</div>
      )}
      
      {/* Filter tabs */}
      <div className="flex space-x-6 mb-4 border-b">
        <button
          onClick={() => setVoucherFilter("all")}
          className={`py-2 font-medium ${
            voucherFilter === "all"
              ? "text-[#0066CC] border-b-2 border-[#0066CC]"
              : "text-gray-600"
          }`}
        >
          Tất cả ({userVouchers.length})
        </button>
        <button
          onClick={() => setVoucherFilter("expiring")}
          className={`py-2 font-medium ${
            voucherFilter === "expiring"
              ? "text-[#0066CC] border-b-2 border-[#0066CC]"
              : "text-gray-600"
          }`}
        >
          Sắp hết hạn
        </button>
      </div>
      
      {/* Voucher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVouchers.map((voucher) => {
          const code = voucher.ma_voucher;
          const het_han = voucher.het_han;
          const da_su_dung = voucher.da_su_dung;
          // Get data from detail if available
          const detail = voucher.detail || {};
          const isGift = voucher.loai === "gift";
          const phan_tram =
            detail.phan_tram_giam_gia ||
            voucher.phan_tram ||
            voucher.phan_tram_giam_gia ||
            0;
          const giam_toi_da =
            detail.giam_toi_da || voucher.giam_toi_da || 0;
          const don_hang_toi_thieu =
            detail.don_hang_toi_thieu || voucher.don_hang_toi_thieu || 0;
          const mo_ta = detail.mo_ta || voucher.mo_ta || "";
          const shopName =
            detail.shopName ||
            voucher.shopName ||
            (isGift ? "SHOPEE" : "POLYSMART");
          const logo =
            detail.logo ||
            voucher.logo ||
            (isGift ? "" : "/images/voucherlogo.jpg");
          
          return (
            <div
              key={code}
              className={`bg-white rounded-lg shadow-sm flex overflow-hidden relative border ${
                da_su_dung ? "opacity-60 grayscale pointer-events-none" : ""
              }`}
            >
              <div className="w-1/4 bg-[#D0011B] flex items-center justify-center p-2 relative">
                <div className="text-center">
                  <img
                    src={logo}
                    alt={shopName}
                    className="w-12 h-12 mx-auto mb-1 rounded-full bg-white object-contain p-1"
                  />
                  <span className="text-white font-bold text-sm uppercase">
                    {shopName}
                  </span>
                </div>
              </div>
              <div className="w-3/4 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">
                    {phan_tram > 0
                      ? `Giảm ${phan_tram}%`
                      : ""}
                    {giam_toi_da > 0
                      ? ` Giảm tối đa ₫${giam_toi_da.toLocaleString()}`
                      : ""}
                    {phan_tram === 0 && giam_toi_da === 0
                      ? mo_ta
                      : ""}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {`Đơn Tối Thiểu ₫${don_hang_toi_thieu.toLocaleString()}`}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Hiệu lực đến:{" "}
                    {het_han
                      ? new Date(het_han).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    className={`px-4 py-1 rounded text-sm font-semibold border ${
                      da_su_dung
                        ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-[#DBEAFE]/10 text-[#0066CC] border-[#0066CC]"
                    }`}
                    disabled={da_su_dung}
                    tabIndex={da_su_dung ? -1 : 0}
                  >
                    {da_su_dung ? "Đã sử dụng" : "Dùng Ngay"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 