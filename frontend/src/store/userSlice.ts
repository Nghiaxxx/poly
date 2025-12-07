import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  user: {
    _id: string;
    TenKH: string;
    email: string;
    Sdt?: string;
    gioi_tinh?: string;
    sinh_nhat?: string;
    dia_chi?: string;
    username?: string;
    avatar?: string;
    role?: string;
    tinh_thanh?: string;
    quan_huyen?: string;
  } | null;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  user: null,
  isLoggedIn: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{
      _id: string;
      TenKH: string;
      email: string;
      Sdt?: string;
      gioi_tinh?: string;
      sinh_nhat?: string;
      dia_chi?: string;
      username?: string;
      avatar?: string;
      role?: string;
      tinh_thanh?: string;
      quan_huyen?: string;
    } | null>) => {
      state.user = action.payload;
      state.isLoggedIn = action.payload !== null;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;

export default userSlice.reducer; 