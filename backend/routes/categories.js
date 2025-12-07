const express = require("express");
const router = express.Router();
const { getAllCategories, addCategory, updateCategory, deleteCategory, toggleCategoryVisibility, uploadImageCategory, uploadVideoCategory, getCategoryById } = require("../controllers/categoryController");

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", addCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.patch("/:id/toggle-visibility", toggleCategoryVisibility);
router.post("/upload-image", uploadImageCategory);
router.post("/upload-video", uploadVideoCategory);

module.exports = router;
