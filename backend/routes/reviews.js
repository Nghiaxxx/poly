const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Lấy thống kê đánh giá sản phẩm (trung bình sao, số lượng đánh giá) - đặt trước route /
router.get('/stats', reviewController.getProductRatingStats);

// Lấy danh sách review theo mã sản phẩm
router.get('/', reviewController.getReviewsByProduct);

// Thêm review mới
router.post('/', reviewController.createReview);

// Thêm route mới
router.get('/by-user', reviewController.getReviewsByUser);

// Kiểm tra user đã mua sản phẩm chưa
router.get('/check-purchase', reviewController.checkUserPurchase);

// Lấy toàn bộ review cho admin
router.get('/all', reviewController.getAllReviews);

// ===== AI MODERATION ROUTES =====

// Lấy danh sách review cần moderation
router.get('/moderation', reviewController.getReviewsForModeration);

// Lấy thống kê moderation
router.get('/moderation/stats', reviewController.getModerationStats);

// Duyệt review (approve/reject/flag)
router.patch('/:id/moderate', reviewController.moderateReview);

// Chạy lại AI check cho review
router.post('/:id/recheck-ai', reviewController.recheckReviewWithAI);

// Bulk moderation - xử lý nhiều review cùng lúc
router.post('/bulk-moderate', reviewController.bulkModerateReviews);

// Ẩn/hiện bình luận
router.patch('/:id/toggle-hide', reviewController.toggleReviewVisibility);
// Phản hồi bình luận
router.patch('/:id/reply', reviewController.replyToReview);
// Xóa review
router.delete('/:id', reviewController.deleteReview);

module.exports = router; 