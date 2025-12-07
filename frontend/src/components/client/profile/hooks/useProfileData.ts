import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { fetchApi, API_ENDPOINTS } from '@/config/api';
import { setUser } from '@/store/userSlice';

export interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  avatar: string;
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function useProfileData() {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState<FormData>({
    name: user?.TenKH || "",
    email: user?.email || "",
    phoneNumber: user?.Sdt || "",
    gender: user?.gioi_tinh || "",
    dateOfBirth: user?.sinh_nhat || "",
    avatar: user?.avatar || "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  // Date of birth state
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      let day = "",
        month = "",
        year = "";
      if (user.sinh_nhat) {
        const [y, m, d] = user.sinh_nhat.split("-");
        day = d;
        month = m;
        year = y;
      }
      setDobDay(day);
      setDobMonth(month);
      setDobYear(year);
      setFormData({
        name: user.TenKH || "",
        email: user.email || "",
        phoneNumber: user.Sdt || "",
        gender: user.gioi_tinh || "",
        dateOfBirth: user.sinh_nhat || "",
        avatar: "", // Reset avatar to empty string when user changes
      });
      setAvatarFile(null); // Reset avatar file
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, gender: e.target.value }));
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    type: "day" | "month" | "year"
  ) => {
    let newDay = dobDay,
      newMonth = dobMonth,
      newYear = dobYear;
    if (type === "day") newDay = e.target.value;
    if (type === "month") newMonth = e.target.value;
    if (type === "year") newYear = e.target.value;
    setDobDay(newDay);
    setDobMonth(newMonth);
    setDobYear(newYear);
    if (newDay && newMonth && newYear) {
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: `${newYear}-${newMonth.padStart(2, "0")}-${newDay.padStart(
          2,
          "0"
        )}`,
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSaveInfo = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    
    try {
      const formPayload = new FormData();
      formPayload.append("TenKH", formData.name);
      formPayload.append("Sdt", formData.phoneNumber);
      formPayload.append("gioi_tinh", formData.gender);
      formPayload.append("sinh_nhat", formData.dateOfBirth);
      if (avatarFile) {
        formPayload.append("avatar", avatarFile);
      }

      const response = await fetchApi(API_ENDPOINTS.UPDATE_USER, {
        method: "PUT",
        body: formPayload,
      });

      if (response && response.user) {
        const updatedUser = response.user;
        dispatch(setUser(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSuccessMessage("Cập nhật thông tin thành công!");
      } else {
        setErrorMessage(response?.message || "Cập nhật thông tin thất bại.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Có lỗi xảy ra khi cập nhật thông tin.");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: string) => {
    switch (field) {
      case "currentPassword":
        setShowCurrentPassword((prev) => !prev);
        break;
      case "newPassword":
        setShowNewPassword((prev) => !prev);
        break;
      case "confirmNewPassword":
        setShowConfirmNewPassword((prev) => !prev);
        break;
      default:
        break;
    }
  };

  const handleChangePassword = async () => {
    setPasswordSuccessMessage("");
    setPasswordErrorMessage("");

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (newPassword.length < 8) {
      setPasswordErrorMessage("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      const response = await fetchApi(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response && response.message) {
        setPasswordSuccessMessage(response.message);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        setPasswordErrorMessage(response.message || "Đổi mật khẩu thất bại.");
      }
    } catch (err: any) {
      setPasswordErrorMessage(err.message || "Có lỗi xảy ra khi đổi mật khẩu.");
    }
  };

  return {
    user,
    formData,
    avatarFile,
    successMessage,
    errorMessage,
    passwordForm,
    showCurrentPassword,
    showNewPassword,
    showConfirmNewPassword,
    passwordSuccessMessage,
    passwordErrorMessage,
    dobDay,
    dobMonth,
    dobYear,
    handleChange,
    handleGenderChange,
    handleDateChange,
    handleAvatarChange,
    handleSaveInfo,
    handlePasswordChange,
    togglePasswordVisibility,
    handleChangePassword,
  };
} 