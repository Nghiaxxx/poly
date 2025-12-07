const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  id_san_pham: { type: String, required: true },
  hinh: { type: [String], default: [] },
  gia: { type: Number, required: true, min: 0 },
  gia_goc: { type: Number, min: 0, default: 0 },
  dung_luong: { type: String, default: "" },
  mau: { type: String, default: "" },
  ram: { type: String, default: "" },
  phien_ban: { type: String, default: "" },
  so_luong_hang: { type: Number, min: 0, default: 0 },
  an_hien: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model("Variant", variantSchema);
