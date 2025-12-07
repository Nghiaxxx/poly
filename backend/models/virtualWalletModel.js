const mongoose = require('mongoose');

const viSchema = new mongoose.Schema({
  Id_nguoi_dung: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  So_tien: { type: Number, default: 0 }
});

viSchema.index({ Id_nguoi_dung: 1 }, { unique: true });

// Chỉ định tên collection chính xác: 'Vi' (không thêm 's')
module.exports = mongoose.model('Vi', viSchema, 'Vi'); 