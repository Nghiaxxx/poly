const express = require('express');
const router = express.Router();
const giftVoucherController = require('../controllers/giftVoucherController');

// Tạo gift voucher và gửi email
router.post('/', giftVoucherController.createGiftVoucher);

// Lấy thông tin voucher theo email
router.get('/email/:email', giftVoucherController.getVoucherByEmail);

// Lấy thông tin voucher theo mã
router.get('/code/:code', giftVoucherController.getVoucherByCode);

// Gửi lại email voucher
router.post('/resend-email/:email', giftVoucherController.resendVoucherEmail);

// Lấy tất cả gift vouchers (cho admin)
router.get('/', giftVoucherController.getAllGiftVouchers);

// Vô hiệu hóa voucher
router.patch('/:id/disable', giftVoucherController.disableVoucher);

module.exports = router; 