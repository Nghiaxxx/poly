require('dotenv').config();
const mongoose = require('mongoose');
const BankTransaction = require('../models/bankTransactionModel');
const Order = require('../models/orderModel');

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DB_ShopTao';

if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected for auto payment processor'))
    .catch(err => console.error('MongoDB connection error:', err));
}

class AutoPaymentProcessor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.config = {
      interval: 5 * 60 * 1000, // 5 phút mặc định
      enabled: true
    };
    this.lastProcessedAt = null;
    this.processedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Bắt đầu processor với interval
   */
  async start() {
    if (this.isRunning) {
      console.log('Auto payment processor is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting auto payment processor...');
    
    // Chạy ngay lập tức lần đầu
    await this.processAllAccounts();
    
    // Sau đó chạy theo interval
    this.intervalId = setInterval(async () => {
      if (this.config.enabled) {
        await this.processAllAccounts();
      }
    }, this.config.interval);

    console.log(`Auto payment processor started with interval: ${this.config.interval / 1000}s`);
  }

  /**
   * Dừng processor
   */
  stop() {
    if (!this.isRunning) {
      console.log('Auto payment processor is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Auto payment processor stopped');
  }

  /**
   * Xử lý tất cả tài khoản - match giao dịch với đơn hàng
   */
  async processAllAccounts() {
    try {
      console.log('🔄 Starting auto payment processing...');
      this.lastProcessedAt = new Date();

      // Lấy tất cả giao dịch chưa được xử lý
      const unprocessedTransactions = await BankTransaction.find({
        status: 'pending',
        matchedOrder: false,
        type: 'IN' // Chỉ xử lý giao dịch vào
      }).sort({ transactionDate: -1 });

      console.log(`📋 Found ${unprocessedTransactions.length} unprocessed transactions`);

      let matchedCount = 0;
      let errorCount = 0;

      for (const transaction of unprocessedTransactions) {
        try {
          // Tìm đơn hàng có số tiền khớp và chưa thanh toán
          const matchingOrder = await Order.findOne({
            totalAmount: transaction.amount,
            paymentStatus: 'pending',
            paymentMethod: { $in: ['atm', 'bank_transfer'] }
          }).populate('customerInfo.userId');

          if (matchingOrder) {
            // Kiểm tra thêm bằng transferContent nếu có
            let shouldMatch = true;
            
            if (matchingOrder.transferContent) {
              // Nếu có transferContent, kiểm tra xem có trong description không
              const transferContent = matchingOrder.transferContent.toString();
              if (!transaction.description.includes(transferContent)) {
                // Nếu không khớp transferContent, bỏ qua
                console.log(`⚠️ Amount matches but transferContent doesn't match for transaction ${transaction.transactionID}`);
                continue;
              }
            }

            if (shouldMatch) {
              // Cập nhật giao dịch
              transaction.orderId = matchingOrder._id;
              transaction.userId = matchingOrder.customerInfo?.userId || matchingOrder.customerInfo?.userId?._id;
              transaction.matchedOrder = true;
              transaction.status = 'completed';
              await transaction.save();

              // Cập nhật đơn hàng
              matchingOrder.paymentStatus = 'waiting_confirm';
              matchingOrder.paymentDate = new Date();
              matchingOrder.bankTransactionId = transaction._id;
              await matchingOrder.save();

              matchedCount++;
              console.log(`✅ Matched transaction ${transaction.transactionID} with order ${matchingOrder._id} (Amount: ${transaction.amount})`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing transaction ${transaction.transactionID}:`, error.message);
        }
      }

      this.processedCount += matchedCount;
      this.errorCount += errorCount;

      console.log(`✅ Auto payment processing completed. Matched: ${matchedCount}, Errors: ${errorCount}`);
      
      return {
        success: true,
        matchedCount,
        errorCount,
        totalProcessed: unprocessedTransactions.length
      };
    } catch (error) {
      console.error('❌ Error in processAllAccounts:', error);
      this.errorCount++;
      throw error;
    }
  }

  /**
   * Cập nhật cấu hình
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };

    // Nếu đang chạy và interval thay đổi, restart
    if (this.isRunning && newConfig.interval) {
      this.stop();
      this.start();
    }

    console.log('Processor config updated:', this.config);
  }

  /**
   * Lấy trạng thái processor
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastProcessedAt: this.lastProcessedAt,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      nextRunIn: this.isRunning && this.intervalId 
        ? `${this.config.interval / 1000}s` 
        : null
    };
  }
}

// Export singleton instance
const processor = new AutoPaymentProcessor();

// Nếu chạy trực tiếp từ command line
if (require.main === module) {
  const command = process.argv[2];

  async function run() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected');

      switch (command) {
        case 'start':
          await processor.start();
          // Giữ process chạy
          process.on('SIGINT', () => {
            console.log('\nStopping processor...');
            processor.stop();
            mongoose.connection.close();
            process.exit(0);
          });
          break;

        case 'stop':
          processor.stop();
          await mongoose.connection.close();
          break;

        case 'once':
          await processor.processAllAccounts();
          await mongoose.connection.close();
          break;

        case 'status':
          console.log('Processor Status:', JSON.stringify(processor.getStatus(), null, 2));
          await mongoose.connection.close();
          break;

        default:
          console.log('Usage: node autoPaymentProcessor.js [start|stop|once|status]');
          await mongoose.connection.close();
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }

  run();
}

module.exports = processor;

