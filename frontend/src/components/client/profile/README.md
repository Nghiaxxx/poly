
src/components/client/profile/
├── ProfileSidebar.tsx          # Sidebar navigation
├── ProfileContent.tsx          # Main content container với lazy loading
├── hooks/
│   ├── useProfileData.ts       # Hook quản lý thông tin cá nhân + mật khẩu
│   └── useOrderManagement.ts   # Hook quản lý đơn hàng + trả hàng
├── tabs/
│   ├── AccountInfo.tsx         # Tab thông tin tài khoản
│   ├── AddressManagement.tsx   # Tab địa chỉ (sử dụng AddressManager có sẵn)
│   ├── PasswordChange.tsx      # Tab đổi mật khẩu
│   └── AvatarUpload.tsx       # Tab upload avatar
└── README.md                   # File này
