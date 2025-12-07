const mongoose = require('mongoose');

const imageReviewSchema = new mongoose.Schema({
  ma_danh_gia: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  duong_dan_anh: { type: String, required: true },
  ghi_chu: { type: String },
});

module.exports = mongoose.model('ImageReview', imageReviewSchema); 