const express = require('express');
const router = express.Router();
const returnRequestController = require('../controllers/returnRequestController');

// Tạo yêu cầu trả hàng mới
router.post('/', returnRequestController.createReturnRequest);

// Lấy danh sách yêu cầu trả hàng của user
router.get('/user/:userId', returnRequestController.getUserReturnRequests);

// Lấy tất cả yêu cầu trả hàng (cho admin)
router.get('/', returnRequestController.getAllReturnRequests);

// Lấy chi tiết yêu cầu trả hàng
router.get('/:requestId', returnRequestController.getReturnRequest);

// Cập nhật trạng thái yêu cầu trả hàng (cho admin)
router.put('/:requestId/status', returnRequestController.updateReturnRequestStatus);

module.exports = router; 