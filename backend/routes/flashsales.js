const express = require('express');
const router = express.Router();
const flashsalesController = require('../controllers/flashSaleController');

router.get('/', flashsalesController.getAllFlashSales);
router.get('/active', flashsalesController.getActiveFlashSales);
router.post('/', flashsalesController.createFlashSale);
router.get('/:id', flashsalesController.getFlashSaleById);
router.put('/:id', flashsalesController.updateFlashSale);
router.delete('/:id', flashsalesController.deleteFlashSale);

// Routes for FlashSaleVariant
router.get('/:flashSaleId/variants', flashsalesController.getAllFlashSaleVariants);
router.post('/:flashSaleId/variants', flashsalesController.createFlashSaleVariant);
router.put('/variants/:id', flashsalesController.updateFlashSaleVariant);
router.delete('/variants/:id', flashsalesController.deleteFlashSaleVariant);

module.exports = router;
