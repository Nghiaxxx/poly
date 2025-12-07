const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    Logo: { type: String, default: '' },
    Banner: { type: String, default: '' },
    Page: { type: String, default: '' },
    So_dien_thoai: { type: String, default: '' },
    Thong_bao: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("settings", settingSchema); 