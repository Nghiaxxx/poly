const mongoose = require('mongoose');

const giftVoucherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  ma_voucher: {
    type: String,
    required: true,
    unique: true
  },
  qua_duoc_chon: {
    type: Number,
    required: true
  },
  da_su_dung: {
    type: Boolean,
    default: false
  },
  email_da_gui: {
    type: Boolean,
    default: false
  },
  email_gui_luc: {
    type: Date
  },
  ngay_tao: {
    type: Date,
    default: Date.now
  },
  het_han: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 năm
  },
  phan_tram: {
    type: Number,
    required: true
  },
  da_vo_hieu_hoa: {
    type: Boolean,
    default: false
  }
});

// Index để tìm kiếm nhanh
giftVoucherSchema.index({ email: 1 });
giftVoucherSchema.index({ phone: 1 });

module.exports = mongoose.model('GiftVoucher', giftVoucherSchema); 