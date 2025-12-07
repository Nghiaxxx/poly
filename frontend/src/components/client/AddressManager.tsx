"use client";

import React, { useState, useEffect } from 'react';
import { addressService, Address, CreateAddressData, UpdateAddressData } from '@/services/addressService';
import { showConfirmAlert } from '@/utils/sweetAlert';

interface AddressManagerProps {
  userId: string;
}

export default function AddressManager({ userId }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<CreateAddressData>({
    userId,
    name: '',
    phone: '',
    address: '',
    province: '',
    district: '',
    isDefault: false
  });
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch danh sách tỉnh thành
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/?depth=2');
        if (!response.ok) throw new Error('Không lấy được danh sách tỉnh thành');
        const provincesData = await response.json();
        setProvinces(provincesData);
      } catch (error) {

        setProvinces([]);
      }
    };
    
    fetchProvinces();
  }, []);

  // Xử lý khi tỉnh thành thay đổi
  useEffect(() => {
    if (selectedProvinceCode) {
      const selectedProvince = provinces.find(p => p.code === selectedProvinceCode);
      if (selectedProvince && selectedProvince.districts) {
        setDistricts(selectedProvince.districts);
        setFormData(prev => ({ ...prev, district: '' }));
      }
    } else {
      setDistricts([]);
      setFormData(prev => ({ ...prev, district: '' }));
    }
  }, [selectedProvinceCode, provinces]);

  // Load địa chỉ
  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddressesByUser(userId);
      setAddresses(data);
    } catch (error: any) {
      setError(error.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "province") {
      const province = provinces.find(p => p.name === value);
      if (province) {
        setSelectedProvinceCode(province.code);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          district: '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      isDefault: e.target.checked
    }));
  };

  const resetForm = () => {
    setFormData({
      userId,
      name: '',
      phone: '',
      address: '',
      province: '',
      district: '',
      isDefault: false
    });
    setSelectedProvinceCode(null);
    setDistricts([]);
    setEditingAddress(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.phone || !formData.address || !formData.province || !formData.district) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editingAddress) {
        // Update
        await addressService.updateAddress(editingAddress._id, formData);
        setSuccess('Cập nhật địa chỉ thành công!');
      } else {
        // Create
        await addressService.createAddress(formData);
        setSuccess('Thêm địa chỉ thành công!');
      }
      
      resetForm();
      loadAddresses();
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      userId,
      name: address.name,
      phone: address.phone,
      address: address.address,
      province: address.province,
      district: address.district,
      isDefault: address.isDefault
    });
    
    // Set province code để load districts
    const province = provinces.find(p => p.name === address.province);
    if (province) {
      setSelectedProvinceCode(province.code);
    }
    
    setShowAddForm(true);
  };

  const handleDelete = async (addressId: string) => {
    const result = await showConfirmAlert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa địa chỉ này?', 'Xóa', 'Hủy');
    if (!result.isConfirmed) return;
    
    try {
      await addressService.deleteAddress(addressId);
      setSuccess('Xóa địa chỉ thành công!');
      loadAddresses();
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi xóa địa chỉ');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId);
      setSuccess('Đã thiết lập địa chỉ mặc định!');
      loadAddresses();
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi thiết lập địa chỉ mặc định');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Địa chỉ của tôi</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
        >
          + Thêm địa chỉ mới
        </button>
      </div>

      {/* Form thêm/sửa địa chỉ */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ chi tiết *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Số nhà, tên đường, phường/xã..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỉnh thành *
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn tỉnh thành</option>
                  {provinces.map(province => (
                    <option key={province.code} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quận huyện *
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.province}
                >
                  <option value="">Chọn quận huyện</option>
                  {districts.map(district => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                Đặt làm địa chỉ mặc định
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Danh sách địa chỉ */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Địa chỉ</h3>
        
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên!
          </div>
        ) : (
          addresses.map((address) => (
            <div key={address._id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {address.name}
                    </span>
                    <span className="text-gray-500">
                      (+84) {address.phone.replace(/^0/, '')}
                    </span>
                  </div>
                  
                  <div className="text-gray-700 mb-2">
                    {address.address}, {address.district}, {address.province}
                  </div>
                  
                  {address.isDefault && (
                    <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                      Mặc định
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Cập nhật
                  </button>
                  
                  {!address.isDefault && (
                    <>
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Thiết lập mặc định
                      </button>
                      
                      <button
                        onClick={() => handleDelete(address._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 