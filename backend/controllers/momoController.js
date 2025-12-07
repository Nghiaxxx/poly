const crypto = require('crypto');
const https = require('https');
const path = require('path'); // Added for path.join

// MOMO Configuration
const MOMO_CONFIG = {
  accessKey: 'F8BBA842ECF85',
  secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: 'MOMO',
  partnerName: 'TechStore',
  storeId: 'TechStore',
  requestType: 'payWithMethod',
  lang: 'vi',
  autoCapture: true,
  // Sử dụng biến môi trường hoặc fallback về backend redirect route
  // Để cấu hình production, tạo file .env với:
  // MOMO_IPN_URL=https://poly.nghiaht.io.vn/api/momo/callback
  // MOMO_REDIRECT_URL=https://poly.nghiaht.io.vn/api/momo/redirect
  ipnUrl: process.env.MOMO_IPN_URL || 'https://poly.nghiaht.io.vn/api/momo/callback',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'https://poly.nghiaht.io.vn/api/momo/redirect',
  // URL riêng cho nạp tiền vào ví
  walletDepositRedirectUrl: process.env.MOMO_WALLET_REDIRECT_URL || 'https://poly.nghiaht.io.vn/api/momo/wallet-redirect'
};

// Tạo signature cho MOMO
const createMomoSignature = (params) => {
  const rawSignature = `accessKey=${params.accessKey}&amount=${params.amount}&extraData=${params.extraData}&ipnUrl=${params.ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${params.partnerCode}&redirectUrl=${params.redirectUrl}&requestId=${params.requestId}&requestType=${params.requestType}`;
  
  return crypto.createHmac('sha256', params.secretKey)
    .update(rawSignature)
    .digest('hex');
};

// Tạo payment request
exports.createMomoPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin orderId hoặc amount' 
      });
    }

    const requestId = `MOMO_${Date.now()}`;
    const extraData = '';
    const orderGroupId = '';

    // Tạo params cho signature
    const signatureParams = {
      accessKey: MOMO_CONFIG.accessKey,
      secretKey: MOMO_CONFIG.secretKey,
      amount: amount,
      extraData: extraData,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      orderId: orderId,
      orderInfo: orderInfo || 'Thanh toan don hang TechStore',
      partnerCode: MOMO_CONFIG.partnerCode,
      redirectUrl: MOMO_CONFIG.redirectUrl,
      requestId: requestId,
      requestType: MOMO_CONFIG.requestType
    };

    const signature = createMomoSignature(signatureParams);

    // Tạo request body
    const requestBody = JSON.stringify({
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: MOMO_CONFIG.partnerName,
      storeId: MOMO_CONFIG.storeId,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo || 'Thanh toan don hang TechStore',
      redirectUrl: MOMO_CONFIG.redirectUrl,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      lang: MOMO_CONFIG.lang,
      requestType: MOMO_CONFIG.requestType,
      autoCapture: MOMO_CONFIG.autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature
    });

    // Gửi request đến MOMO
    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const momoRequest = https.request(options, (momoResponse) => {
      let data = '';
      
      momoResponse.on('data', (chunk) => {
        data += chunk;
      });
      
      momoResponse.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('MOMO Response:', response);
    console.log('=== MOMO PAYMENT REQUEST DEBUG ===');
    console.log('Request URL:', `https://test-payment.momo.vn/v2/gateway/api/create`);
    console.log('IPN URL:', MOMO_CONFIG.ipnUrl);
    console.log('Redirect URL:', MOMO_CONFIG.redirectUrl);
    console.log('Order ID:', orderId);
    console.log('Amount:', amount);
    console.log('==================================');
          
          if (response.resultCode === 0) {
            res.json({
              success: true,
              message: 'Tạo yêu cầu thanh toán MOMO thành công',
              data: {
                payUrl: response.payUrl,
                orderId: orderId,
                requestId: requestId,
                amount: amount
              }
            });
          } else {
            res.status(400).json({
              success: false,
              message: `Lỗi MOMO: ${response.message || 'Không thể tạo yêu cầu thanh toán'}`,
              error: response
            });
          }
        } catch (error) {
          console.error('Error parsing MOMO response:', error);
          res.status(500).json({
            success: false,
            message: 'Lỗi xử lý phản hồi từ MOMO'
          });
        }
      });
    });

    momoRequest.on('error', (error) => {
      console.error('MOMO Request Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kết nối đến MOMO'
      });
    });

    momoRequest.write(requestBody);
    momoRequest.end();

  } catch (error) {
    console.error('Create MOMO payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tạo yêu cầu thanh toán MOMO'
    });
  }
};

// Xử lý callback từ MOMO
exports.handleMomoCallback = async (req, res) => {
  try {
    const { 
      orderId, 
      resultCode, 
      message, 
      amount, 
      transId, 
      responseTime, 
      extraData, 
      signature 
    } = req.body;

    console.log('=== MOMO CALLBACK DEBUG ===');
    console.log('Full callback data:', req.body);
    console.log('OrderId received:', orderId);
    console.log('ResultCode:', resultCode);
    console.log('Message:', message);
    console.log('Amount:', amount);
    console.log('TransId:', transId);
    console.log('==========================');

    // Verify signature (optional but recommended)
    // const expectedSignature = createMomoSignature({...});
    // if (signature !== expectedSignature) {
    //   return res.status(400).json({ success: false, message: 'Invalid signature' });
    // }

    if (resultCode === 0) {
      // Thanh toán thành công
      console.log(`Payment successful for order: ${orderId}`);
      
      // Cập nhật trạng thái đơn hàng
      const Order = require('../models/orderModel');
      
      console.log('Attempting to find order with ID:', orderId);
      const order = await Order.findById(orderId);
      
      console.log('Order found:', order ? 'YES' : 'NO');
      if (order) {
        console.log('Current order status:', {
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          orderId: order._id
        });
        
        order.paymentStatus = 'paid';
        // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
        // order.orderStatus = 'confirming'; // Không thay đổi
        order.updatedAt = new Date();
        
        console.log('Attempting to save order...');
        await order.save();
        
        console.log(`Order ${orderId} successfully updated to paid status`);
        console.log('Updated order status:', {
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          updatedAt: order.updatedAt
        });
      } else {
        console.log(`ERROR: Order with ID ${orderId} not found in database`);
      }

      res.json({
        success: true,
        message: 'Thanh toán thành công',
        orderId: orderId,
        transId: transId
      });
    } else {
      // Thanh toán thất bại
      console.log(`Payment failed for order: ${orderId}, reason: ${message}`);
      
      res.json({
        success: false,
        message: `Thanh toán thất bại: ${message}`,
        orderId: orderId
      });
    }

  } catch (error) {
    console.error('MOMO Callback error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý callback từ MOMO'
    });
  }
};

// Kiểm tra trạng thái thanh toán
exports.checkMomoPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const Order = require('../models/orderModel');
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        amount: order.totalAmount
      }
    });

  } catch (error) {
    console.error('Check MOMO payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi kiểm tra trạng thái thanh toán'
    });
  }
};

// Test endpoint để manually trigger callback (chỉ dùng cho development)
exports.testMomoCallback = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('=== TEST MOMO CALLBACK ===');
    console.log('Testing callback for orderId:', orderId);
    
    const Order = require('../models/orderModel');
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    console.log('Order found:', {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    });
    
    // Simulate successful payment
    order.paymentStatus = 'paid';
    // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
    // order.orderStatus = 'confirming'; // Không thay đổi
    order.updatedAt = new Date();
    
    console.log('Attempting to save order...');
    await order.save();
    
    console.log('Order successfully updated');
    console.log('========================');
    
    res.json({
      success: true,
      message: 'Test callback thành công',
      orderId: orderId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    });
    
  } catch (error) {
    console.error('Test MOMO callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi test callback'
    });
  }
};

// Endpoint để manually update payment status (tạm thời)
exports.manualUpdatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, orderStatus } = req.body;
    
    console.log('=== MANUAL UPDATE PAYMENT STATUS ===');
    console.log('OrderId:', orderId);
    console.log('Payment Status:', paymentStatus);
    console.log('Order Status:', orderStatus);
    
    const Order = require('../models/orderModel');
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Update status
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (orderStatus) order.orderStatus = orderStatus;
    order.updatedAt = new Date();
    
    await order.save();
    
    console.log('Order updated successfully');
    console.log('===============================');
    
    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      orderId: orderId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    });
    
  } catch (error) {
    console.error('Manual update error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái'
    });
  }
}; 

// Tạo payment request cho nạp tiền vào ví
exports.createMomoWalletDeposit = async (req, res) => {
  try {
    const { userId, amount, orderInfo } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin userId hoặc amount' 
      });
    }

    // Tạo orderId đặc biệt cho nạp tiền ví
    const orderId = `WALLET_DEPOSIT_${userId}_${Date.now()}`;
    const requestId = `MOMO_WALLET_${Date.now()}`;
    const extraData = JSON.stringify({ 
      type: 'wallet_deposit',
      userId: userId 
    });
    const orderGroupId = '';

    // Tạo params cho signature
    const signatureParams = {
      accessKey: MOMO_CONFIG.accessKey,
      secretKey: MOMO_CONFIG.secretKey,
      amount: amount,
      extraData: extraData,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      orderId: orderId,
      orderInfo: orderInfo || `Nạp tiền vào ví PolyPay - ${amount.toLocaleString('vi-VN')} VND`,
      partnerCode: MOMO_CONFIG.partnerCode,
      redirectUrl: MOMO_CONFIG.walletDepositRedirectUrl,
      requestId: requestId,
      requestType: MOMO_CONFIG.requestType
    };

    const signature = createMomoSignature(signatureParams);

    // Tạo request body
    const requestBody = JSON.stringify({
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: MOMO_CONFIG.partnerName,
      storeId: MOMO_CONFIG.storeId,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo || `Nạp tiền vào ví PolyPay - ${amount.toLocaleString('vi-VN')} VND`,
      redirectUrl: MOMO_CONFIG.walletDepositRedirectUrl,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      lang: MOMO_CONFIG.lang,
      requestType: MOMO_CONFIG.requestType,
      autoCapture: MOMO_CONFIG.autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature
    });

    // Gửi request đến MOMO
    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const momoRequest = https.request(options, (momoResponse) => {
      let data = '';
      
      momoResponse.on('data', (chunk) => {
        data += chunk;
      });
      
      momoResponse.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('MOMO Wallet Deposit Response:', response);
          console.log('=== MOMO WALLET DEPOSIT REQUEST DEBUG ===');
          console.log('Request URL:', `https://test-payment.momo.vn/v2/gateway/api/create`);
          console.log('IPN URL:', MOMO_CONFIG.ipnUrl);
          console.log('Redirect URL:', MOMO_CONFIG.walletDepositRedirectUrl);
          console.log('Order ID:', orderId);
          console.log('Amount:', amount);
          console.log('Type: Wallet Deposit');
          console.log('========================================');
          
          if (response.resultCode === 0) {
            res.json({
              success: true,
              message: 'Tạo yêu cầu nạp tiền vào ví bằng MOMO thành công',
              data: {
                payUrl: response.payUrl,
                orderId: orderId,
                requestId: requestId,
                amount: amount,
                type: 'wallet_deposit'
              }
            });
          } else {
            res.status(400).json({
              success: false,
              message: `Lỗi MOMO: ${response.message || 'Không thể tạo yêu cầu nạp tiền'}`,
              error: response
            });
          }
        } catch (error) {
          console.error('Error parsing MOMO wallet deposit response:', error);
          res.status(500).json({
            success: false,
            message: 'Lỗi xử lý phản hồi từ MOMO'
          });
        }
      });
    });

    momoRequest.on('error', (error) => {
      console.error('MOMO Wallet Deposit Request Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kết nối đến MOMO'
      });
    });

    momoRequest.write(requestBody);
    momoRequest.end();

  } catch (error) {
    console.error('Create MOMO wallet deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo yêu cầu nạp tiền vào ví'
    });
  }
};

// Xử lý callback từ MOMO cho nạp tiền vào ví
exports.handleMomoWalletDepositCallback = async (req, res) => {
  try {
    const { orderId, resultCode, message, amount, transId, extraData } = req.body;
    
    console.log('=== MOMO WALLET DEPOSIT CALLBACK ===');
    console.log('OrderId:', orderId);
    console.log('ResultCode:', resultCode);
    console.log('Message:', message);
    console.log('Amount:', amount);
    console.log('TransId:', transId);
    console.log('ExtraData:', extraData);
    console.log('====================================');

    // Parse extraData để lấy thông tin
    let parsedExtraData = {};
    try {
      parsedExtraData = JSON.parse(extraData || '{}');
    } catch (e) {
      console.error('Error parsing extraData:', e);
    }

    // Kiểm tra xem có phải nạp tiền vào ví không
    if (parsedExtraData.type !== 'wallet_deposit') {
      console.log('Not a wallet deposit transaction, skipping...');
      return res.json({ success: true, message: 'Not a wallet deposit transaction' });
    }

    const userId = parsedExtraData.userId;

    if (parseInt(resultCode) === 0) {
      // Nạp tiền thành công
      console.log(`Wallet deposit successful for user: ${userId}, amount: ${amount}`);
      
      // Cập nhật số dư ví
      const walletController = require('./walletController');
      
      try {
        // Gọi function nạp tiền vào ví
        const depositResult = await walletController.depositFromMomo(userId, parseInt(amount), orderId, transId);
        
        if (depositResult.success) {
          console.log(`Wallet deposit completed for user: ${userId}, new balance: ${depositResult.data.newBalance}`);
          
          res.json({
            success: true,
            message: 'Nạp tiền vào ví thành công',
            userId: userId,
            amount: parseInt(amount),
            transId: transId,
            newBalance: depositResult.data.newBalance
          });
        } else {
          console.error('Wallet deposit failed:', depositResult.message);
          res.status(400).json({
            success: false,
            message: `Lỗi nạp tiền vào ví: ${depositResult.message}`,
            userId: userId,
            amount: parseInt(amount)
          });
        }
      } catch (walletError) {
        console.error('Error updating wallet:', walletError);
        res.status(500).json({
          success: false,
          message: 'Lỗi cập nhật ví tiền',
          error: walletError.message
        });
      }
    } else {
      // Nạp tiền thất bại
      console.log(`Wallet deposit failed for user: ${userId}, reason: ${message}`);
      
      res.json({
        success: false,
        message: `Nạp tiền thất bại: ${message}`,
        userId: userId,
        amount: parseInt(amount)
      });
    }

  } catch (error) {
    console.error('MOMO Wallet Deposit Callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý callback nạp tiền vào ví'
    });
  }
}; 