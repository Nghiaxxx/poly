const variants = require("../models/variantModel");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const getAllVariants = async (req, res) => {
  try {
    // Lấy tất cả variants (không filter an_hien để admin có thể xem)
    const variantList = await variants.find();
    if (!variantList.length) {
      return res.status(404).json({ message: "Không tìm thấy biến thể nào" });
    }
    res.status(200).json(variantList);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách biến thể:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

const getVariantsByProductId = async (req, res) => {
  try {
    const productId = req.params.id;
    // Lấy tất cả variants của sản phẩm (không filter an_hien để admin có thể xem)
    const variantList = await variants.find({ id_san_pham: productId });
    if (!variantList.length) {
      return res.status(404).json({ message: "Không tìm thấy biến thể nào cho sản phẩm này" });
    }
    res.status(200).json(variantList);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách biến thể:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

// API cho client - chỉ trả về variants đang hiện
const getVariantsByProductIdForClient = async (req, res) => {
  try {
    const productId = req.params.id;
    // Chỉ lấy variants đang hiện (an_hien: true) cho client
    const variantList = await variants.find({ 
      id_san_pham: productId, 
      an_hien: { $ne: false } // an_hien !== false (bao gồm true và undefined)
    });
    
    if (!variantList.length) {
      return res.status(404).json({ message: "Không tìm thấy biến thể nào cho sản phẩm này" });
    }
    
    res.status(200).json(variantList);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách biến thể cho client:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

const createVariant = async (req, res) => {
  try {
    if (typeof req.body.so_luong_hang === 'number' && req.body.so_luong_hang < 0) {
      return res.status(400).json({ message: "Số lượng hàng không được âm" });
    }
    const newVariant = new variants(req.body);
    await newVariant.save();
    res.status(201).json(newVariant);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm biến thể: " + error.message });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating variant:', id, 'with data:', req.body);
    
    if (typeof req.body.so_luong_hang === 'number' && req.body.so_luong_hang < 0) {
      return res.status(400).json({ message: "Số lượng hàng không được âm" });
    }
    const updated = await variants.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      console.log('Variant not found:', id);
      return res.status(404).json({ message: "Không tìm thấy biến thể" });
    }
    
    console.log('Variant updated successfully:', updated);
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ message: "Lỗi khi cập nhật biến thể: " + error.message });
  }
};

const toggleVariantVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Toggling visibility for variant:', id);
    
    const variant = await variants.findById(id);
    if (!variant) {
      console.log('Variant not found:', id);
      return res.status(404).json({ message: "Không tìm thấy biến thể" });
    }
    
    variant.an_hien = !variant.an_hien;
    await variant.save();
    
    console.log('Variant visibility toggled successfully:', variant.an_hien);
    res.status(200).json(variant);
  } catch (error) {
    console.error('Error toggling variant visibility:', error);
    res.status(500).json({ message: "Lỗi khi đổi trạng thái biến thể: " + error.message });
  }
};

// Cấu hình lưu file cho variant
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// API upload 1 file, trả về link ảnh
const uploadVariantImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }
    
    const imageUrl = req.file.filename;
    res.status(200).json({ message: "Upload ảnh thành công", url: imageUrl });
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

// Thống kê số lượng sản phẩm trong variants
const getVariantInventoryStats = async (req, res) => {
  try {
    const stats = await variants.aggregate([
      {
        $group: {
          _id: null,
          totalVariants: { $sum: 1 },
          totalInStock: { $sum: { $cond: [{ $gt: ["$so_luong_hang", 0] }, 1, 0] } },
          totalOutOfStock: { $sum: { $cond: [{ $eq: ["$so_luong_hang", 0] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$so_luong_hang", 0] }, { $lte: ["$so_luong_hang", 5] }] }, 1, 0] } },
          totalQuantity: { $sum: "$so_luong_hang" }
        }
      }
    ]);

    const lowStockVariants = await variants.find({
      so_luong_hang: { $gt: 0, $lte: 5 }
    }).select('id_san_pham dung_luong mau so_luong_hang');

    const outOfStockVariants = await variants.find({
      so_luong_hang: 0
    }).select('id_san_pham dung_luong mau so_luong_hang');

    res.status(200).json({
      stats: stats[0] || {},
      lowStockVariants,
      outOfStockVariants
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê inventory:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

// API kiểm tra tồn kho cho nhiều variants
const checkInventory = async (req, res) => {
  try {
    const { variantIds } = req.body;
    
    if (!variantIds || !Array.isArray(variantIds)) {
      return res.status(400).json({ 
        message: "Danh sách variant IDs không hợp lệ" 
      });
    }

    // Lấy thông tin variants với số lượng hàng hiện tại
    const variantList = await variants.find({
      _id: { $in: variantIds }
    }).select('_id so_luong_hang dung_luong mau an_hien');

    if (variantList.length === 0) {
      return res.status(404).json({ 
        message: "Không tìm thấy variants nào" 
      });
    }

    res.status(200).json({
      message: "Kiểm tra tồn kho thành công",
      variants: variantList
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra tồn kho:", error);
    res.status(500).json({ 
      message: "Lỗi máy chủ: " + error.message 
    });
  }
};

module.exports = {
  getAllVariants,
  getVariantsByProductId,
  getVariantsByProductIdForClient,
  createVariant,
  updateVariant,
  toggleVariantVisibility,
  uploadVariantImage,
  getVariantInventoryStats,
  checkInventory
};
