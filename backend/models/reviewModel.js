const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  ma_nguoi_dung: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  ma_san_pham: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
  so_sao: { type: Number, required: true },
  binh_luan: { type: String, required: true },
  ngay_danh_gia: { type: Date, default: Date.now },
  an_hien: { type: Boolean, default: true },
  phan_hoi: { type: String, default: '' },
  
  // Thông tin biến thể sản phẩm
  mau: { type: String }, // Màu sắc của biến thể
  dung_luong: { type: String }, // Dung lượng của biến thể
  
  // AI Check fields
  ai_check: {
    is_checked: { type: Boolean, default: false },
    is_rejected: { type: Boolean, default: false },
    overall_score: { type: Number, default: 0 },
    spam: {
      is_spam: { type: Boolean, default: false },
      spam_score: { type: Number, default: 0 },
      spam_reasons: [String],
      suggestion: String
    },
    toxic: {
      is_toxic: { type: Boolean, default: false },
      toxicity_score: { type: Number, default: 0 },
      toxicity_types: [String],
      severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      suggestion: String
    },
    recommendation: { type: String, enum: ['approve', 'reject', 'review'], default: 'approve' },
    rejection_reasons: [String], // Lý do từ chối cụ thể
    thresholds: { // Ngưỡng điểm số được sử dụng
      spam_threshold: { type: Number, default: 70 },
      toxic_threshold: { type: Number, default: 70 },
      overall_threshold: { type: Number, default: 75 }
    },
    checked_at: Date,
    checked_by: { type: String, default: 'ai_system' }
  },
  
  // Moderation fields
  moderation_status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'flagged'], 
    default: 'pending' 
  },
  moderation_note: String,
  moderated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  moderated_at: Date
});

module.exports = mongoose.model('Review', reviewSchema); 