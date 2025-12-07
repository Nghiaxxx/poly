const express = require("express");
const router = express.Router();
const { getAllVariants, getVariantsByProductId, getVariantsByProductIdForClient, createVariant, updateVariant, toggleVariantVisibility, uploadVariantImage, getVariantInventoryStats, checkInventory } = require("../controllers/variantController");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer cho upload ảnh
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
    cb(null, 'variant-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh!'), false);
    }
  }
});

router.get("/", getAllVariants);
router.get("/by-product/:id", getVariantsByProductId);
router.get("/client/by-product/:id", getVariantsByProductIdForClient); // API mới cho client
router.get("/inventory-stats", getVariantInventoryStats);
router.post("/check-inventory", checkInventory);
router.post("/", createVariant);
router.put("/:id", updateVariant);
router.patch("/toggle-visibility/:id", toggleVariantVisibility);
router.post("/upload-image", upload.single('file'), uploadVariantImage);

module.exports = router;
