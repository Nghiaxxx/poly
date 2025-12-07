const BankTransaction = require('../models/bankTransactionModel');
const bankApiService = require('../services/bankApiService');

class BankTransactionController {
  // Lấy tất cả giao dịch
  async getAllTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        accountNumber,
        status,
        startDate,
        endDate,
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Filter theo số tài khoản
      if (accountNumber) {
        query.accountNumber = accountNumber;
      }

      // Filter theo trạng thái
      if (status) {
        query.status = status;
      }

      // Filter theo khoảng thời gian
      if (startDate && endDate) {
        query.transactionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Sắp xếp
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const transactions = await BankTransaction.find(query)
        .populate('orderId', 'orderNumber totalAmount')
        .populate('userId', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BankTransaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Lấy giao dịch theo ID
  async getTransactionById(req, res) {
    try {
      const { id } = req.params;

      const transaction = await BankTransaction.findById(id)
        .populate('orderId', 'orderNumber totalAmount items')
        .populate('userId', 'name email phone');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Lấy lịch sử giao dịch từ API ngân hàng
  async fetchBankTransactions(req, res) {
    try {
      const { bankCode, accountNumber, token } = req.body;

      if (!bankCode || !accountNumber || !token) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: bankCode, accountNumber, token'
        });
      }

      // Gọi API để lấy lịch sử giao dịch
      const transactions = await bankApiService.fetchTransactionHistory(
        bankCode,
        accountNumber,
        token
      );

      // Xử lý và lưu giao dịch mới
      const result = await bankApiService.processTransactions(
        transactions,
        accountNumber,
        bankCode
      );

      res.json({
        success: true,
        message: 'Transactions fetched and processed successfully',
        data: {
          totalFetched: transactions.length,
          newTransactions: result.processed.length,
          errors: result.errors
        }
      });
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bank transactions',
        error: error.message
      });
    }
  }

  // Tự động match giao dịch với đơn hàng
  async autoMatchTransactions(req, res) {
    try {
      const result = await bankApiService.autoMatchTransactions();

      res.json({
        success: true,
        message: 'Auto matching completed',
        data: {
          matchedCount: result.matchedCount,
          results: result.results
        }
      });
    } catch (error) {
      console.error('Error in auto match transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to auto match transactions',
        error: error.message
      });
    }
  }

  // Match thủ công giao dịch với đơn hàng
  async manualMatchTransaction(req, res) {
    try {
      const { transactionId, orderId } = req.body;

      if (!transactionId || !orderId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: transactionId, orderId'
        });
      }

      const transaction = await BankTransaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const Order = require('../models/orderModel');
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Cập nhật giao dịch
      transaction.orderId = orderId;
      transaction.userId = order.userId;
      transaction.matchedOrder = true;
      transaction.status = 'completed';
      await transaction.save();

      // Cập nhật đơn hàng
      order.paymentStatus = 'paid';
      order.paymentDate = new Date();
      order.bankTransactionId = transaction._id;
      await order.save();

      res.json({
        success: true,
        message: 'Transaction matched successfully',
        data: {
          transactionId: transaction._id,
          orderId: order._id,
          amount: transaction.amount
        }
      });
    } catch (error) {
      console.error('Error in manual match transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to match transaction',
        error: error.message
      });
    }
  }

  // Lấy thống kê giao dịch
  async getTransactionStats(req, res) {
    try {
      const { accountNumber, startDate, endDate } = req.query;

      if (!accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Account number is required'
        });
      }

      const stats = await bankApiService.getTransactionStats(
        accountNumber,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction stats',
        error: error.message
      });
    }
  }

  // Cập nhật trạng thái giao dịch
  async updateTransactionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const transaction = await BankTransaction.findById(id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      transaction.status = status;
      if (note) {
        transaction.note = note;
      }
      await transaction.save();

      res.json({
        success: true,
        message: 'Transaction status updated successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction status',
        error: error.message
      });
    }
  }

  // Xóa giao dịch
  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;

      const transaction = await BankTransaction.findById(id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Kiểm tra xem giao dịch đã được match chưa
      if (transaction.matchedOrder) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete transaction that has been matched with an order'
        });
      }

      await BankTransaction.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: error.message
      });
    }
  }

  // Kiểm tra giao dịch theo description và orderId
  async checkTransactionByDescription(req, res) {
    try {
      const { orderId, amount } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'OrderId is required'
        });
      }

      console.log(`🔍 Checking transaction for order: ${orderId}, amount: ${amount}`);

      // Tìm giao dịch có description chứa orderId và số tiền khớp
      const query = {
        description: { $regex: orderId, $options: 'i' },
        status: { $in: ['pending', 'completed'] }
      };

      // Nếu có amount, thêm điều kiện số tiền
      if (amount) {
        query.amount = parseInt(amount);
      }

      const transaction = await BankTransaction.findOne(query)
        .populate('orderId', 'orderNumber totalAmount paymentStatus')
        .sort({ transactionDate: -1 });

      if (transaction) {
        console.log(`✅ Found matching transaction: ${transaction._id}`);
        
        // Nếu giao dịch chưa được match với order, thực hiện match
        if (!transaction.matchedOrder && transaction.status === 'pending') {
          const Order = require('../models/orderModel');
          // Tìm order theo transferContent thay vì orderId
          const order = await Order.findOne({ transferContent: orderId });
          
          if (order && order.paymentStatus === 'pending') {
            // Cập nhật giao dịch
            transaction.orderId = order._id;
            transaction.userId = order.customerInfo.userId;
            transaction.matchedOrder = true;
            transaction.status = 'completed';
            await transaction.save();

            // Cập nhật đơn hàng
            order.paymentStatus = 'paid';
            order.paymentDate = new Date();
            order.bankTransactionId = transaction._id;
            await order.save();

            console.log(`✅ Successfully matched transaction ${transaction._id} with order ${order._id}`);
          }
        }

        res.json({
          success: true,
          message: 'Transaction found and processed',
          data: {
            transaction: transaction,
            found: true,
            matched: transaction.matchedOrder
          }
        });
      } else {
        console.log(`❌ No matching transaction found for order: ${orderId}`);
        res.json({
          success: true,
          message: 'No matching transaction found',
          data: {
            found: false,
            matched: false
          }
        });
      }
    } catch (error) {
      console.error('Error checking transaction by description:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check transaction',
        error: error.message
      });
    }
  }
}

module.exports = new BankTransactionController(); 