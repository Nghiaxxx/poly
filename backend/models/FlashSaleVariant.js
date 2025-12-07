const mongoose = require('mongoose');
const Variant = require('./variantModel');

const flashSaleVariantSchema = new mongoose.Schema({
  id_flash_sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashSale',
    required: true,
  },
  id_variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variant',
    required: true,
  },
  gia_flash_sale: {
    type: Number,
    required: true,
  },
  phan_tram_giam_gia: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  so_luong: {
    type: Number,
    required: true,
    min: 0,
  },
  da_ban: {
    type: Number,
    default: 0,
    min: 0,
  },
  an_hien: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FlashSaleVariant', flashSaleVariantSchema, 'flashsalebienthe'); 