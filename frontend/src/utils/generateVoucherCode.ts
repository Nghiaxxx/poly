/**
 * Sinh mã voucher riêng cho từng user
 * Format: [MÃ GỐC]-[6 KÝ TỰ NGẪU NHIÊN]
 * Ví dụ: 500K-ABC123
 */
export const generateUniqueVoucherCode = (originalCode: string): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uniqueCode = '';
  
  // Sinh 6 ký tự ngẫu nhiên
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueCode += characters[randomIndex];
  }

  // Kết hợp mã gốc với mã ngẫu nhiên
  return `${originalCode}-${uniqueCode}`;
}; 