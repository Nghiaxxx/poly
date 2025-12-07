// Cấu hình API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Hàm xử lý lỗi fetch
const handleFetchError = (error: any) => {
  throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
};

// Hàm fetch với xử lý lỗi
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;



  try {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    // Nếu body không phải là FormData, đặt Content-Type là application/json
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers,
      },
    });



    if (!response.ok) {
      const contentType = response.headers.get('Content-Type');
      let errorBody: any = {};
      if (contentType && contentType.includes('application/json')) {
        try {
          errorBody = await response.json();
        } catch (jsonError) {
    
          errorBody = await response.text();
        }
      } else {
        errorBody = await response.text();
      }

      const errorMessage = typeof errorBody === 'object' && errorBody !== null && errorBody.message
        ? errorBody.message
        : (typeof errorBody === 'string' ? errorBody : `HTTP error! status: ${response.status}`);
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {

    throw error;
  }
};

// Các endpoint API
export const API_ENDPOINTS = {
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  LOGOUT: '/users/logout',
  GOOGLE_LOGIN: '/users/google-login',
  GET_USER: '/users/userinfo',
  UPDATE_USER: '/users/update',
  CHANGE_PASSWORD: '/users/change-password',
  SETTINGS: '/settings',
  CATEGORIES: '/categories',
  PRODUCTS: '/products',
  ADDRESSES: '/addresses',
};

const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
  STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
};

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.API_URL}/${cleanEndpoint}`;
};

export const getBaseUrl = (): string => {
  return config.BASE_URL;
};

export const getImageUrl = (path: string) => {
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3000';
  if (!path) return '/images/no-image.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Nếu path đã bắt đầu bằng /images/, chỉ cần thêm domain
  if (path.startsWith('/images/')) {
    return `${IMAGE_BASE_URL}${path}`;
  }
  
  // Trường hợp còn lại, thêm /images/ vào trước
  return `${IMAGE_BASE_URL}/images/${path}`;
};

export const getStorageUrl = (path: string): string => {
  if (!path) return '/images/no-image.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/images/')) {
    return path;
  }
  return `/images/${path}`;
};

export default config; 