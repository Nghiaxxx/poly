import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import AddressManager from '@/components/client/AddressManager';

export default function AddressManagement() {
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <div>
      {user?._id ? (
        <AddressManager userId={user._id} />
      ) : (
        <div className="text-center py-8 text-gray-500">
          Vui lòng đăng nhập để quản lý địa chỉ
        </div>
      )}
    </div>
  );
} 