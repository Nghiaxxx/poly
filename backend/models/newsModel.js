const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  tieu_de: { type: String, required: true },
  slug: { type: String, required: true },
  mo_ta: String,
  hinh: String,
  ngay: Date,
  noi_dung: String,
  luot_xem: { type: Number, default: 0 },
  hot: { type: Boolean, default: false },
  an_hien: { type: Boolean, default: true },
  nguoi_dang: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  id_danh_muc: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsCategory' },
});

module.exports = mongoose.model('News', newsSchema, 'news'); 