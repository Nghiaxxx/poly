"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config/api';

interface User {
  _id: string;
  email: string;
  TenKH: string;
  role: string;
  avatar?: string;
  Sdt?: string;
  dia_chi?: string;
  gioi_tinh?: string;
  sinh_nhat?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('users/userinfo'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Check if user is admin
        if (userData.role !== 'admin') {
          logout();
          toast.error('Bạn không có quyền truy cập admin!');
          return;
        }
        
        setUser(userData);
      } else {
        // Token invalid, remove it
        localStorage.removeItem('admin_token');
        setToken(null);
      }
    } catch (error) {

      localStorage.removeItem('admin_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(getApiUrl('users/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const authToken = await response.text();
        
        // Clean token (remove quotes if present)
        const cleanToken = authToken.replace(/"/g, '');
        
        // Decode token to check role
        const tokenPayload = JSON.parse(atob(cleanToken.split('.')[1]));
        
        if (tokenPayload.role !== 'admin') {
          toast.error('Chỉ tài khoản admin mới có thể đăng nhập!');
          return false;
        }

        // Save token and fetch user info
        localStorage.setItem('admin_token', cleanToken);
        setToken(cleanToken);
        await fetchUserInfo(cleanToken);
        
        toast.success('Đăng nhập thành công!');
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Đăng nhập thất bại!');
        return false;
      }
    } catch (error) {

      toast.error('Có lỗi xảy ra khi đăng nhập!');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
    router.push('/auth/signin');
    toast.success('Đăng xuất thành công!');
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 