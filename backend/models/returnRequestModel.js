const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  // Thêm field để lưu trữ các sản phẩm được chọn trả hàng
  selectedProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: String,
    image: String,
    colorName: String
  }],
  reason: {
    type: String,
    required: true,
    enum: [
      'Thiếu hàng',
      'Người bán gửi sai hàng',
      'Hàng bể vỡ',
      'Hàng lỗi, không hoạt động',
      'Hàng hết hạn sử dụng',
      'Khác với mô tả',
      'Hàng đã qua sử dụng',
      'Tôi không còn muốn sử dụng sản phẩm',
      'Sản phẩm bị lỗi/hỏng',
      'Sản phẩm không đúng mô tả',
      'Tôi muốn đổi sang sản phẩm khác'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  email: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  refundAmount: {
    type: Number,
    required: true
  },
  refundMethod: {
    type: String,
    required: true
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ userId: 1 });
returnRequestSchema.index({ 'selectedProducts.productId': 1 });
returnRequestSchema.index({ 'selectedProducts.variantId': 1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema); 