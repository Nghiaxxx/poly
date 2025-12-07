const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { verifyToken, verifyAdmin } = require('../controllers/userController');

// Route cho người dùng
router.get('/apply/:code', voucherController.applyVoucher);
router.get('/check/:code', voucherController.checkVoucherCode);
router.get('/popup', voucherController.getPopupVoucher); // Route cho popup voucher
router.get('/public/:categoryId', voucherController.getPublicVouchersByCategory); // Route cho voucher công khai theo danh mục
router.post('/use/:code', voucherController.useVoucher); // Route cho sử dụng voucher

// Routes cho admin (cần authentication)
router.route('/')
    .get(verifyToken, verifyAdmin, voucherController.getAllVouchers)    // Lấy tất cả voucher
    .post(verifyToken, verifyAdmin, voucherController.createVoucher);   // Tạo voucher mới

router.route('/:id')
    .get(verifyToken, verifyAdmin, voucherController.getVoucherById)     // Lấy voucher theo ID
    .put(verifyToken, verifyAdmin, voucherController.updateVoucher)      // Cập nhật voucher
    .delete(verifyToken, verifyAdmin, voucherController.deleteVoucher); // Xóa voucher


// UserVoucher routes
router.post('/user-voucher', voucherController.createUserVoucher);
router.get('/user-voucher/:user_email', voucherController.getUserVouchers);
router.put('/user-voucher/use/:id', voucherController.useUserVoucher);

module.exports = router; 