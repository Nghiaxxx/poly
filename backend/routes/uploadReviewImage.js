const express = require('express');
const router = express.Router();
const { uploadReviewImage } = require('../controllers/uploadReviewImageController');

router.post('/', uploadReviewImage);

module.exports = router;
