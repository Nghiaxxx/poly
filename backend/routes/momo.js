const express = require('express');
const router = express.Router();
const momoController = require('../controllers/momoController');

// Lấy frontend URL từ biến môi trường
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://polysmart.nghiaht.io.vn';

// Tạo yêu cầu thanh toán MOMO
router.post('/create', momoController.createMomoPayment);

// Callback từ MOMO (IPN)
router.post('/callback', momoController.handleMomoCallback);

// Redirect từ MOMO (sau khi thanh toán)
router.get('/redirect', async (req, res) => {
  try {
    console.log('=== MOMO REDIRECT DEBUG ===');
    console.log('Query params:', req.query);
    
    const { orderId, resultCode, message, amount, transId } = req.query;
    
    if (resultCode === '0') {
      // Thanh toán thành công
      console.log(`Payment successful for order: ${orderId}`);
      
      // Cập nhật trạng thái đơn hàng
      const Order = require('../models/orderModel');
      const order = await Order.findById(orderId);
      
      if (order) {
        order.paymentStatus = 'paid';
        // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
        // order.orderStatus = 'confirming'; // Không thay đổi
        order.updatedAt = new Date();
        await order.save();
        
        console.log(`Order ${orderId} successfully updated to paid status`);
        
        // Redirect về trang frontend với thông báo thành công
        const redirectUrl = `${FRONTEND_URL}/payment/momo/${orderId}?status=success&paymentId=${transId}`;
        res.redirect(redirectUrl);
      } else {
        console.log(`Order ${orderId} not found`);
        res.redirect(`${FRONTEND_URL}/payment/momo/${orderId}?status=error&message=Order not found`);
      }
    } else {
      // Thanh toán thất bại
      console.log(`Payment failed for order: ${orderId}, reason: ${message}`);
      res.redirect(`${FRONTEND_URL}/payment/momo/${orderId}?status=error&message=${message}`);
    }
  } catch (error) {
    console.error('MOMO Redirect error:', error);
    res.redirect(`${FRONTEND_URL}/payment/momo/${orderId}?status=error&message=System error`);
  }
});

// Kiểm tra trạng thái thanh toán
router.get('/status/:orderId', momoController.checkMomoPaymentStatus);

// Test endpoint để manually trigger callback (chỉ dùng cho development)
router.post('/test-callback/:orderId', momoController.testMomoCallback);

// Endpoint để manually update payment status (tạm thời)
router.put('/update-status/:orderId', momoController.manualUpdatePaymentStatus);

// Tạo yêu cầu nạp tiền vào ví bằng MOMO
router.post('/wallet-deposit', momoController.createMomoWalletDeposit);

// Callback từ MOMO cho nạp tiền vào ví (IPN)
router.post('/wallet-callback', momoController.handleMomoWalletDepositCallback);

// Redirect từ MOMO sau khi nạp tiền vào ví thành công
router.get('/wallet-redirect', async (req, res) => {
  try {
    console.log('=== MOMO WALLET DEPOSIT REDIRECT DEBUG ===');
    console.log('Query params:', req.query);
    
    const { orderId, resultCode, message, amount, transId, extraData } = req.query;
    
    if (resultCode === '0') {
      // Nạp tiền thành công
      console.log(`Wallet deposit successful for order: ${orderId}`);
      
      // Parse extraData để lấy userId
      let parsedExtraData = {};
      try {
        parsedExtraData = JSON.parse(decodeURIComponent(extraData || '{}'));
      } catch (e) {
        console.error('Error parsing extraData:', e);
      }
      
      const userId = parsedExtraData.userId;
      
      if (userId) {
        // Cập nhật số dư ví
        const walletController = require('../controllers/walletController');
        
        try {
          const depositResult = await walletController.depositFromMomo(userId, parseInt(amount), orderId, transId);
          
          if (depositResult.success) {
            console.log(`Wallet deposit completed for user: ${userId}, new balance: ${depositResult.data.newBalance}`);
            
            // Redirect về trang frontend với thông báo thành công
            const redirectUrl = `${FRONTEND_URL}/profile?tab=wallet&status=success&amount=${amount}&newBalance=${depositResult.data.newBalance}`;
            res.redirect(redirectUrl);
          } else {
            console.log(`Wallet deposit failed: ${depositResult.message}`);
            res.redirect(`${FRONTEND_URL}/profile?tab=wallet&status=error&message=${encodeURIComponent(depositResult.message)}`);
          }
        } catch (walletError) {
          console.error('Error updating wallet:', walletError);
          res.redirect(`${FRONTEND_URL}/profile?tab=wallet&status=error&message=${encodeURIComponent('Lỗi cập nhật ví tiền')}`);
        }
      } else {
        console.log('UserId not found in extraData');
        res.redirect(`${FRONTEND_URL}/profile?tab=wallet&status=error&message=${encodeURIComponent('Không tìm thấy thông tin người dùng')}`);
      }
    } else {
      // Nạp tiền thất bại
      console.log(`Wallet deposit failed for order: ${orderId}, reason: ${message}`);
      res.redirect(`${FRONTEND_URL}/profile?tab=wallet&status=error&message=${encodeURIComponent(message || 'Nạp tiền thất bại')}`);
    }
  } catch (error) {
    console.error('MOMO Wallet Redirect error:', error);
    res.redirect(`${FRONTEND_URL}/profile?tab=wallet&status=error&message=${encodeURIComponent('Lỗi hệ thống')}`);
  }
});

// Test endpoint để kiểm tra callback URL
router.get('/test-callback-url', (req, res) => {
  console.log('=== CALLBACK URL TEST ===');
  console.log('Callback URL accessed successfully');
  console.log('Headers:', req.headers);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  console.log('========================');
  
  res.json({
    success: true,
    message: 'Callback URL is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 