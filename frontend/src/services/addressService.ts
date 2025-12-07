import { fetchApi, API_ENDPOINTS } from '@/config/api';

export interface Address {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  userId: string;
  name: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  name?: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  isDefault?: boolean;
}

class AddressService {
  // Lấy tất cả địa chỉ của user
  async getAddressesByUser(userId: string): Promise<Address[]> {
    try {
      const response = await fetchApi(`${API_ENDPOINTS.ADDRESSES}/user/${userId}`);
      return response.data || [];
    } catch (error) {

      throw error;
    }
  }

  // Tạo địa chỉ mới
  async createAddress(addressData: CreateAddressData): Promise<Address> {
    try {
      const response = await fetchApi(API_ENDPOINTS.ADDRESSES, {
        method: 'POST',
        body: JSON.stringify(addressData),
      });
      return response.data;
    } catch (error) {

      throw error;
    }
  }

  // Cập nhật địa chỉ
  async updateAddress(id: string, addressData: UpdateAddressData): Promise<Address> {
    try {
      const response = await fetchApi(`${API_ENDPOINTS.ADDRESSES}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(addressData),
      });
      return response.data;
    } catch (error) {

      throw error;
    }
  }

  // Xóa địa chỉ
  async deleteAddress(id: string): Promise<void> {
    try {
      await fetchApi(`${API_ENDPOINTS.ADDRESSES}/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {

      throw error;
    }
  }

  // Set địa chỉ làm mặc định
  async setDefaultAddress(id: string): Promise<Address> {
    try {
      const response = await fetchApi(`${API_ENDPOINTS.ADDRESSES}/${id}/set-default`, {
        method: 'PATCH',
      });
      return response.data;
    } catch (error) {

      throw error;
    }
  }
}

export const addressService = new AddressService(); 