const News = require('../models/newsModel');
const multer = require('multer');
const path = require('path');

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/news/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
    cb(null, true);
  }
}).single('hinh');

exports.uploadImage = (req, res) => {
  upload(req, res, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file ảnh!' });
    }
    // Trả về đường dẫn ảnh
    res.json({ 
      path: `/images/news/${req.file.filename}`
    });
  });
};

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find()
      .populate('id_danh_muc', 'ten_danh_muc')
      .populate('nguoi_dang', 'TenKH')
      .sort({ ngay: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const news = new News(req.body);
    await news.save();
    res.status(201).json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!news) {
      return res.status(404).json({ error: 'Không tìm thấy tin tức' });
    }
    res.json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ error: 'Không tìm thấy tin tức' });
    }
    res.json({ message: 'Đã xóa tin tức thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('id_danh_muc', 'ten_danh_muc')
      .populate('nguoi_dang', 'TenKH');

    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    // Tăng lượt xem
    news.luot_xem += 1;
    await news.save();

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 