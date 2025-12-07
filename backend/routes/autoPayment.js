const express = require('express');
const router = express.Router();
const autoPaymentController = require('../controllers/autoPaymentController');

// POST /api/auto-payment/start - Bắt đầu auto payment processor
router.post('/start', autoPaymentController.startProcessor);

// POST /api/auto-payment/stop - Dừng auto payment processor
router.post('/stop', autoPaymentController.stopProcessor);

// GET /api/auto-payment/status - Lấy trạng thái processor
router.get('/status', autoPaymentController.getProcessorStatus);

// PUT /api/auto-payment/config - Cập nhật cấu hình processor
router.put('/config', autoPaymentController.updateProcessorConfig);

// POST /api/auto-payment/run-once - Chạy xử lý một lần
router.post('/run-once', autoPaymentController.runOnce);

// GET /api/auto-payment/logs - Lấy logs gần đây
router.get('/logs', autoPaymentController.getRecentLogs);

module.exports = router; 