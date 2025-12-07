const autoPaymentProcessor = require('../scripts/autoPaymentProcessor');

class AutoPaymentController {
  // Bắt đầu auto payment processor
  async startProcessor(req, res) {
    try {
      await autoPaymentProcessor.start();
      
      res.json({
        success: true,
        message: 'Auto payment processor started successfully',
        data: autoPaymentProcessor.getStatus()
      });
    } catch (error) {
      console.error('Error starting auto payment processor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start auto payment processor',
        error: error.message
      });
    }
  }

  // Dừng auto payment processor
  async stopProcessor(req, res) {
    try {
      autoPaymentProcessor.stop();
      
      res.json({
        success: true,
        message: 'Auto payment processor stopped successfully',
        data: autoPaymentProcessor.getStatus()
      });
    } catch (error) {
      console.error('Error stopping auto payment processor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop auto payment processor',
        error: error.message
      });
    }
  }

  // Lấy trạng thái processor
  async getProcessorStatus(req, res) {
    try {
      const status = autoPaymentProcessor.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting processor status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get processor status',
        error: error.message
      });
    }
  }

  // Cập nhật cấu hình processor
  async updateProcessorConfig(req, res) {
    try {
      const { config } = req.body;
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuration is required'
        });
      }

      autoPaymentProcessor.updateConfig(config);
      
      res.json({
        success: true,
        message: 'Processor configuration updated successfully',
        data: autoPaymentProcessor.getStatus()
      });
    } catch (error) {
      console.error('Error updating processor config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update processor configuration',
        error: error.message
      });
    }
  }

  // Chạy xử lý một lần
  async runOnce(req, res) {
    try {
      // Chạy xử lý một lần mà không bắt đầu interval
      await autoPaymentProcessor.processAllAccounts();
      
      res.json({
        success: true,
        message: 'One-time processing completed successfully',
        data: autoPaymentProcessor.getStatus()
      });
    } catch (error) {
      console.error('Error in one-time processing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run one-time processing',
        error: error.message
      });
    }
  }

  // Lấy logs gần đây (có thể mở rộng để lưu logs vào database)
  async getRecentLogs(req, res) {
    try {
      // Đây là một implementation đơn giản
      // Trong thực tế, bạn có thể lưu logs vào database
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Auto payment processor status check',
          processorStatus: autoPaymentProcessor.getStatus()
        }
      ];
      
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Error getting recent logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent logs',
        error: error.message
      });
    }
  }
}

module.exports = new AutoPaymentController(); 