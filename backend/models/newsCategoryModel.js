const mongoose = require('mongoose');

const newsCategorySchema = new mongoose.Schema({
  ten_danh_muc: { type: String, required: true },
});

module.exports = mongoose.model('NewsCategory', newsCategorySchema, 'newscategory'); 