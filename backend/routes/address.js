const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Lấy tất cả địa chỉ của user
router.get('/user/:userId', addressController.getAddressesByUser);

// Tạo địa chỉ mới
router.post('/', addressController.createAddress);

// Cập nhật địa chỉ
router.put('/:id', addressController.updateAddress);

// Xóa địa chỉ
router.delete('/:id', addressController.deleteAddress);

// Set địa chỉ làm mặc định
router.patch('/:id/set-default', addressController.setDefaultAddress);

module.exports = router; 