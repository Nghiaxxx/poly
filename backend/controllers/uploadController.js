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

exports.uploadNewsImage = (req, res) => {
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