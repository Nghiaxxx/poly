import React from 'react';
import useProfileData from '../hooks/useProfileData';

export default function PasswordChange() {
  const {
    passwordForm,
    showCurrentPassword,
    showNewPassword,
    showConfirmNewPassword,
    passwordSuccessMessage,
    passwordErrorMessage,
    handlePasswordChange,
    togglePasswordVisibility,
    handleChangePassword,
  } = useProfileData();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Đổi mật khẩu</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm text-yellow-700">
        Lưu ý: Mật khẩu phải có tối thiểu 8 ký tự bao gồm chữ, số và các ký
        tự đặc biệt
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mật khẩu cũ:
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => togglePasswordVisibility("currentPassword")}
            >
              {showCurrentPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 100-6 3 3 0 000 6z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mật khẩu mới:
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => togglePasswordVisibility("newPassword")}
            >
              {showNewPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.065 7.5-.241.85-1.041 1.595-1.743 2.115M17.25 12L20.25 12"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Xác nhận mật khẩu:
          </label>
          <div className="relative">
            <input
              type={showConfirmNewPassword ? "text" : "password"}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
              name="confirmNewPassword"
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => togglePasswordVisibility("confirmNewPassword")}
            >
              {showConfirmNewPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.065 7.5-.241.85-1.041 1.595-1.743 2.115M17.25 12L20.25 12"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {passwordSuccessMessage && (
        <div className="mt-4 text-green-600 text-center">
          {passwordSuccessMessage}
        </div>
      )}
      {passwordErrorMessage && (
        <div className="mt-4 text-red-600 text-center">
          {passwordErrorMessage}
        </div>
      )}
      <div className="mt-6 text-center">
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          onClick={handleChangePassword}
        >
          Đổi mật khẩu
        </button>
      </div>
    </div>
  );
} 