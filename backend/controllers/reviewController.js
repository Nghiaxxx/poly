const Review = require('../models/reviewModel');
const ImageReview = require('../models/imageReviewModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const mongoose = require('mongoose');
const aiCommentChecker = require('../services/aiCommentChecker');

process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', function (err) {
  console.error('Unhandled Rejection:', err);
});

// Hàm kiểm tra user đã mua sản phẩm chưa
const checkUserPurchasedProduct = async (userId, productId) => {
  try {
    // Tìm đơn hàng đã thanh toán và hoàn thành (delivered) chứa sản phẩm này
    const order = await Order.findOne({
      'customerInfo.userId': userId,
      'items.productId': productId,
      paymentStatus: 'paid',
      orderStatus: 'delivered'
    });
    
    return !!order; // Trả về true nếu tìm thấy đơn hàng, false nếu không
  } catch (error) {
    console.error('Error checking user purchase:', error);
    return false;
  }
};

// Thêm review mới (có thể kèm ảnh)
exports.createReview = async (req, res) => {
  try {
    const { ma_nguoi_dung, ma_san_pham, so_sao, binh_luan, images, parent_id, mau, dung_luong } = req.body;
    if (!ma_nguoi_dung || !ma_san_pham || !so_sao || !binh_luan) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Chỉ kiểm tra mua hàng khi đây là review gốc (không phải reply)
    if (!parent_id) {
      // Kiểm tra xem user đã mua sản phẩm chưa
      const hasPurchased = await checkUserPurchasedProduct(ma_nguoi_dung, ma_san_pham);
      if (!hasPurchased) {
        return res.status(403).json({ 
          error: 'Không thể đánh giá',
          message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng' 
        });
      }
    }

    // Kiểm tra độ dài bình luận
    const lengthValidation = aiCommentChecker.validateCommentLength(binh_luan);
    if (!lengthValidation.isValid) {
      return res.status(400).json({ error: lengthValidation.reason });
    }

    // Kiểm tra tần suất bình luận
    const recentComments = await Review.find({ 
      ma_nguoi_dung, 
      ngay_danh_gia: { $gte: new Date(Date.now() - 60 * 60 * 1000) } 
    });
    
    const frequencyCheck = aiCommentChecker.checkCommentFrequency(ma_nguoi_dung, recentComments);
    if (frequencyCheck.isExcessive) {
      return res.status(429).json({ error: frequencyCheck.reason, suggestion: frequencyCheck.suggestion });
    }

    // Lấy thông tin user và product để AI check
    const [user, product] = await Promise.all([
      User.findById(ma_nguoi_dung).select('TenKH email'),
      Product.findById(ma_san_pham).select('TenSP category')
    ]);

    // AI check bình luận
    console.log('🚀 [REVIEW CONTROLLER] Bắt đầu gọi AI check cho bình luận...');
    const aiCheckStartTime = Date.now();
    
    const aiCheckResult = await aiCommentChecker.checkComment(binh_luan, user, product);
    
    const aiCheckTime = Date.now() - aiCheckStartTime;
    console.log(`⏱️ [REVIEW CONTROLLER] AI check hoàn thành trong ${aiCheckTime}ms`);
    console.log('📋 [REVIEW CONTROLLER] Kết quả AI check:', {
      isRejected: aiCheckResult.isRejected,
      overallScore: aiCheckResult.overallScore,
      recommendation: aiCheckResult.recommendation,
      rejectionReasons: aiCheckResult.rejectionReasons
    });
    
    // Tạo review với thông tin AI check
    const reviewData = {
      ma_nguoi_dung,
      ma_san_pham,
      so_sao,
      binh_luan,
      ngay_danh_gia: new Date(),
      mau: mau || undefined, // Thêm màu sắc nếu có
      dung_luong: dung_luong || undefined, // Thêm dung lượng nếu có
      ai_check: {
        is_checked: true,
        is_rejected: aiCheckResult.isRejected,
        overall_score: aiCheckResult.overallScore,
        spam: aiCheckResult.spam,
        toxic: aiCheckResult.toxic,
        recommendation: aiCheckResult.recommendation,
        rejection_reasons: aiCheckResult.rejectionReasons || [],
        thresholds: aiCheckResult.thresholds || {
          spam_threshold: 70,
          toxic_threshold: 70,
          overall_threshold: 75
        },
        checked_at: new Date(),
        checked_by: 'ai_system'
      },
      moderation_status: aiCheckResult.isRejected ? 'rejected' : 'pending',
      moderation_note: aiCheckResult.isRejected ? 
        `AI đã từ chối: ${aiCheckResult.rejectionReasons?.join(', ') || 'Không xác định'}` : 
        'Chờ duyệt bởi admin'
    };

    const review = await Review.create(reviewData);

    // Nếu AI từ chối, trả về lý do
    if (aiCheckResult.isRejected) {
      return res.status(400).json({
        error: 'Bình luận bị từ chối bởi AI',
        details: {
          spam: aiCheckResult.spam,
          toxic: aiCheckResult.toxic,
          suggestion: aiCheckResult.spam.suggestion || aiCheckResult.toxic.suggestion
        }
      });
    }

    // Nếu có ảnh, upload từng ảnh
    if (images && images.length) {
      await ImageReview.insertMany(images.map(url => ({
        ma_danh_gia: review._id,
        duong_dan_anh: url,
        ghi_chu: ''
      })));
    }

    res.json({ 
      success: true, 
      reviewId: review._id,
      aiCheck: aiCheckResult,
      message: aiCheckResult.recommendation === 'approve' ? 
        'Bình luận đã được gửi và chờ duyệt' : 
        'Bình luận cần được admin xem xét'
    });
  } catch (err) {
    console.error('Lỗi khi tạo review:', err);
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả review (và ảnh) của 1 sản phẩm (chỉ review gốc, không nhiều lớp)
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { ma_san_pham } = req.query;
    if (!ma_san_pham) return res.status(400).json({ error: 'Thiếu mã sản phẩm' });

    // Chỉ lấy review gốc (không có parent_id) và KHÔNG lấy bình luận bị từ chối
    const reviews = await Review.find({ 
      ma_san_pham, 
      an_hien: true,
      moderation_status: { $ne: 'rejected' } // KHÔNG lấy bình luận bị từ chối
    })
      .populate('ma_nguoi_dung', 'TenKH email avatar')
      .sort({ ngay_danh_gia: -1 }) // Sắp xếp theo ngày gần nhất đến xa nhất
      .lean();

    const reviewIds = reviews.map(r => r._id);
    const images = await ImageReview.find({ ma_danh_gia: { $in: reviewIds } }).lean();

    // Gắn ảnh vào review
    const reviewMap = {};
    reviews.forEach(r => reviewMap[r._id] = { ...r, images: [] });
    images.forEach(img => {
      if (reviewMap[img.ma_danh_gia]) {
        reviewMap[img.ma_danh_gia].images.push(img);
      }
    });
    res.json(Object.values(reviewMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả review (và ảnh) của 1 user
exports.getReviewsByUser = async (req, res) => {
  try {
    const { ma_nguoi_dung } = req.query;
    if (!ma_nguoi_dung) return res.status(400).json({ error: 'Thiếu mã người dùng' });

    const reviews = await Review.find({ 
      ma_nguoi_dung,
      moderation_status: { $ne: 'rejected' } // KHÔNG lấy bình luận bị từ chối
    })
      .populate('ma_san_pham', 'TenSP hinh')
      .populate('ma_nguoi_dung', 'TenKH email avatar')
      .sort({ ngay_danh_gia: -1 }) // Sắp xếp theo ngày gần nhất đến xa nhất
      .lean();

    const reviewIds = reviews.map(r => r._id);
    const images = await ImageReview.find({ ma_danh_gia: { $in: reviewIds } }).lean();

    // Gắn ảnh vào review
    const reviewMap = {};
    reviews.forEach(r => reviewMap[r._id] = { ...r, images: [] });
    images.forEach(img => {
      if (reviewMap[img.ma_danh_gia]) {
        reviewMap[img.ma_danh_gia].images.push(img);
      }
    });
    res.json(Object.values(reviewMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 

// Lấy toàn bộ review cho admin
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('ma_nguoi_dung', 'TenKH email avatar')
      .populate('ma_san_pham', 'TenSP')
      .sort({ ngay_danh_gia: -1 }) // Sắp xếp theo ngày gần nhất đến xa nhất
      .lean();
    
    console.log('Reviews with populated data:', reviews.map(r => ({
      id: r._id,
      user: r.ma_nguoi_dung,
      product: r.ma_san_pham,
      date: r.ngay_danh_gia
    })));
    
    const reviewIds = reviews.map(r => r._id);
    const images = await ImageReview.find({ ma_danh_gia: { $in: reviewIds } }).lean();
    const reviewMap = {};
    reviews.forEach(r => reviewMap[r._id] = { ...r, images: [] });
    images.forEach(img => {
      if (reviewMap[img.ma_danh_gia]) {
        reviewMap[img.ma_danh_gia].images.push(img);
      }
    });
    res.json(Object.values(reviewMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 

// Cập nhật trạng thái ẩn/hiện bình luận
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy review' });
    review.an_hien = !review.an_hien;
    await review.save();
    res.json({ success: true, an_hien: review.an_hien });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật phản hồi bình luận
exports.replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { phan_hoi } = req.body;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy review' });
    review.phan_hoi = phan_hoi;
    await review.save();
    res.json({ success: true, phan_hoi: review.phan_hoi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa review (chỉ admin)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy review' });
    
    // Xóa ảnh liên quan
    await ImageReview.deleteMany({ ma_danh_gia: id });
    
    // Xóa review
    await Review.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'Đã xóa review thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== AI MODERATION FUNCTIONS =====

// Lấy danh sách review cần moderation
exports.getReviewsForModeration = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (status && status !== 'all') {
      filter.moderation_status = status;
    }
    
    const reviews = await Review.find(filter)
      .populate('ma_nguoi_dung', 'TenKH email avatar')
      .populate('ma_san_pham', 'TenSP category')
      .sort({ ngay_danh_gia: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Review.countDocuments(filter);
    
    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy reviews cho moderation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Duyệt review (approve/reject)
exports.moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note, moderatorId } = req.body;
    
    if (!['approve', 'reject', 'flag'].includes(action)) {
      return res.status(400).json({ error: 'Hành động không hợp lệ' });
    }
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy review' });
    }
    
    // Cập nhật trạng thái moderation
    review.moderation_status = action === 'approve' ? 'approved' : 
                               action === 'reject' ? 'rejected' : 'flagged';
    review.moderation_note = note || '';
    review.moderated_by = moderatorId;
    review.moderated_at = new Date();
    
    // Nếu approve, hiển thị review
    if (action === 'approve') {
      review.an_hien = true;
    }
    
    await review.save();
    
    res.json({
      success: true,
      message: `Review đã được ${action === 'approve' ? 'duyệt' : action === 'reject' ? 'từ chối' : 'đánh dấu'}`,
      review: {
        id: review._id,
        moderation_status: review.moderation_status,
        moderated_at: review.moderated_at
      }
    });
  } catch (err) {
    console.error('Lỗi khi moderate review:', err);
    res.status(500).json({ error: err.message });
  }
};

// Chạy lại AI check cho review
exports.recheckReviewWithAI = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id)
      .populate('ma_nguoi_dung', 'TenKH email')
      .populate('ma_san_pham', 'TenSP category');
    
    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy review' });
    }
    
    // Chạy lại AI check
    console.log('🔄 [REVIEW CONTROLLER] Bắt đầu recheck AI cho review:', {
      reviewId: id,
      comment: review.binh_luan.substring(0, 100) + (review.binh_luan.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    
    const recheckStartTime = Date.now();
    const aiCheckResult = await aiCommentChecker.checkComment(
      review.binh_luan,
      review.ma_nguoi_dung,
      review.ma_san_pham
    );
    
    const recheckTime = Date.now() - recheckStartTime;
    console.log(`⏱️ [REVIEW CONTROLLER] Recheck AI hoàn thành trong ${recheckTime}ms`);
    console.log('📋 [REVIEW CONTROLLER] Kết quả recheck AI:', {
      isRejected: aiCheckResult.isRejected,
      overallScore: aiCheckResult.overallScore,
      recommendation: aiCheckResult.recommendation,
      rejectionReasons: aiCheckResult.rejectionReasons
    });
    
    // Cập nhật kết quả AI check
    review.ai_check = {
      is_checked: true,
      is_rejected: aiCheckResult.isRejected,
      overall_score: aiCheckResult.overallScore,
      spam: aiCheckResult.spam,
      toxic: aiCheckResult.toxic,
      recommendation: aiCheckResult.recommendation,
      rejection_reasons: aiCheckResult.rejectionReasons || [],
      thresholds: aiCheckResult.thresholds || {
        spam_threshold: 70,
        toxic_threshold: 70,
        overall_threshold: 75
      },
      checked_at: new Date(),
      checked_by: 'ai_system'
    };
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Đã chạy lại AI check',
      aiCheck: aiCheckResult
    });
  } catch (err) {
    console.error('Lỗi khi recheck review với AI:', err);
    res.status(500).json({ error: err.message });
  }
};

// Lấy thống kê moderation
exports.getModerationStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$moderation_status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const aiCheckStats = await Review.aggregate([
      {
        $match: { 'ai_check.is_checked': true }
      },
      {
        $group: {
          _id: '$ai_check.recommendation',
          count: { $sum: 1 },
          avgScore: { $avg: '$ai_check.overall_score' }
        }
      }
    ]);
    
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ moderation_status: 'pending' });
    
    res.json({
      totalReviews,
      pendingReviews,
      moderationStats: stats,
      aiCheckStats,
      summary: {
        approved: stats.find(s => s._id === 'approved')?.count || 0,
        rejected: stats.find(s => s._id === 'rejected')?.count || 0,
        flagged: stats.find(s => s._id === 'flagged')?.count || 0,
        pending: pendingReviews
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy thống kê moderation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Bulk moderation - xử lý nhiều review cùng lúc
exports.bulkModerateReviews = async (req, res) => {
  try {
    const { reviewIds, action, note, moderatorId } = req.body;
    
    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách review không hợp lệ' });
    }
    
    if (!['approve', 'reject', 'flag'].includes(action)) {
      return res.status(400).json({ error: 'Hành động không hợp lệ' });
    }
    
    const updateData = {
      moderation_status: action === 'approve' ? 'approved' : 
                        action === 'reject' ? 'rejected' : 'flagged',
      moderation_note: note || '',
      moderated_by: moderatorId,
      moderated_at: new Date()
    };
    
    if (action === 'approve') {
      updateData.an_hien = true;
    }
    
    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      updateData
    );
    
    res.json({
      success: true,
      message: `Đã ${action === 'approve' ? 'duyệt' : action === 'reject' ? 'từ chối' : 'đánh dấu'} ${result.modifiedCount} review`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Lỗi khi bulk moderate reviews:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kiểm tra xem user đã mua sản phẩm chưa
exports.checkUserPurchase = async (req, res) => {
  try {
    const { userId, productId } = req.query;
    
    if (!userId || !productId) {
      return res.status(400).json({ error: 'Thiếu thông tin userId hoặc productId' });
    }

    const hasPurchased = await checkUserPurchasedProduct(userId, productId);
    
    res.json({ 
      hasPurchased,
      message: hasPurchased 
        ? 'Bạn đã mua sản phẩm này và có thể đánh giá' 
        : 'Bạn cần mua và nhận hàng để có thể đánh giá sản phẩm này'
    });
  } catch (error) {
    console.error('Error checking user purchase:', error);
    res.status(500).json({ error: 'Lỗi khi kiểm tra tình trạng mua hàng' });
  }
}; 

// Lấy thống kê đánh giá của sản phẩm (trung bình sao, số lượng đánh giá)
exports.getProductRatingStats = async (req, res) => {
  try {
    const { ma_san_pham } = req.query;
    if (!ma_san_pham) return res.status(400).json({ error: 'Thiếu mã sản phẩm' });

    // Lấy tất cả review hiển thị và không bị từ chối
    const reviews = await Review.find({ 
      ma_san_pham, 
      an_hien: true,
      moderation_status: { $ne: 'rejected' }
    }).select('so_sao');

    if (reviews.length === 0) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      });
    }

    // Tính trung bình sao
    const totalRating = reviews.reduce((sum, review) => sum + review.so_sao, 0);
    const averageRating = totalRating / reviews.length;

    // Thống kê phân bố số sao
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.so_sao] = (ratingDistribution[review.so_sao] || 0) + 1;
    });

    res.json({
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân
      ratingDistribution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 