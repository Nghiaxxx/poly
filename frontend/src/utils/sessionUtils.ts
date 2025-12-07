/**
 * Keys used in session storage
 */
export const SESSION_KEYS = {
  USER: 'user_session',
  AUTH_TOKEN: 'auth_token',
  LOGIN_TIME: 'login_time'
} as const;

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
export const checkLoginSession = () => {
  try {
    const userSession = sessionStorage.getItem(SESSION_KEYS.USER);
    const authToken = sessionStorage.getItem(SESSION_KEYS.AUTH_TOKEN);
    const loginTime = sessionStorage.getItem(SESSION_KEYS.LOGIN_TIME);

    if (!userSession || !authToken) {
      return {
        isLoggedIn: false,
        user: null,
        loginTime: null
      };
    }

    return {
      isLoggedIn: true,
      user: JSON.parse(userSession),
      loginTime: loginTime ? new Date(loginTime) : null
    };
  } catch (error) {
    
    return {
      isLoggedIn: false,
      user: null,
      loginTime: null
    };
  }
};

/**
 * Lưu thông tin đăng nhập vào session
 */
export const saveLoginSession = (user: any, token: string) => {
  try {
    sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify(user));
    sessionStorage.setItem(SESSION_KEYS.AUTH_TOKEN, token);
    sessionStorage.setItem(SESSION_KEYS.LOGIN_TIME, new Date().toISOString());
  } catch (error) {
    
  }
};

/**
 * Xóa thông tin đăng nhập khỏi session
 */
export const clearLoginSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEYS.USER);
    sessionStorage.removeItem(SESSION_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(SESSION_KEYS.LOGIN_TIME);
  } catch (error) {
    
  }
};

/**
 * Lấy token xác thực từ session
 */
export const getAuthToken = () => {
  return sessionStorage.getItem(SESSION_KEYS.AUTH_TOKEN);
};

/**
 * Kiểm tra xem session có hết hạn chưa (ví dụ: sau 24h)
 */
export const isSessionExpired = () => {
  const loginTime = sessionStorage.getItem(SESSION_KEYS.LOGIN_TIME);
  if (!loginTime) return true;

  const loginDate = new Date(loginTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

  // Session hết hạn sau 24h
  return hoursDiff > 24;
}; 