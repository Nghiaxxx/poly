import React from 'react';
import useProfileData from '../hooks/useProfileData';

export default function AccountInfo() {
  const {
    formData,
    successMessage,
    errorMessage,
    dobDay,
    dobMonth,
    dobYear,
    handleChange,
    handleGenderChange,
    handleDateChange,
    handleSaveInfo,
  } = useProfileData();

  return (
    <div className="tab-content">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin tài khoản</h2>
        <p className="text-gray-600">Quản lý thông tin profile của bạn để bảo mật tài khoản</p>
      </div>
      
      <form className="profile-form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tên, Họ:
          </label>
          <input
            type="text"
            className="mt-2 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên đầy đủ của bạn"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            E-mail:
          </label>
          <input
            type="email"
            className="mt-2 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-gray-50 text-gray-600 cursor-not-allowed"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly
            placeholder="Email đã được xác thực"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Điện thoại:
          </label>
          <input
            type="text"
            className="mt-2 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Giới tính:
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="gender"
                value="Nam"
                checked={formData.gender === "Nam"}
                onChange={handleGenderChange}
              />{" "}
              Nam
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="gender"
                value="Nữ"
                checked={formData.gender === "Nữ"}
                onChange={handleGenderChange}
              />{" "}
              Nữ
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ngày sinh:
          </label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <select
              className="border border-gray-300 rounded-md shadow-sm p-2"
              value={dobDay}
              onChange={(e) => handleDateChange(e, "day")}
            >
              <option value="">Ngày</option>
              {[...Array(31)].map((_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md shadow-sm p-2"
              value={dobMonth}
              onChange={(e) => handleDateChange(e, "month")}
            >
              <option value="">Tháng</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md shadow-sm p-2"
              value={dobYear}
              onChange={(e) => handleDateChange(e, "year")}
            >
              <option value="">Năm</option>
              {[...Array(100)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium interactive-hover"
            onClick={handleSaveInfo}
          >
            Lưu thông tin
          </button>
        </div>
      </form>
      
      {successMessage && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center success-message">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center error-message">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
} 