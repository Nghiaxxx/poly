const mongoose = require('mongoose');
const Vi = require('../models/virtualWalletModel');
const NapTien = require('../models/napTienModel');
const HoanTien = require('../models/hoanTienModel');

class WalletController {
  async getOrCreateWallet(userId) {
    let wallet = await Vi.findOne({ Id_nguoi_dung: userId });
    if (!wallet) {
      wallet = await Vi.create({ Id_nguoi_dung: userId, So_tien: 0 });
    }
    return wallet;
  }

  // GET /api/wallet/balance
  async getBalance(req, res) {
    try {
      const userId = req.user?._id || req.query.userId;
      if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
      const wallet = await this.getOrCreateWallet(userId);
      return res.json({ success: true, data: { balance: wallet.So_tien, walletId: wallet._id } });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/wallet/deposit - Nạp tiền vào bảng Nap_tien
  async deposit(req, res) {
    try {
      const userId = req.user?._id || req.body.userId;
      const { amount } = req.body;
      if (!userId || !amount || amount <= 0) throw new Error('Invalid params');

      const wallet = await this.getOrCreateWallet(userId);
      const newBalance = wallet.So_tien + amount;
      
      // Update wallet balance in bảng Vi
      wallet.So_tien = newBalance;
      await wallet.save();

      // Create nap tien record in bảng Nap_tien
      const napTien = await NapTien.create({
        Id_vi: wallet._id,
        So_tien: amount,
        Ngay_nap_tien: new Date()
      });

      return res.json({ success: true, data: napTien });
    } catch (e) {
      console.error('Deposit error:', e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/wallet/refund - Hoàn tiền vào bảng Hoan_tien
  async refund(req, res) {
    try {
      const userId = req.user?._id || req.body.userId;
      const { amount, returnRequestId, orderId, refundMethod, refundReason } = req.body;
      if (!userId || !amount || amount <= 0) throw new Error('Invalid params');

      const wallet = await this.getOrCreateWallet(userId);
      const newBalance = wallet.So_tien + amount;
      
      // Update wallet balance in bảng Vi
      wallet.So_tien = newBalance;
      await wallet.save();

      // Create hoan tien record in bảng Hoan_tien
      const hoanTien = await HoanTien.create({
        Id_vi: wallet._id,
        So_tien: amount,
        Ngay_hoan_tien: new Date(),
        returnRequestId: returnRequestId || null, // Liên kết với yêu cầu trả hàng nếu có
        orderId: orderId || null, // Liên kết với đơn hàng nếu có
        refundMethod: refundMethod || 'wallet', // Phương thức hoàn tiền
        refundReason: refundReason || 'Hoàn tiền từ yêu cầu trả hàng' // Lý do hoàn tiền
      });

      console.log(`Refund processed: User ${userId}, Amount: ${amount}, Method: ${refundMethod || 'wallet'}, New Balance: ${newBalance}`);

      return res.json({ 
        success: true, 
        data: hoanTien,
        newBalance: newBalance,
        message: 'Hoàn tiền thành công'
      });
    } catch (e) {
      console.error('Refund error:', e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/wallet/pay - Chi tiêu (thanh toán) vào bảng Hoan_tien
  async pay(req, res) {
    try {
      const userId = req.user?._id || req.body.userId;
      const { amount } = req.body;
      if (!userId || !amount || amount <= 0) throw new Error('Invalid params');

      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.So_tien < amount) throw new Error('Insufficient balance');

      const newBalance = wallet.So_tien - amount;
      
      // Update wallet balance in bảng Vi
      wallet.So_tien = newBalance;
      await wallet.save();

      // Create hoan tien record (số âm để thể hiện chi tiêu) in bảng Hoan_tien
      const hoanTien = await HoanTien.create({
        Id_vi: wallet._id,
        So_tien: -amount, // Số âm để thể hiện chi tiêu
        Ngay_hoan_tien: new Date()
      });

      return res.json({ success: true, data: hoanTien });
    } catch (e) {
      console.error('Payment error:', e);
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  // GET /api/wallet/history - Lịch sử giao dịch từ cả 2 bảng
  async history(req, res) {
    try {
      const userId = req.user?._id || req.query.userId;
      const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
      if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
      
      const wallet = await this.getOrCreateWallet(userId);
      
      // Lấy từ bảng Nap_tien
      const napTienList = await NapTien.find({ Id_vi: wallet._id })
        .sort({ Ngay_nap_tien: -1 })
        .limit(limit);
      
      // Lấy từ bảng Hoan_tien
      const hoanTienList = await HoanTien.find({ Id_vi: wallet._id })
        .sort({ Ngay_hoan_tien: -1 })
        .limit(limit);

      // Gộp và sắp xếp theo thời gian
      const allTransactions = [
        ...napTienList.map(t => ({ 
          ...t.toObject(), 
          type: 'deposit', 
          date: t.Ngay_nap_tien,
          table: 'Nap_tien'
        })),
        ...hoanTienList.map(t => ({ 
          ...t.toObject(), 
          type: t.So_tien > 0 ? 'refund' : 'payment', 
          date: t.Ngay_hoan_tien,
          table: 'Hoan_tien'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

      return res.json({ success: true, data: allTransactions });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/wallet/pay-order - Thanh toán đơn hàng bằng ví
  async payOrder(req, res) {
    try {
      const userId = req.user?._id || req.body.userId;
      const { orderId, amount } = req.body;
      
      if (!userId || !orderId || !amount || amount <= 0) {
        throw new Error('Thiếu thông tin: userId, orderId, amount');
      }

      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.So_tien < amount) {
        throw new Error('Số dư ví không đủ để thanh toán');
      }

      // Trừ tiền từ ví (bảng Vi)
      const newBalance = wallet.So_tien - amount;
      wallet.So_tien = newBalance;
      await wallet.save();

      // Tạo hoan tien record (số âm để thể hiện chi tiêu) trong bảng Hoan_tien
      const hoanTien = await HoanTien.create({
        Id_vi: wallet._id,
        So_tien: -amount,
        Ngay_hoan_tien: new Date()
      });

      return res.json({ 
        success: true, 
        data: hoanTien,
        message: 'Thanh toán đơn hàng thành công'
      });
    } catch (e) {
      console.error('Pay order error:', e);
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  // POST /api/wallet/deposit-from-momo - Nạp tiền vào ví từ MOMO callback
  async depositFromMomo(userId, amount, orderId, transId) {
    try {
      if (!userId || !amount || amount <= 0) {
        throw new Error('Invalid params: userId, amount required');
      }

      const wallet = await this.getOrCreateWallet(userId);
      const newBalance = wallet.So_tien + amount;
      
      // Update wallet balance in bảng Vi
      wallet.So_tien = newBalance;
      await wallet.save();

      // Create nap tien record in bảng Nap_tien với thông tin MOMO
      const napTien = await NapTien.create({
        Id_vi: wallet._id,
        So_tien: amount,
        Ngay_nap_tien: new Date(),
        // Thêm metadata cho MOMO
        Mo_ta: `Nạp tiền qua MOMO - Order: ${orderId}, TransId: ${transId}`,
        Trang_thai: 'completed',
        Phuong_thuc: 'momo'
      });

      console.log(`Wallet deposit from MOMO successful: User ${userId}, Amount ${amount}, New Balance ${newBalance}`);

      return {
        success: true,
        data: {
          napTien: napTien,
          newBalance: newBalance,
          orderId: orderId,
          transId: transId
        },
        message: 'Nạp tiền vào ví thành công'
      };
    } catch (e) {
      console.error('Deposit from MOMO error:', e);
      return {
        success: false,
        message: e.message
      };
    }
  }

  // GET /api/wallet/refund-history - Lấy lịch sử hoàn tiền
  async getRefundHistory(req, res) {
    try {
      const { userId, returnRequestId, orderId, limit = 20, page = 1 } = req.query;
      
      let filter = {};
      if (userId) filter.userId = userId;
      if (returnRequestId) filter.returnRequestId = returnRequestId;
      if (orderId) filter.orderId = orderId;
      
      const hoanTienList = await HoanTien.find(filter)
        .populate('Id_vi', 'Id_nguoi_dung')
        .populate('returnRequestId', 'reason description status')
        .populate('orderId', 'totalAmount paymentMethod')
        .sort({ Ngay_hoan_tien: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await HoanTien.countDocuments(filter);
      
      return res.json({
        success: true,
        data: hoanTienList,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total
        }
      });
    } catch (e) {
      console.error('Get refund history error:', e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

module.exports = new WalletController(); 