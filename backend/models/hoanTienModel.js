const mongoose = require('mongoose');

const hoanTienSchema = new mongoose.Schema({
  Id_vi: { type: mongoose.Schema.Types.ObjectId, ref: 'Vi', required: true },
  So_tien: { type: Number, required: true },
  Ngay_hoan_tien: { type: Date, default: Date.now },
  returnRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReturnRequest' }, // Liên kết với yêu cầu trả hàng
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Liên kết với đơn hàng
  refundReason: { type: String, default: 'Hoàn tiền từ yêu cầu trả hàng' }, // Lý do hoàn tiền
  refundMethod: { type: String, enum: ['wallet', 'momo', 'atm', 'cod'], default: 'wallet' } // Phương thức hoàn tiền
});

hoanTienSchema.index({ Id_vi: 1, Ngay_hoan_tien: -1 });

// Chỉ định tên collection chính xác: 'Hoan_tien' (không thêm 's')
module.exports = mongoose.model('Hoan_tien', hoanTienSchema, 'Hoan_tien'); 