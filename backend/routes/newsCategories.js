const express = require('express');
const router = express.Router();
const newsCategoryController = require('../controllers/newsCategoryController');

router.get('/', newsCategoryController.getAllNewsCategories);
router.post('/', newsCategoryController.createNewsCategory);
router.put('/:id', newsCategoryController.updateNewsCategory);
router.delete('/:id', newsCategoryController.deleteNewsCategory);

module.exports = router; 