const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userVoucherSchema = new Schema({
  nguoi_dung: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ma_voucher: { type: String, required: true },
  loai: { type: String, enum: ['gift', 'public'], required: true },
  san_pham: { type: String },
  giam_gia: { type: Number },
  phan_tram: { type: Number },
  da_su_dung: { type: Boolean, default: false },
  het_han: { type: Date },
  ngay_tao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserVoucher', userVoucherSchema); 