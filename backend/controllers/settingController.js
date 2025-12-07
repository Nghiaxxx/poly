const settings = require("../models/settingModel");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const checkfile = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Bạn chỉ được upload file ảnh'));
  }
  return cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: checkfile });

// Lấy setting (chỉ lấy 1 bản ghi)
const getSetting = async (req, res) => {
  try {
    const setting = await settings.findOne();
    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

// Cập nhật setting
const updateSetting = async (req, res) => {
  try {
    const updated = await settings.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy setting để cập nhật' });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật setting: ' + error.message });
  }
};

// Upload ảnh
const uploadImageSetting = [upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file được upload' });
  }
  // Đường dẫn public để frontend truy cập
  const imageUrl = `/images/${req.file.filename}`;
  res.status(200).json({ url: imageUrl });
}];

module.exports = { getSetting, updateSetting, uploadImageSetting };
