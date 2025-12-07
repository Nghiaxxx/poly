const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
  ten_su_kien: {
    type: String,
    required: true,
    trim: true,
  },
  thoi_gian_bat_dau: {
    type: Date,
    required: true,
  },
  thoi_gian_ket_thuc: {
    type: Date,
    required: true,
  },
  an_hien: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for FlashSaleVariants
flashSaleSchema.virtual('flashSaleVariants', {
  ref: 'FlashSaleVariant',
  localField: '_id',
  foreignField: 'id_flash_sale',
  justOne: false
});

module.exports = mongoose.model('FlashSale', flashSaleSchema, 'flashsale'); 