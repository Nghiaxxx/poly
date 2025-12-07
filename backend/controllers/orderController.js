const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Variant = require('../models/variantModel');
const BankTransaction = require('../models/bankTransactionModel');
const FlashSaleVariant = require('../models/FlashSaleVariant');
const Voucher = require('../models/voucherModel');
const UserVoucher = require('../models/userVoucherModel');
const GiftVoucher = require('../models/giftVoucherModel'); // Added GiftVoucher import

// Helper function to update flash sale quantities
const updateFlashSaleQuantities = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for flash sale update`);
      return false;
    }

    let flashSaleUpdated = false;

    for (const item of order.items) {
      if (item.isFlashSale && item.flashSaleVariantId) {
        const result = await FlashSaleVariant.updateOne(
          { _id: item.flashSaleVariantId },
          { $inc: { da_ban: item.quantity } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Updated flash sale variant ${item.flashSaleVariantId}: +${item.quantity} sold`);
          flashSaleUpdated = true;
        } else {
          console.log(`Flash sale variant ${item.flashSaleVariantId} not found or not updated`);
        }
      }
    }

    return flashSaleUpdated;
  } catch (error) {
    console.error('Error updating flash sale quantities:', error);
    return false;
  }
};

// Helper function to update variant quantities when order is paid
const updateVariantQuantities = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for variant quantity update`);
      return false;
    }

    let variantUpdated = false;

    for (const item of order.items) {
      if (item.variantId) {
        // Kiểm tra số lượng hiện tại trước khi giảm
        const variant = await Variant.findById(item.variantId);
        if (!variant) {
          console.log(`Variant ${item.variantId} not found`);
          continue;
        }
        
        if (variant.so_luong_hang < item.quantity) {
          console.log(`Warning: Variant ${item.variantId} has insufficient quantity. Current: ${variant.so_luong_hang}, Required: ${item.quantity}`);
          // Có thể xử lý thêm logic ở đây nếu cần
        }
        
        // Chỉ giảm khi còn đủ hàng và tránh âm số lượng
        const result = await Variant.updateOne(
          { _id: item.variantId, so_luong_hang: { $gte: item.quantity } },
          { $inc: { so_luong_hang: -item.quantity } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Updated variant ${item.variantId}: -${item.quantity} quantity`);
          variantUpdated = true;
        } else {
          console.log(`Variant ${item.variantId} not found or not updated`);
        }
      }
    }

    return variantUpdated;
  } catch (error) {
    console.error('Error updating variant quantities:', error);
    return false;
  }
};

// Helper function to update voucher usage
const updateVoucherUsage = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for voucher update`);
      return false;
    }

    // Kiểm tra xem đơn hàng có sử dụng voucher không
    if (!order.voucherCode) {
      console.log(`Order ${orderId} has no voucher code`);
      return false;
    }

    console.log(`🔍 Processing voucher usage for order ${orderId}, voucher code: ${order.voucherCode}`);

    // Tìm voucher từ collection Voucher thống nhất
    const voucher = await Voucher.findOne({ ma_voucher: order.voucherCode.toUpperCase() });
    
    if (!voucher) {
      console.log(`❌ Voucher ${order.voucherCode} not found`);
      return false;
    }
    
    const isGiftVoucher = voucher.loai === 'gift';
    console.log(`🎯 Found ${isGiftVoucher ? 'Gift' : 'Public'} Voucher: ${voucher.ma_voucher}`);

    // Kiểm tra xem voucher đã được sử dụng bởi user này chưa
    const existingUsage = await UserVoucher.findOne({ 
      user_email: order.customerInfo.email, 
      ma_voucher: order.voucherCode.toUpperCase(),
      used: true 
    });

    if (existingUsage) {
      console.log(`⚠️ Voucher ${order.voucherCode} already used by user ${order.customerInfo.email}`);
      return false;
    }

    if (isGiftVoucher) {
      // Xử lý Gift Voucher
      if (voucher.da_su_dung > 0) {
        console.log(`⚠️ Gift Voucher ${order.voucherCode} already used`);
        return false;
      }

      // Cập nhật trạng thái đã sử dụng cho Gift Voucher
      const updatedVoucher = await Voucher.findByIdAndUpdate(
        voucher._id,
        { da_su_dung: 1 },
        { new: true }
      );

      console.log(`✅ Gift Voucher ${order.voucherCode} marked as used`);

      // Tạo record sử dụng voucher
      const userVoucher = new UserVoucher({
        user_email: order.customerInfo.email,
        voucher_id: voucher._id,
        ma_voucher: voucher.ma_voucher,
        order_id: order._id,
        used: true,
        used_at: new Date(),
        expired_at: voucher.ngay_ket_thuc,
        loai: 'gift'
      });

      await userVoucher.save();
      console.log(`✅ UserVoucher record created for Gift Voucher`);

    } else {
      // Xử lý Public Voucher
      if (voucher.so_luong <= 0) {
        console.log(`⚠️ Public Voucher ${order.voucherCode} has reached maximum usage`);
        return false;
      }

      // Cập nhật số lượng đã sử dụng
      const updatedVoucher = await Voucher.findByIdAndUpdate(
        voucher._id,
        { $inc: { da_su_dung: 1, so_luong: -1 } },
        { new: true }
      );

      // Tạo record sử dụng voucher
      const userVoucher = new UserVoucher({
        user_email: order.customerInfo.email,
        voucher_id: voucher._id,
        ma_voucher: voucher.ma_voucher,
        order_id: order._id,
        used: true,
        used_at: new Date(),
        expired_at: voucher.ngay_ket_thuc,
        loai: 'public'
      });

      await userVoucher.save();

      // Kiểm tra nếu voucher hết số lượng, tự động tắt popup
      if (updatedVoucher.so_luong <= 0) {
        await Voucher.findByIdAndUpdate(voucher._id, { popup: false });
        console.log(`🎯 Public Voucher ${order.voucherCode} has reached maximum usage, popup disabled`);
      }

      console.log(`✅ Public Voucher ${order.voucherCode} usage updated: used=${updatedVoucher.da_su_dung}, remaining=${updatedVoucher.so_luong}`);
    }

    console.log(`🎉 Voucher usage update completed successfully for order ${orderId}`);
    return true;

  } catch (error) {
    console.error('❌ Error updating voucher usage:', error);
    return false;
  }
};

// Helper function to restore variant quantities when order is cancelled
const restoreVariantQuantities = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for variant quantity restoration`);
      return false;
    }

    let variantRestored = false;

    for (const item of order.items) {
      if (item.variantId) {
        const result = await Variant.updateOne(
          { _id: item.variantId },
          { $inc: { so_luong_hang: item.quantity } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Restored variant ${item.variantId}: +${item.quantity} quantity`);
          variantRestored = true;
        } else {
          console.log(`Variant ${item.variantId} not found or not restored`);
        }
      }
    }

    return variantRestored;
  } catch (error) {
    console.error('Error restoring variant quantities:', error);
    return false;
  }
};

// Helper function to update product sales count when order is paid
const updateProductSalesCount = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for product sales count update`);
      return false;
    }

    let salesUpdated = false;

    for (const item of order.items) {
      if (item.productId) {
        // Sử dụng static method mới để tăng ban_chay
        const result = await Product.increaseSalesCountById(item.productId, item.quantity);
        
        if (result) {
          console.log(`✅ Updated product ${item.productId} sales count: +${item.quantity} (new total: ${result.ban_chay})`);
          salesUpdated = true;
        } else {
          console.log(`❌ Product ${item.productId} not found or not updated`);
        }
      }
    }

    return salesUpdated;
  } catch (error) {
    console.error('Error updating product sales count:', error);
    return false;
  }
};

// Helper function to decrease product sales count when order is cancelled
const decreaseProductSalesCount = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for product sales count decrease`);
      return false;
    }

    let salesDecreased = false;

    for (const item of order.items) {
      if (item.productId) {
        // Sử dụng static method mới để giảm ban_chay
        const result = await Product.decreaseSalesCountById(item.productId, item.quantity);
        
        if (result) {
          console.log(`✅ Decreased product ${item.productId} sales count: -${item.quantity} (new total: ${result.ban_chay})`);
          salesDecreased = true;
        } else {
          console.log(`❌ Product ${item.productId} not found or not updated`);
        }
      }
    }

    return salesDecreased;
  } catch (error) {
    console.error('Error decreasing product sales count:', error);
    return false;
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerInfo, items, totalAmount, paymentMethod, voucher } = req.body;

    console.log('Creating order with data:', {
      customerInfo,
      items: items?.length,
      totalAmount,
      paymentMethod,
      voucher
    });

    // Validate required fields
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.addressId || !customerInfo.address) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin giao hàng' });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicateOrder = await Order.findOne({
      'customerInfo.phone': req.body.customerInfo.phone,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod,
      paymentStatus: 'pending',
      createdAt: { $gte: fiveMinutesAgo }
    });

    console.log('Duplicate order check:', {
      phone: req.body.customerInfo.phone,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod,
      found: !!duplicateOrder
    });

    if (duplicateOrder) {
      // Nếu đơn hàng cũ vẫn pending trong 5 phút, trả về đơn cũ
      return res.status(200).json({
        message: 'Đơn hàng đã tồn tại (pending)',
        order: {
          id: duplicateOrder._id,
          transferContent: duplicateOrder.transferContent,
          bankInfo: duplicateOrder.bankInfo,
          totalAmount: duplicateOrder.totalAmount
        }
      });
    }

    // Lấy giá gốc và thông tin variant cho từng item, đồng thời validate số lượng hàng
    const itemsWithVariantInfo = await Promise.all(items.map(async (item) => {
      const variant = await Variant.findById(item.variantId);
      
      // Kiểm tra variant có tồn tại không
      if (!variant) {
        throw new Error(`Variant ${item.variantId} không tồn tại`);
      }
      
      // Kiểm tra số lượng hàng có đủ không
      if (variant.so_luong_hang < item.quantity) {
        throw new Error(`Sản phẩm ${variant.dung_luong} - ${variant.mau} chỉ còn ${variant.so_luong_hang} sản phẩm, không đủ số lượng yêu cầu (${item.quantity})`);
      }
      
      // Kiểm tra số lượng hàng có âm không
      if (variant.so_luong_hang < 0) {
        throw new Error(`Sản phẩm ${variant.dung_luong} - ${variant.mau} đã hết hàng`);
      }
      
      return {
        ...item,
        oldPrice: variant.gia_goc,
        dung_luong: variant.dung_luong
      };
    }));

    // Nếu không có đơn pending trong 5 phút, tạo đơn mới
    const order = new Order({
      customerInfo,
      items: itemsWithVariantInfo,
      totalAmount,
      voucherCode: voucher?.code || undefined, // Lưu mã voucher
      voucherDiscount: voucher?.discount || 0, // Lưu số tiền giảm từ voucher
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'confirming',
      transferContent: `DH${Date.now().toString().slice(-6)}`
    });

    // If ATM payment, add bank info
    if (paymentMethod === 'atm') {
      order.bankInfo = {
        bankName: 'BIDV',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER,
        accountName: process.env.BANK_ACCOUNT_NAME,
        branch: process.env.BANK_BRANCH
      };
    }

    // Save order
    try {
      await order.save();
      
      console.log('=== ORDER CREATION DEBUG ===');
      console.log('Order created successfully:', {
        orderId: order._id,
        orderIdString: order._id.toString(),
        customerPhone: order.customerInfo.phone,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      });
      console.log('==========================');

      return res.status(201).json({
        message: 'Đặt hàng thành công',
        order: {
          id: order._id,
          transferContent: order.transferContent,
          bankInfo: order.bankInfo,
          totalAmount: order.totalAmount
        }
      });
    } catch (err) {
      if (err.code === 11000) {
        // Nếu bị duplicate key, trả về đơn hàng cũ
        const duplicateOrder = await Order.findOne({
          'customerInfo.phone': req.body.customerInfo.phone,
          totalAmount: req.body.totalAmount,
          paymentMethod: req.body.paymentMethod,
          paymentStatus: 'pending'
        });
        return res.status(200).json({ message: 'Đơn hàng đã tồn tại', order: duplicateOrder });
      }
      throw err;
    }
  } catch (error) {
    console.error('Create order error:', error);
    
    // Xử lý các lỗi validation cụ thể
    if (error.message.includes('không tồn tại') || 
        error.message.includes('không đủ số lượng') || 
        error.message.includes('đã hết hàng')) {
      return res.status(400).json({ 
        message: error.message,
        error: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi đặt hàng' });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const wasUnpaid = order.paymentStatus !== 'paid';
    order.paymentStatus = paymentStatus;
    
    if (paymentStatus === 'paid') {
      // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
      // order.orderStatus = 'confirming'; // Không thay đổi
      order.paidAt = new Date();
      
      // Update flash sale quantities when payment is confirmed
      if (wasUnpaid) {
        const flashSaleUpdated = await updateFlashSaleQuantities(orderId);
        if (flashSaleUpdated) {
          console.log(`Flash sale quantities updated for order ${orderId}`);
        }
      }

      // Update variant quantities when payment is confirmed
      if (wasUnpaid) {
        const variantUpdated = await updateVariantQuantities(orderId);
        if (variantUpdated) {
          console.log(`Variant quantities updated for order ${orderId}`);
        }
      }

      // Update product sales count when payment is confirmed
      if (wasUnpaid) {
        const salesUpdated = await updateProductSalesCount(orderId);
        if (salesUpdated) {
          console.log(`Product sales count updated for order ${orderId}`);
        }
      }

      // Update voucher usage when payment is confirmed
      if (wasUnpaid) {
        const voucherUpdated = await updateVoucherUsage(orderId);
        if (voucherUpdated) {
          console.log(`Voucher usage updated for order ${orderId}`);
        }
      }
    }

    await order.save();

    res.json({ message: 'Cập nhật trạng thái thanh toán thành công', order });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi cập nhật trạng thái thanh toán' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Backend: Looking for order with ID:', orderId);
    const order = await Order.findById(orderId);
    console.log('Backend: Order found:', order ? 'Yes' : 'No');
    if (!order) {
      console.log('Backend: Order not found for ID:', orderId);
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    console.log('Backend: Returning order:', order._id);
    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi lấy thông tin đơn hàng' });
  }
};

exports.verifyBankTransfer = async (req, res) => {
  try {
    const { orderId, transferContent } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.transferContent !== transferContent) {
      return res.status(400).json({ message: 'Mã giao dịch không hợp lệ' });
    }
    const wasUnpaid = order.paymentStatus !== 'paid';
    order.paymentStatus = 'paid';
    // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
    // order.orderStatus = 'confirming'; // Không thay đổi
    
    // Update flash sale quantities when payment is confirmed
    if (wasUnpaid) {
      const flashSaleUpdated = await updateFlashSaleQuantities(order._id);
      if (flashSaleUpdated) {
        console.log(`Flash sale quantities updated for order ${order._id}`);
      }
    }

    // Update variant quantities when payment is confirmed
    if (wasUnpaid) {
      const variantUpdated = await updateVariantQuantities(order._id);
      if (variantUpdated) {
        console.log(`Variant quantities updated for order ${order._id}`);
      }
    }

    // Update product sales count when payment is confirmed
    if (wasUnpaid) {
      const salesUpdated = await updateProductSalesCount(order._id);
      if (salesUpdated) {
        console.log(`Product sales count updated for order ${order._id}`);
      }
    }

    // Update voucher usage when payment is confirmed
    if (wasUnpaid) {
      const voucherUpdated = await updateVoucherUsage(order._id);
      if (voucherUpdated) {
        console.log(`Voucher usage updated for order ${order._id}`);
      }
    }
    
    await order.save();

    res.json({ message: 'Xác nhận thanh toán thành công', order });
  } catch (error) {
    console.error('Verify bank transfer error:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi xác nhận thanh toán' });
  }
};

// API: Đối soát tự động đơn hàng với bank transactions
exports.autoConfirmOrders = async (req, res) => {
  try {
    console.log('🔄 Starting auto-confirm process...');
    
    // Kiểm tra kết nối MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected');
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    const pendingOrders = await Order.find({ paymentStatus: 'pending' });
    console.log(`📋 Found ${pendingOrders.length} pending orders`);
    
    let updated = 0;
    let errors = 0;
    
    for (const order of pendingOrders) {
      try {
        console.log('🔍 Checking order:', order._id, 'Amount:', order.totalAmount, 'Content:', order.transferContent);
        
        if (!order.transferContent) {
          console.log('⚠️ Order missing transferContent, skipping...');
          continue;
        }
        
        const matchedTx = await BankTransaction.findOne({
          amount: order.totalAmount,
          description: { $regex: order.transferContent, $options: 'i' },
          status: { $in: ['pending', 'completed'] }
        });
        
        if (matchedTx) {
          console.log('✅ Found matching transaction:', matchedTx._id);
          
          const wasUnpaid = order.paymentStatus !== 'paid';
          order.paymentStatus = 'paid';
          // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
          // order.orderStatus = 'confirming'; // Không thay đổi
          
          // Update flash sale quantities when payment is confirmed
          if (wasUnpaid) {
            try {
              const flashSaleUpdated = await updateFlashSaleQuantities(order._id);
              if (flashSaleUpdated) {
                console.log(`🎯 Flash sale quantities updated for order ${order._id}`);
              }
            } catch (flashError) {
              console.error('⚠️ Flash sale update error:', flashError);
              // Continue processing even if flash sale update fails
            }
          }

          // Update variant quantities when payment is confirmed
          if (wasUnpaid) {
            try {
              const variantUpdated = await updateVariantQuantities(order._id);
              if (variantUpdated) {
                console.log(`🎯 Variant quantities updated for order ${order._id}`);
              }
            } catch (variantError) {
              console.error('⚠️ Variant update error:', variantError);
              // Continue processing even if variant update fails
            }
          }

          // Update product sales count when payment is confirmed
          if (wasUnpaid) {
            try {
              const salesUpdated = await updateProductSalesCount(order._id);
              if (salesUpdated) {
                console.log(`🎯 Product sales count updated for order ${order._id}`);
              }
            } catch (salesError) {
              console.error('⚠️ Sales count update error:', salesError);
              // Continue processing even if sales count update fails
            }
          }

          // Update voucher usage when payment is confirmed
          if (wasUnpaid) {
            try {
              const voucherUpdated = await updateVoucherUsage(order._id);
              if (voucherUpdated) {
                console.log(`🎯 Voucher usage updated for order ${order._id}`);
              }
            } catch (voucherError) {
              console.error('⚠️ Voucher update error:', voucherError);
              // Continue processing even if voucher update fails
            }
          }
          
          await order.save();
          matchedTx.status = 'matched';
          matchedTx.orderId = order._id;
          matchedTx.matchedOrder = true;
          await matchedTx.save();
          
          updated++;
          console.log(`✅ Matched order ${order._id} with transaction ${matchedTx._id}`);
        } else {
          console.log('❌ No matching transaction found for order:', order._id);
        }
      } catch (err) {
        console.error('❌ Error processing order:', order._id, err);
        errors++;
      }
    }
    
    console.log(`🎉 Auto-confirm completed. Updated: ${updated}, Errors: ${errors}`);
    res.json({ 
      message: `Đã đối soát xong. Đã cập nhật ${updated} đơn hàng thành công.`,
      updated,
      errors,
      totalProcessed: pendingOrders.length
    });
    
  } catch (error) {
    console.error('💥 Auto confirm orders error:', error);
    res.status(500).json({ 
      message: 'Đã có lỗi xảy ra khi lấy thông tin đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// API endpoint để manual update flash sale quantities
exports.updateFlashSaleQuantitiesForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Đơn hàng chưa được thanh toán' });
    }
    
    const flashSaleUpdated = await updateFlashSaleQuantities(orderId);
    
    if (flashSaleUpdated) {
      res.json({ 
        message: 'Cập nhật số lượng flash sale thành công',
        orderId: orderId,
        updated: true 
      });
    } else {
      res.json({ 
        message: 'Không có sản phẩm flash sale trong đơn hàng này',
        orderId: orderId,
        updated: false 
      });
    }
  } catch (error) {
    console.error('Error updating flash sale quantities for order:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật số lượng flash sale' });
  }
};

// API: Xử lý thanh toán thành công từ trang ngân hàng
exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🎉 Processing payment success for order:', orderId);
    
    // Kiểm tra kết nối MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected');
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    // Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    console.log('📋 Found order:', {
      id: order._id,
      amount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    });
    
    // Kiểm tra xem đơn hàng đã được thanh toán chưa
    if (order.paymentStatus === 'paid') {
      console.log('✅ Order already paid');
      return res.json({ 
        message: 'Đơn hàng đã được thanh toán',
        order: {
          id: order._id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus
        }
      });
    }
    
    // Cập nhật trạng thái thanh toán
    order.paymentStatus = 'paid';
    // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
    // order.orderStatus = 'confirming'; // Không thay đổi
    order.paidAt = new Date();
    
    // Cập nhật flash sale quantities nếu có
    try {
      const flashSaleUpdated = await updateFlashSaleQuantities(order._id);
      if (flashSaleUpdated) {
        console.log(`🎯 Flash sale quantities updated for order ${order._id}`);
      }
    } catch (flashError) {
      console.error('⚠️ Flash sale update error:', flashError);
    }

    // Cập nhật variant quantities nếu có
    try {
      const variantUpdated = await updateVariantQuantities(order._id);
      if (variantUpdated) {
        console.log(`🎯 Variant quantities updated for order ${order._id}`);
      }
    } catch (variantError) {
      console.error('⚠️ Variant update error:', variantError);
    }

    // Cập nhật product sales count nếu có
    try {
      const salesUpdated = await updateProductSalesCount(order._id);
      if (salesUpdated) {
        console.log(`🎯 Product sales count updated for order ${order._id}`);
      }
    } catch (salesError) {
      console.error('⚠️ Sales count update error:', salesError);
    }

    // Cập nhật voucher usage nếu có
    try {
      const voucherUpdated = await updateVoucherUsage(order._id);
      if (voucherUpdated) {
        console.log(`🎯 Voucher usage updated for order ${order._id}`);
      }
    } catch (voucherError) {
      console.error('⚠️ Voucher update error:', voucherError);
    }
    
    // Lưu đơn hàng
    await order.save();
    
    console.log(`✅ Order ${order._id} payment confirmed successfully`);
    
    res.json({
      message: 'Thanh toán thành công! Đơn hàng đã được xác nhận.',
      order: {
        id: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paidAt: order.paidAt
      }
    });
    
  } catch (error) {
    console.error('💥 Handle payment success error:', error);
    res.status(500).json({ 
      message: 'Đã có lỗi xảy ra khi xử lý thanh toán thành công',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
// Get recent orders
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    console.log('📋 Getting recent orders, limit:', limitNum);
    
    // Kiểm tra kết nối MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected');
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select('_id totalAmount paymentStatus orderStatus customerInfo createdAt');
    
    console.log(`✅ Found ${orders.length} recent orders`);
    
    res.json({
      success: true,
      orders,
      total: orders.length,
      limit: limitNum
    });
    
  } catch (error) {
    console.error('💥 Get recent orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã có lỗi xảy ra khi lấy danh sách đơn hàng gần đây',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Export helper function for external use
exports.updateFlashSaleQuantities = updateFlashSaleQuantities;

exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) {
      query['customerInfo.userId'] = userId;
    }
    const orders = await Order.find(query)
      .populate({
        path: 'items.variantId',
        select: 'dung_luong mau'
      })
      .sort({ createdAt: -1 });

    // Map dung_luong từ variant vào item
    const ordersWithVariantInfo = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map(item => {
        if (item.variantId && typeof item.variantId === 'object') {
          return {
            ...item,
            dung_luong: item.variantId.dung_luong,
            variantId: item.variantId._id // Giữ lại ID
          };
        }
        return item;
      });
      return orderObj;
    });

    res.json({ success: true, orders: ordersWithVariantInfo });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi lấy danh sách đơn hàng' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    // Chỉ cho phép hủy nếu chưa hoàn thành/giao hàng
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ message: 'Đơn hàng đã bị hủy trước đó' });
    }
    if (order.orderStatus === 'completed' || order.orderStatus === 'delivered') {
      return res.status(400).json({ message: 'Không thể hủy đơn đã hoàn thành/giao hàng' });
    }
    
    // Nếu đơn hàng đã thanh toán, hoàn trả lại số lượng sản phẩm và giảm lượt bán
    if (order.paymentStatus === 'paid') {
      try {
        const variantRestored = await restoreVariantQuantities(orderId);
        if (variantRestored) {
          console.log(`Variant quantities restored for cancelled order ${orderId}`);
        }
      } catch (restoreError) {
        console.error('Error restoring variant quantities:', restoreError);
        // Continue with cancellation even if restore fails
      }

      try {
        const salesDecreased = await decreaseProductSalesCount(orderId);
        if (salesDecreased) {
          console.log(`Product sales count decreased for cancelled order ${orderId}`);
        }
      } catch (salesError) {
        console.error('Error decreasing product sales count:', salesError);
        // Continue with cancellation even if sales decrease fails
      }

      // Xử lý hoàn tiền khi hủy đơn hàng đã thanh toán
      try {
        // Chỉ hoàn tiền cho đơn hàng thanh toán qua ví PolyPay, ATM, Momo
        // Không hoàn tiền cho đơn hàng COD chưa thanh toán
        if (order.paymentMethod !== 'cod' || order.paymentStatus === 'paid') {
          const refundAmount = order.totalAmount;
          console.log(`Processing refund for cancelled order ${orderId}: ${refundAmount} VND`);
          
          // Hoàn tiền vào ví PolyPay
          const walletController = require('./walletController');
          const refundResult = await walletController.refund({
            user: { _id: order.customerInfo.userId },
            body: { 
              userId: order.customerInfo.userId.toString(),
              amount: refundAmount,
              orderId: order._id,
              refundMethod: order.paymentMethod,
              refundReason: `Hoàn tiền khi hủy đơn hàng - ${order.paymentMethod.toUpperCase()}`
            }
          });
          
          if (refundResult.success) {
            console.log(`Refund to PolyPay wallet successful for cancelled order ${orderId}: ${refundAmount} VND`);
          } else {
            console.error(`Refund failed for cancelled order ${orderId}:`, refundResult.message);
          }
        } else {
          console.log(`No refund needed for COD order ${orderId} (not paid yet)`);
        }
      } catch (refundError) {
        console.error('Error processing refund for cancelled order:', refundError);
        // Continue with cancellation even if refund fails
        // Admin có thể xử lý hoàn tiền thủ công sau
      }
    }
    
    order.orderStatus = 'cancelled';
    await order.save();
    res.json({ success: true, message: 'Đã hủy đơn hàng', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi hủy đơn hàng' });
  }
};

// Cập nhật trạng thái đơn hàng (packing, shipping, delivered, ...)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    
    console.log('Backend: Updating order status:', {
      orderId,
      orderStatus,
      body: req.body
    });
    
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Backend: Order not found for ID:', orderId);
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    console.log('Backend: Found order:', {
      _id: order._id,
      currentStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus
    });
    
    if (orderStatus) {
      order.orderStatus = orderStatus;
      // Nếu là đơn COD và chuyển sang delivered thì cập nhật luôn paymentStatus = 'paid'
      if (order.paymentMethod === 'cod' && orderStatus === 'delivered') {
        const wasUnpaid = order.paymentStatus !== 'paid';
        order.paymentStatus = 'paid';
        
        console.log('Backend: COD order delivered, updating payment status to paid');
        
        // Update flash sale quantities when COD order is delivered
        if (wasUnpaid) {
          const flashSaleUpdated = await updateFlashSaleQuantities(order._id);
          if (flashSaleUpdated) {
            console.log(`Flash sale quantities updated for COD order ${order._id}`);
          }
        }

        // Update variant quantities when COD order is delivered
        if (wasUnpaid) {
          const variantUpdated = await updateVariantQuantities(order._id);
          if (variantUpdated) {
            console.log(`Variant quantities updated for COD order ${order._id}`);
          }
        }

        // Update product sales count when COD order is delivered
        if (wasUnpaid) {
          const salesUpdated = await updateProductSalesCount(order._id);
          if (salesUpdated) {
            console.log(`Product sales count updated for COD order ${order._id}`);
          }
        }

        // Update voucher usage when COD order is delivered
        if (wasUnpaid) {
          const voucherUpdated = await updateVoucherUsage(order._id);
          if (voucherUpdated) {
            console.log(`Voucher usage updated for COD order ${order._id}`);
          }
        }
      }
      await order.save();
      
      console.log('Backend: Order status updated successfully:', {
        orderId: order._id,
        newStatus: order.orderStatus,
        newPaymentStatus: order.paymentStatus
      });
      
      return res.json({ success: true, order });
    } else {
      console.log('Backend: Missing orderStatus in request body');
      return res.status(400).json({ message: 'Thiếu trường orderStatus' });
    }
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi cập nhật trạng thái đơn hàng' });
  }
};

// Thống kê doanh thu theo ngày/tuần/tháng
exports.getRevenueStats = async (req, res) => {
  try {
    const { type } = req.query;
    let groupId = null;
    let dateFormat = null;
    if (type === 'month') {
      groupId = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
      dateFormat = "%Y-%m";
    } else if (type === 'week') {
      groupId = { year: { $year: "$createdAt" }, week: { $isoWeek: "$createdAt" } };
      dateFormat = "%G-W%V";
    } else {
      // default: day
      groupId = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };
      dateFormat = "%Y-%m-%d";
    }
    const stats = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: {
          _id: groupId,
          totalRevenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thống kê doanh thu: ' + error.message });
  }
};

// Lấy danh sách đơn hàng chưa xác nhận
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'confirming' }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn hàng chưa xác nhận: ' + error.message });
  }
};

// Cập nhật trạng thái thanh toán của đơn hàng
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, walletTransactionId } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({ success: false, message: 'Thiếu trường paymentStatus' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    
    // Cập nhật trạng thái thanh toán
    order.paymentStatus = paymentStatus;
    
    // Nếu thanh toán bằng ví tiền, lưu walletTransactionId
    if (walletTransactionId) {
      order.walletTransactionId = walletTransactionId;
    }
    
    // Nếu thanh toán thành công, cập nhật các thông tin khác
    if (paymentStatus === 'paid') {
      // Giữ nguyên orderStatus là 'confirming' - chờ admin xác nhận
      // order.orderStatus = 'confirming'; // Không thay đổi
      
      // Cập nhật thời gian thanh toán
      order.paidAt = new Date();
      
      // Cập nhật số lượng variant
      await updateVariantQuantities(orderId);
      
      // Cập nhật flash sale quantities
      await updateFlashSaleQuantities(orderId);
      
      // Cập nhật product sales count
      await updateProductSalesCount(orderId);
      
      // Cập nhật voucher usage
      await updateVoucherUsage(orderId);
    }
    
    await order.save();
    
    return res.json({ 
      success: true, 
      message: 'Cập nhật trạng thái thanh toán thành công',
      order 
    });
    
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã có lỗi xảy ra khi cập nhật trạng thái thanh toán' 
    });
  }
}; 
