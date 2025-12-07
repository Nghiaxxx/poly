import React from 'react';
import { getImageUrl } from '@/config/api';
import useProfileData from '../hooks/useProfileData';

export default function AvatarUpload() {
  const {
    formData,
    successMessage,
    errorMessage,
    handleAvatarChange,
    handleSaveInfo,
  } = useProfileData();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ảnh đại diện</h2>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 text-sm text-blue-700">
        Hình đại diện phải ở định dạng GIF hoặc JPEG có kích thước tối đa là
        20 KB
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center">
          {formData.avatar ? (
            <img
              src={getImageUrl(formData.avatar)}
              alt="Avatar"
              className="object-cover w-full h-full"
            />
          ) : (
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M10 14v4m-4 0h8m-1 0H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2H7a2 2 0 01-2-2z"
              ></path>
            </svg>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/gif"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleAvatarChange}
        />
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={handleSaveInfo}
        >
          Tải lên
        </button>
      </div>
      {successMessage && (
        <div className="mt-4 text-green-600 text-center">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 text-red-600 text-center">{errorMessage}</div>
      )}
    </div>
  );
} 