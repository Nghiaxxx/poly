const express = require("express");
const router = express.Router();
const {
  getSetting,
  updateSetting,
  uploadImageSetting
} = require("../controllers/settingController");


router.get("/", getSetting);

// Cập nhật setting
router.put("/:id", updateSetting);

// Upload ảnh (logo/banner)
router.post("/upload-image", uploadImageSetting);

module.exports = router; 