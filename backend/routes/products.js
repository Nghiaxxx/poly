const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  addPro,
  uploadImage,
  uploadVideoProduct,
  deletePro,
  editPro,
  searchProducts,
  countProducts,
  getTopProducts,
  getProductSalesStats,
  getProductSalesDetail,
  testBanChayProtection
} = require("../controllers/productController");

router.get("/find", searchProducts);
router.get("/count", countProducts);
router.get("/top", getTopProducts);
router.get("/", getAllProducts);
router.post("/", addPro);
router.post("/upload-image", uploadImage);
router.post("/upload-video", uploadVideoProduct);
router.delete("/:id", deletePro);
router.patch("/:id", editPro);
router.get("/:id", getProductById);

// API để test bảo vệ field ban_chay
router.get("/test-protection", testBanChayProtection);

// API để xem thống kê lượt bán (chỉ đọc)
router.get("/sales-stats", getProductSalesStats);
router.get("/sales-detail/:id", getProductSalesDetail);

module.exports = router;
