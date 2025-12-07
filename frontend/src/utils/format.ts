/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi đã được định dạng theo tiền tệ VNĐ
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
};

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam với style currency
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi đã được định dạng theo tiền tệ VNĐ với style currency
 */
export const formatVND = (amount: number): string => {
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}; 