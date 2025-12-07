const mongoose = require('mongoose');

const napTienSchema = new mongoose.Schema({
  Id_vi: { type: mongoose.Schema.Types.ObjectId, ref: 'Vi', required: true },
  So_tien: { type: Number, required: true },
  Ngay_nap_tien: { type: Date, default: Date.now }
});

napTienSchema.index({ Id_vi: 1, Ngay_nap_tien: -1 });

// Chỉ định tên collection chính xác: 'Nap_tien' (không thêm 's')
module.exports = mongoose.model('Nap_tien', napTienSchema, 'Nap_tien'); 