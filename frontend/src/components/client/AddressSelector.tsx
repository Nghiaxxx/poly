"use client";

import React, { useState, useEffect } from 'react';
import { addressService, Address } from '@/services/addressService';

interface AddressSelectorProps {
  userId: string;
  selectedAddressId?: string;
  onAddressSelect: (address: Address) => void;
  showAddNew?: boolean;
  onAddNew?: () => void;
}

export default function AddressSelector({ 
  userId, 
  selectedAddressId, 
  onAddressSelect, 
  showAddNew = false,
  onAddNew 
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await addressService.getAddressesByUser(userId);
      setAddresses(data);
      
      // Nếu chưa chọn địa chỉ và có địa chỉ mặc định, tự động chọn
      if (!selectedAddressId && data.length > 0) {
        const defaultAddress = data.find(addr => addr.isDefault);
        if (defaultAddress) {
          onAddressSelect(defaultAddress);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải địa chỉ...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
        <button 
          onClick={loadAddresses}
          className="ml-2 text-blue-600 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Bạn chưa có địa chỉ nào.
        {showAddNew && onAddNew && (
          <button
            onClick={onAddNew}
            className="ml-2 text-blue-600 hover:underline"
          >
            Thêm địa chỉ mới
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Chọn địa chỉ giao hàng</h3>
      
      {addresses.map((address) => (
        <div
          key={address._id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selectedAddressId === address._id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleAddressSelect(address)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="selectedAddress"
                  checked={selectedAddressId === address._id}
                  onChange={() => handleAddressSelect(address)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="font-medium text-gray-900">
                  {address.name}
                </span>
                <span className="text-gray-500">
                  (+84) {address.phone.replace(/^0/, '')}
                </span>
                {address.isDefault && (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                    Mặc định
                  </span>
                )}
              </div>
              
              <div className="text-gray-700 ml-6">
                {address.address}, {address.district}, {address.province}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {showAddNew && onAddNew && (
        <button
          onClick={onAddNew}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          + Thêm địa chỉ mới
        </button>
      )}
    </div>
  );
} 