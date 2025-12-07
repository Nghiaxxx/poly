const express = require('express');
const router = express.Router();
const bankTransactionController = require('../controllers/bankTransactionController');

// GET /api/bank-transactions - Lấy tất cả giao dịch
router.get('/', bankTransactionController.getAllTransactions);

// GET /api/bank-transactions/stats - Lấy thống kê giao dịch
router.get('/stats', bankTransactionController.getTransactionStats);

// GET /api/bank-transactions/:id - Lấy giao dịch theo ID
router.get('/:id', bankTransactionController.getTransactionById);

// POST /api/bank-transactions/fetch - Lấy lịch sử giao dịch từ API ngân hàng
router.post('/fetch', bankTransactionController.fetchBankTransactions);

// POST /api/bank-transactions/auto-match - Tự động match giao dịch với đơn hàng
router.post('/auto-match', bankTransactionController.autoMatchTransactions);

// POST /api/bank-transactions/manual-match - Match thủ công giao dịch với đơn hàng
router.post('/manual-match', bankTransactionController.manualMatchTransaction);

// POST /api/bank-transactions/check-description - Kiểm tra giao dịch theo description
router.post('/check-description', bankTransactionController.checkTransactionByDescription);

// PUT /api/bank-transactions/:id/status - Cập nhật trạng thái giao dịch
router.put('/:id/status', bankTransactionController.updateTransactionStatus);

// DELETE /api/bank-transactions/:id - Xóa giao dịch
router.delete('/:id', bankTransactionController.deleteTransaction);

module.exports = router; 