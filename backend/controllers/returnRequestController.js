const ReturnRequest = require('../models/returnRequestModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

// Tạo yêu cầu trả hàng mới
const createReturnRequest = async (req, res) => {
  try {
    console.log('=== CREATE RETURN REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      orderId,
      reason,
      description,
      email,
      userId,
      selectedProducts,
      refundAmount
    } = req.body;

    // Validation
    if (!orderId || !reason || !description || !email || !userId) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      console.log('No products selected for return');
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một sản phẩm để trả hàng'
      });
    }

    console.log('Looking for order with ID:', orderId);
    console.log('User ID:', userId);

    let order;
    try {
      order = await Order.findOne({ 
        _id: orderId, 
        'customerInfo.userId': userId,
        orderStatus: 'delivered' // Chỉ cho phép trả hàng đã giao
      });
      console.log('Found order:', order ? 'Yes' : 'No');
      console.log('Order details:', order ? {
        id: order._id,
        status: order.orderStatus,
        userId: order.customerInfo?.userId
      } : 'None');
    } catch (orderError) {
      console.log('Error finding order:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm đơn hàng'
      });
    }

    if (!order) {
      console.log('Order not found or not delivered');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng hoặc đơn hàng chưa được giao'
      });
    }

    // Kiểm tra xem các sản phẩm được chọn đã được trả hàng chưa
    console.log('Checking for existing return requests for selected products...');
    
    const productVariantPairs = selectedProducts.map(p => ({
      productId: p.productId,
      variantId: p.variantId
    }));
    
    console.log('Product-Variant pairs to check:', productVariantPairs);

    const existingRequests = await ReturnRequest.find({
      orderId: orderId,
      // Kiểm tra tất cả các request (kể cả đã bị từ chối) - chỉ được yêu cầu trả hàng 1 lần
      $or: productVariantPairs.map(pair => ({
        'selectedProducts': {
          $elemMatch: {
            productId: pair.productId,
            variantId: pair.variantId
          }
        }
      }))
    });

    console.log('Existing requests found:', existingRequests.length);

    if (existingRequests.length > 0) {
      console.log('Some products already have return requests');
      
      // Tìm sản phẩm cụ thể đã có yêu cầu trả hàng
      const returnedProducts = [];
      existingRequests.forEach(request => {
        request.selectedProducts.forEach(product => {
          const isInCurrentRequest = selectedProducts.some(p => 
            p.productId.toString() === product.productId.toString() && 
            p.variantId.toString() === product.variantId.toString()
          );
          if (isInCurrentRequest) {
            returnedProducts.push(product.name || 'Sản phẩm');
          }
        });
      });

      return res.status(400).json({
        success: false,
        message: `Các sản phẩm sau đã có yêu cầu trả hàng: ${returnedProducts.join(', ')}`
      });
    }

    // Xác định phương thức hoàn tiền dựa trên phương thức thanh toán gốc
    let finalRefundAmount = refundAmount || 0;
    let refundMethod = '';
    
    if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      // COD chưa thanh toán - không cần hoàn tiền
      finalRefundAmount = 0;
      refundMethod = 'Không cần hoàn tiền (COD chưa thanh toán)';
    } else if (order.paymentMethod === 'momo') {
      refundMethod = 'Ví MoMo';
    } else if (order.paymentMethod === 'atm') {
      refundMethod = 'Chuyển khoản ngân hàng (ATM)';
    } else {
      // COD đã thanh toán hoặc các phương thức khác
      refundMethod = 'Tiền mặt (COD)';
    }

    console.log('Creating return request with data:', {
      orderId,
      userId,
      selectedProducts: selectedProducts.length,
      reason,
      finalRefundAmount,
      refundMethod
    });

    // Tạo yêu cầu trả hàng mới
    const returnRequest = new ReturnRequest({
      orderId,
      userId,
      selectedProducts, // Lưu danh sách sản phẩm được chọn
      reason,
      description,
      email,
      refundAmount: finalRefundAmount,
      refundMethod,
      status: 'pending'
    });

    const savedRequest = await returnRequest.save();
    console.log('Return request created successfully with ID:', savedRequest._id);

    // Populate để trả về đầy đủ thông tin
    const populatedRequest = await ReturnRequest.findById(savedRequest._id)
      .populate('orderId', 'items totalAmount orderStatus')
      .populate('userId', 'TenKH email');

    res.status(201).json({
      success: true,
      message: 'Yêu cầu trả hàng đã được tạo thành công',
      data: populatedRequest
    });

  } catch (error) {
    console.error('Error creating return request:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo yêu cầu trả hàng',
      error: error.message
    });
  }
};

// Lấy danh sách yêu cầu trả hàng của user
const getUserReturnRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const returnRequests = await ReturnRequest.find({ userId })
      .populate('orderId', 'items totalAmount orderStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: returnRequests
    });

  } catch (error) {
    console.error('Error getting user return requests:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu trả hàng',
      error: error.message
    });
  }
};

// Lấy tất cả yêu cầu trả hàng (cho admin)
const getAllReturnRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const returnRequests = await ReturnRequest.find(filter)
      .populate('orderId', 'items totalAmount orderStatus paymentMethod')
      .populate('userId', 'TenKH email Sdt')
      .populate('processedBy', 'TenKH email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ReturnRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: returnRequests,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });

  } catch (error) {
    console.error('Error getting all return requests:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu trả hàng',
      error: error.message
    });
  }
};

// Cập nhật trạng thái yêu cầu trả hàng (cho admin)
const updateReturnRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes, processedBy } = req.body;

    const returnRequest = await ReturnRequest.findById(requestId);
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu trả hàng'
      });
    }

    // Cập nhật thông tin
    returnRequest.status = status;
    if (adminNotes !== undefined) {
      returnRequest.adminNotes = adminNotes;
    }
    if (processedBy) {
      // Nếu processedBy là string "admin", chuyển thành null
      if (processedBy === 'admin') {
        returnRequest.processedBy = null;
      } else {
        returnRequest.processedBy = processedBy;
      }
    }
    // Luôn cập nhật thời gian xử lý khi có thay đổi status
    returnRequest.processedAt = new Date();

    await returnRequest.save();

    // Nếu completed, thực hiện hoàn tiền tự động
    if (status === 'completed') {
      try {
        console.log(`Processing refund for order ${returnRequest.orderId}: ${returnRequest.refundAmount}`);
        
        // Lấy thông tin đơn hàng để xác định phương thức thanh toán
        const order = await Order.findById(returnRequest.orderId);
        if (!order) {
          console.error(`Order not found: ${returnRequest.orderId}`);
          return res.status(400).json({
            success: false,
            message: 'Không tìm thấy đơn hàng để hoàn tiền'
          });
        }

        // Xử lý hoàn tiền theo phương thức thanh toán
        let refundResult = null;
        
        if (order.paymentMethod === 'wallet') {
          // Hoàn tiền vào ví PolyPay
          const walletController = require('./walletController');
          refundResult = await walletController.refund({
            user: { _id: returnRequest.userId },
            body: { 
              userId: returnRequest.userId.toString(),
              amount: returnRequest.refundAmount,
              returnRequestId: returnRequest._id,
              orderId: order._id,
              refundMethod: 'wallet',
              refundReason: `Hoàn tiền từ yêu cầu trả hàng - ${returnRequest.reason}`
            }
          });
          
          if (refundResult.success) {
            console.log(`Refund to PolyPay wallet successful: ${returnRequest.refundAmount}`);
          }
        } else if (order.paymentMethod === 'momo') {
          // Hoàn tiền vào ví PolyPay cho đơn MOMO
          console.log(`Processing MOMO refund to PolyPay wallet: ${returnRequest.refundAmount}`);
          const walletController = require('./walletController');
          refundResult = await walletController.refund({
            user: { _id: returnRequest.userId },
            body: { 
              userId: returnRequest.userId.toString(),
              amount: returnRequest.refundAmount,
              returnRequestId: returnRequest._id,
              orderId: order._id,
              refundMethod: 'momo',
              refundReason: `Hoàn tiền từ yêu cầu trả hàng MOMO - ${returnRequest.reason}`
            }
          });
          
          if (refundResult.success) {
            console.log(`MOMO refund to PolyPay wallet successful: ${returnRequest.refundAmount}`);
          }
        } else if (order.paymentMethod === 'atm') {
          // Hoàn tiền vào ví PolyPay cho đơn ATM
          console.log(`Processing ATM refund to PolyPay wallet: ${returnRequest.refundAmount}`);
          const walletController = require('./walletController');
          refundResult = await walletController.refund({
            user: { _id: returnRequest.userId },
            body: { 
              userId: returnRequest.userId.toString(),
              amount: returnRequest.refundAmount,
              returnRequestId: returnRequest._id,
              orderId: order._id,
              refundMethod: 'atm',
              refundReason: `Hoàn tiền từ yêu cầu trả hàng ATM - ${returnRequest.reason}`
            }
          });
          
          if (refundResult.success) {
            console.log(`ATM refund to PolyPay wallet successful: ${returnRequest.refundAmount}`);
          }
        } else if (order.paymentMethod === 'cod') {
          // COD - không cần hoàn tiền nếu chưa thanh toán
          if (order.paymentStatus === 'pending') {
            console.log(`COD order not paid, no refund needed`);
          } else {
            // COD đã thanh toán - hoàn tiền vào ví PolyPay
            console.log(`Processing COD refund to PolyPay wallet: ${returnRequest.refundAmount}`);
            const walletController = require('./walletController');
            refundResult = await walletController.refund({
              user: { _id: returnRequest.userId },
              body: { 
                userId: returnRequest.userId.toString(),
                amount: returnRequest.refundAmount,
                returnRequestId: returnRequest._id,
                orderId: order._id,
                refundMethod: 'cod',
                refundReason: `Hoàn tiền từ yêu cầu trả hàng COD - ${returnRequest.reason}`
              }
            });
            
            if (refundResult.success) {
              console.log(`COD refund to PolyPay wallet successful: ${returnRequest.refundAmount}`);
            }
          }
        }

        if (refundResult && refundResult.success) {
          console.log(`Refund processed successfully: ${returnRequest.refundAmount}`);
        }
        
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Không fail request nếu hoàn tiền thất bại, chỉ log lỗi
        // Admin có thể xử lý thủ công sau
      }
    }

    const updatedRequest = await ReturnRequest.findById(requestId)
      .populate('orderId', 'items totalAmount paymentMethod')
      .populate('userId', 'TenKH email')
      .populate('processedBy', 'TenKH email');

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating return request status:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật trạng thái',
      error: error.message
    });
  }
};

// Lấy chi tiết yêu cầu trả hàng
const getReturnRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const returnRequest = await ReturnRequest.findById(requestId)
      .populate('orderId', 'items totalAmount orderStatus createdAt paymentMethod')
      .populate('userId', 'TenKH email Sdt')
      .populate('processedBy', 'TenKH email');

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu trả hàng'
      });
    }

    res.status(200).json({
      success: true,
      data: returnRequest
    });

  } catch (error) {
    console.error('Error getting return request:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin yêu cầu trả hàng',
      error: error.message
    });
  }
};

module.exports = {
  createReturnRequest,
  getUserReturnRequests,
  getAllReturnRequests,
  updateReturnRequestStatus,
  getReturnRequest
}; 