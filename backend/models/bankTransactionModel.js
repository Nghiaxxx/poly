const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  transactionID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  transactionDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    // index: true
  },
  bankCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  matchedOrder: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tối ưu truy vấn
bankTransactionSchema.index({ accountNumber: 1, transactionDate: -1 });
bankTransactionSchema.index({ status: 1, matchedOrder: 1 });
bankTransactionSchema.index({ createdAt: -1 });

// Middleware để tự động cập nhật updatedAt
bankTransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method để tìm giao dịch chưa được xử lý
bankTransactionSchema.statics.findUnprocessedTransactions = function() {
  return this.find({
    status: 'pending',
    matchedOrder: false
  }).sort({ transactionDate: -1 });
};

// Method để tìm giao dịch theo số tiền và mô tả
bankTransactionSchema.statics.findByAmountAndDescription = function(amount, description) {
  return this.findOne({
    amount: amount,
    description: { $regex: description, $options: 'i' },
    matchedOrder: false
  });
};

module.exports = mongoose.model('BankTransaction', bankTransactionSchema); 