const axios = require('axios');
const BankTransaction = require('../models/bankTransactionModel');
const Order = require('../models/orderModel');

class BankApiService {
  constructor() {
    this.baseUrl = 'https://api.web2m.com/historyapiopenacbv3';
    this.timeout = 10000; // 10 seconds
  }

  // Gọi API để lấy lịch sử giao dịch
  async fetchTransactionHistory(bankCode, accountNumber, token) {
    try {
      const url = `${this.baseUrl}/${token}`;
      
      console.log(`Fetching transactions from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = response.data;
      
      if (!data || !data.transactions) {
        throw new Error('Invalid response format from bank API');
      }

      return data.transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error.message);
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  // Xử lý và lưu giao dịch mới
  async processTransactions(transactions, accountNumber, bankCode) {
    const processedTransactions = [];
    const errors = [];

    console.log(`Processing ${transactions.length} transactions for account ${accountNumber}`);
    console.log('Raw transactions:', JSON.stringify(transactions, null, 2));
    console.log('Transactions:', transactions);

    for (const transaction of transactions) {
      try {
        console.log(`Processing transaction: ${transaction.transactionID}`);
        
        // Kiểm tra xem giao dịch đã tồn tại chưa
        const existingTransaction = await BankTransaction.findOne({
          transactionID: transaction.transactionID
        });

        if (existingTransaction) {
          console.log(`Transaction ${transaction.transactionID} already exists`);
          continue;
        }

        // Chuyển đổi ngày tháng
        const transactionDate = this.parseTransactionDate(transaction.transactionDate);
        console.log(`Parsed date: ${transactionDate}`);
        
        // Tạo giao dịch mới
        const newTransaction = new BankTransaction({
          transactionID: transaction.transactionID,
          amount: parseInt(transaction.amount),
          description: transaction.description,
          transactionDate: transactionDate,
          type: transaction.type,
          accountNumber: accountNumber,
          bankCode: bankCode,
          status: 'pending'
        });

        console.log('Saving transaction:', JSON.stringify(newTransaction, null, 2));
        
        const savedTransaction = await newTransaction.save();
        processedTransactions.push(savedTransaction);
        
        console.log(`✅ Successfully saved transaction: ${transaction.transactionID}`);
      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.transactionID}:`, error.message);
        console.error('Full error:', error);
        errors.push({
          transactionID: transaction.transactionID,
          error: error.message
        });
      }
    }

    console.log(`Processing completed. Processed: ${processedTransactions.length}, Errors: ${errors.length}`);
    
    return {
      processed: processedTransactions,
      errors: errors
    };
  }

  // Parse ngày tháng từ format "dd/mm/yyyy"
  parseTransactionDate(dateString) {
    try {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date();
    }
  }

  // Tự động match giao dịch với đơn hàng
  async autoMatchTransactions() {
    try {
      // Lấy tất cả giao dịch chưa được xử lý
      const unprocessedTransactions = await BankTransaction.findUnprocessedTransactions();
      
      let matchedCount = 0;
      const matchResults = [];

      for (const transaction of unprocessedTransactions) {
        try {
          // Tìm đơn hàng có số tiền tương ứng và chưa thanh toán
          const matchingOrder = await Order.findOne({
            totalAmount: transaction.amount,
            paymentStatus: 'pending',
            paymentMethod: 'bank_transfer'
          }).populate('userId');

          if (matchingOrder) {
            // Cập nhật giao dịch
            transaction.orderId = matchingOrder._id;
            transaction.userId = matchingOrder.userId._id;
            transaction.matchedOrder = true;
            transaction.status = 'completed';
            await transaction.save();

            // Cập nhật đơn hàng: chỉ sang trạng thái chờ xác nhận
            matchingOrder.paymentStatus = 'waiting_confirm';
            matchingOrder.paymentDate = new Date();
            matchingOrder.bankTransactionId = transaction._id;
            await matchingOrder.save();

            matchedCount++;
            matchResults.push({
              transactionId: transaction.transactionID,
              orderId: matchingOrder._id,
              amount: transaction.amount,
              userId: matchingOrder.userId._id
            });

            console.log(`Matched transaction ${transaction.transactionID} with order ${matchingOrder._id}`);
          }
        } catch (error) {
          console.error(`Error matching transaction ${transaction.transactionID}:`, error.message);
        }
      }

      return {
        matchedCount,
        results: matchResults
      };
    } catch (error) {
      console.error('Error in auto match transactions:', error);
      throw error;
    }
  }

  // Lấy thống kê giao dịch
  async getTransactionStats(accountNumber, startDate, endDate) {
    try {
      const query = { accountNumber };
      
      if (startDate && endDate) {
        query.transactionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const stats = await BankTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            matchedCount: {
              $sum: { $cond: ['$matchedOrder', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        pendingCount: 0,
        completedCount: 0,
        matchedCount: 0
      };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  }
}

module.exports = new BankApiService(); 