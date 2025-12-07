const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

/**
 * @openapi
 * /api/wallet/balance:
 *   get:
 *     summary: Get wallet balance of current user
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Current balance
 */
router.get('/balance', (req, res) => walletController.getBalance(req, res));

/**
 * @openapi
 * /api/wallet/deposit:
 *   post:
 *     summary: Deposit into wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Deposit success
 */
router.post('/deposit', (req, res) => walletController.deposit(req, res));

/**
 * @openapi
 * /api/wallet/pay:
 *   post:
 *     summary: Pay using wallet balance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               referenceId:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment success
 */
router.post('/pay', (req, res) => walletController.pay(req, res));

/**
 * @openapi
 * /api/wallet/history:
 *   get:
 *     summary: Get wallet transaction history
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/history', (req, res) => walletController.history(req, res));

/**
 * @openapi
 * /api/wallet/refund-history:
 *   get:
 *     summary: Get refund history
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: returnRequestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of refunds
 */
router.get('/refund-history', (req, res) => walletController.getRefundHistory(req, res));

/**
 * @openapi
 * /api/wallet/pay-order:
 *   post:
 *     summary: Pay for order using wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 */
router.post('/pay-order', (req, res) => walletController.payOrder(req, res));

module.exports = router; 