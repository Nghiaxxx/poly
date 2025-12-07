import { getApiUrl } from '../config/api';

/**
 * Xóa tất cả cookie và logout khỏi hệ thống
 */
export const clearAllCookies = async () => {
  try {
    // Gọi API logout sử dụng config
    const response = await fetch(`${getApiUrl('users')}/logout`, {
      method: 'POST',
      credentials: 'include', // Quan trọng để gửi cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Xóa tất cả cookie
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }

      // Xóa localStorage
      localStorage.clear();
      
      // Xóa sessionStorage
      sessionStorage.clear();

      // Reload trang sau khi hoàn tất
      window.location.href = '/'; // Chuyển về trang chủ thay vì chỉ reload
    } else {
      
    }
  } catch (error) {
    
  }
}; 