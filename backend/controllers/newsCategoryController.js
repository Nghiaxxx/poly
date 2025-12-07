const NewsCategory = require('../models/newsCategoryModel');

exports.getAllNewsCategories = async (req, res) => {
  try {
    const categories = await NewsCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNewsCategory = async (req, res) => {
  try {
    const category = new NewsCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateNewsCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục tin tức' });
    }
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteNewsCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục tin tức' });
    }
    res.json({ message: 'Đã xóa danh mục tin tức thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 