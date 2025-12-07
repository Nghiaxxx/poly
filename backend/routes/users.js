var express = require('express');
var router = express.Router();

const { register, login, verifyToken, verifyAdmin, getUser, getAllUsers, updateUser, upload, changePassword, forgotPassword, googleLogin, deleteUser, toggleUserStatus, toggleUserRole, addUserFromAdmin, updateUserFromAdmin } = require('../controllers/userController');

//Đăng ký
router.post('/register', register);

//Đăng nhập
router.post('/login', login);

//Đăng nhập Google
router.post('/google-login', googleLogin);

//Đăng xuất
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

//Lấy thông tin 1 user theo token
router.get('/userinfo', verifyToken, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Cập nhật thông tin user
router.put('/update', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        await updateUser[1](req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Đổi mật khẩu
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        await changePassword(req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Lấy tất cả users (cần admin quyền)
router.get('/', verifyToken, verifyAdmin, getAllUsers);

// Thêm user mới (cần admin quyền)
router.post('/add', verifyToken, verifyAdmin, addUserFromAdmin);

// Cập nhật user (cần admin quyền)
router.patch('/:id', verifyToken, verifyAdmin, updateUserFromAdmin);

// Xóa user (cần admin quyền)
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

// Toggle trạng thái user (cần admin quyền)
router.patch('/:id/toggle-status', verifyToken, verifyAdmin, toggleUserStatus);

// Toggle role user (cần admin quyền)
router.patch('/:id/toggle-role', verifyToken, verifyAdmin, toggleUserRole);

// Quên mật khẩu
router.post('/forgot-password', forgotPassword);

module.exports = router;
