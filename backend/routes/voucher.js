const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/check-code', voucherController.checkVoucherCode);
router.post('/apply', voucherController.applyVoucher);
router.post('/use', voucherController.useVoucher);
router.get('/popup', voucherController.getPopupVoucher);


// Admin routes
router.get('/', protect, admin, voucherController.getAllVouchers);
router.get('/:id', protect, admin, voucherController.getVoucherById);
router.post('/', protect, admin, voucherController.createVoucher);
router.put('/:id', protect, admin, voucherController.updateVoucher);
router.delete('/:id', protect, admin, voucherController.deleteVoucher);

// User voucher routes
router.post('/user-voucher', protect, voucherController.createUserVoucher);
router.get('/user-voucher/:userId', protect, voucherController.getUserVouchers);
router.put('/user-voucher/:id/use', protect, voucherController.useUserVoucher);

// Route tự động quét voucher đã sử dụng (có thể gọi từ frontend hoặc cron job)
router.post('/auto-scan', voucherController.autoScanUsedVouchers);

module.exports = router; 