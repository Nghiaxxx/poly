const path = require('path');
const multer = require('multer');
const ImageReview = require('../models/imageReviewModel');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/reviews'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

exports.uploadReviewImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { ma_danh_gia, ghi_chu } = req.body;
      if (!ma_danh_gia) return res.status(400).json({ error: 'Thiếu mã đánh giá' });
      const url = `/images/reviews/${req.file.filename}`;
      // Lưu vào DB
      const imageReview = await ImageReview.create({
        ma_danh_gia,
        duong_dan_anh: url,
        ghi_chu: ghi_chu || ''
      });
      res.json(imageReview);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];
