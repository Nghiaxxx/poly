const mongoose = require('mongoose');

const luckyWheelResultSchema = new mongoose.Schema({
  user_email: { type: String, required: true },
  voucher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LuckyWheelResult', luckyWheelResultSchema); 