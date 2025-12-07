const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const { verifyToken, verifyAdmin } = require('../controllers/userController');

// Lấy thống kê cho dashboard admin
router.get('/statistics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Tính toán khoảng thời gian dựa trên period
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;
    
    if (period === 'today') {
      // Hôm nay
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      
      // Hôm qua
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(startDate.getDate() - 1);
      previousEndDate = new Date(endDate);
      previousEndDate.setDate(endDate.getDate() - 1);
    } else if (period === 'week') {
      // Tuần này
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Thứ 2
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Chủ nhật
      currentWeekEnd.setHours(23, 59, 59, 999);
      
      startDate = currentWeekStart;
      endDate = currentWeekEnd;
      
      // Tuần trước
      previousStartDate = new Date(currentWeekStart);
      previousStartDate.setDate(currentWeekStart.getDate() - 7);
      previousEndDate = new Date(currentWeekEnd);
      previousEndDate.setDate(currentWeekEnd.getDate() - 7);
    } else if (period === 'month') {
      // Tháng này
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Tháng trước
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    // Lấy đơn hàng cho khoảng thời gian được chỉ định
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      paymentStatus: 'paid'
    });
    
    // Lấy đơn hàng cho khoảng thời gian trước để so sánh
    const previousOrders = await Order.find({
      createdAt: {
        $gte: previousStartDate,
        $lte: previousEndDate
      },
      paymentStatus: 'paid'
    });

    // Tạo dữ liệu cho chart dựa trên period
    let sales, revenue, profit, labels;
    
    if (period === 'today') {
      // Dữ liệu theo giờ trong ngày
      sales = new Array(24).fill(0);
      revenue = new Array(24).fill(0);
      profit = new Array(24).fill(0);
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      
      orders.forEach(order => {
        const hour = order.createdAt.getHours();
        sales[hour] += order.items.reduce((sum, item) => sum + item.quantity, 0);
        revenue[hour] += Math.round(order.totalAmount / 1000000);
        profit[hour] += Math.round(order.totalAmount * 0.3 / 1000000);
      });
    } else if (period === 'week') {
      // Dữ liệu theo ngày trong tuần
      sales = new Array(7).fill(0);
      revenue = new Array(7).fill(0);
      profit = new Array(7).fill(0);
      labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayOfWeek = orderDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        sales[dayIndex] += order.items.reduce((sum, item) => sum + item.quantity, 0);
        revenue[dayIndex] += Math.round(order.totalAmount / 1000000);
        profit[dayIndex] += Math.round(order.totalAmount * 0.3 / 1000000);
      });
    } else if (period === 'month') {
      // Dữ liệu theo ngày trong tháng
      const daysInMonth = endDate.getDate();
      sales = new Array(daysInMonth).fill(0);
      revenue = new Array(daysInMonth).fill(0);
      profit = new Array(daysInMonth).fill(0);
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      
      orders.forEach(order => {
        const day = order.createdAt.getDate() - 1;
        sales[day] += order.items.reduce((sum, item) => sum + item.quantity, 0);
        revenue[day] += Math.round(order.totalAmount / 1000000);
        profit[day] += Math.round(order.totalAmount * 0.3 / 1000000);
      });
    }

    // Lấy thống kê tổng hợp cho khoảng thời gian
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalProfit = totalRevenue * 0.3;
    const totalProducts = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    // Tính thống kê khoảng thời gian trước để so sánh
    const previousTotalOrders = previousOrders.length;
    const previousTotalRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const previousTotalProducts = previousOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    // Tính tỷ lệ tăng trưởng
    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(2);
    };

    const orderGrowthRate = calculateGrowthRate(totalOrders, previousTotalOrders);
    const revenueGrowthRate = calculateGrowthRate(totalRevenue, previousTotalRevenue);
    const productGrowthRate = calculateGrowthRate(totalProducts, previousTotalProducts);

    // Lấy thống kê tổng quan (tất cả thời gian)
    const [totalUsers, totalAllOrders, totalProductsInDb] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }), // Exclude admin users
      Order.countDocuments(), // All orders
      Product.countDocuments() // All products in database
    ]);

    // Tính toán thống kê tổng quan cho tháng trước để so sánh
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    const [lastMonthUsers, lastMonthOrders, lastMonthProducts] = await Promise.all([
      User.countDocuments({ 
        role: { $ne: 'admin' },
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      }),
      Order.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      }),
      Product.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      })
    ]);

    // Simulated view count (có thể thay thế bằng analytics thực tế)
    const viewCount = 3456;
    const lastMonthViewCount = 3200;

    // Tính tỷ lệ tăng trưởng tổng quan
    const userGrowthRate = calculateGrowthRate(totalUsers, lastMonthUsers);
    const allOrderGrowthRate = calculateGrowthRate(totalAllOrders, lastMonthOrders);
    const productDbGrowthRate = calculateGrowthRate(totalProductsInDb, lastMonthProducts);
    const viewGrowthRate = calculateGrowthRate(viewCount, lastMonthViewCount);

    // Xác định period label
    const getPeriodLabel = (period) => {
      switch(period) {
        case 'today': return 'Hôm nay';
        case 'week': return 'Tuần này';
        case 'month': return 'Tháng này';
        default: return 'Tuần này';
      }
    };

    res.json({
      sales,
      revenue,
      profit,
      labels,
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue / 1000000), // Chuyển đổi sang triệu VNĐ
        totalProfit: Math.round(totalProfit / 1000000), // Chuyển đổi sang triệu VNĐ
        totalProducts,
        period: getPeriodLabel(period),
        growthRates: {
          orders: orderGrowthRate,
          revenue: revenueGrowthRate,
          products: productGrowthRate
        }
      },
      overall: {
        totalUsers,
        totalAllOrders,
        totalProductsInDb,
        viewCount: viewCount.toLocaleString('vi-VN'),
        growthRates: {
          users: userGrowthRate,
          orders: allOrderGrowthRate,
          products: productDbGrowthRate,
          views: viewGrowthRate
        }
      }
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê',
      error: error.message 
    });
  }
});

// Lấy thống kê theo tháng
router.get('/statistics/monthly', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      paymentStatus: 'paid'
    });

    const daysInMonth = endDate.getDate();
    const dailyRevenue = new Array(daysInMonth).fill(0);
    const dailySales = new Array(daysInMonth).fill(0);
    const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

    orders.forEach(order => {
      const day = order.createdAt.getDate() - 1;
      dailyRevenue[day] += Math.round(order.totalAmount / 1000000);
      dailySales[day] += order.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    res.json({
      revenue: dailyRevenue,
      sales: dailySales,
      labels,
      period: `Tháng ${month}/${year}`
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo tháng:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê tháng',
      error: error.message 
    });
  }
});

// Lấy thống kê sản phẩm bán chạy
router.get('/statistics/top-products', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
      paymentStatus: 'paid'
    }).populate('items.productId', 'TenSP hinh');

    // Tính doanh số sản phẩm
    const productStats = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId._id.toString();
        if (!productStats[productId]) {
          productStats[productId] = {
            productId: item.productId._id,
            name: item.productId.TenSP,
            image: item.productId.hinh,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        productStats[productId].totalSold += item.quantity;
        productStats[productId].totalRevenue += item.price * item.quantity;
      });
    });

    // Sắp xếp theo tổng số bán và lấy sản phẩm hàng đầu
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, parseInt(limit));

    res.json(topProducts);

  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm bán chạy:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy sản phẩm bán chạy',
      error: error.message 
    });
  }
});

// Lấy thống kê thời gian thực
router.get('/statistics/realtime', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(todayEnd.getDate() - 1);

    // Lấy thống kê hôm nay
    const todayOrders = await Order.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      paymentStatus: 'paid'
    });

    // Lấy thống kê hôm qua
    const yesterdayOrders = await Order.find({
      createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      paymentStatus: 'paid'
    });

    // Tính toán thống kê
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayOrderCount = todayOrders.length;
    const todayProductCount = todayOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const yesterdayOrderCount = yesterdayOrders.length;
    const yesterdayProductCount = yesterdayOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    // Tính tỷ lệ tăng trưởng
    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(2);
    };

    // Lấy đơn hàng chờ xử lý
    const pendingOrders = await Order.countDocuments({ orderStatus: 'confirming' });

    // Lấy 5 đơn hàng gần đây
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('totalAmount orderStatus createdAt customerInfo');

    res.json({
      today: {
        revenue: Math.round(todayRevenue / 1000000), // Chuyển đổi sang triệu VNĐ
        orderCount: todayOrderCount,
        productCount: todayProductCount
      },
      yesterday: {
        revenue: Math.round(yesterdayRevenue / 1000000), // Chuyển đổi sang triệu VNĐ
        orderCount: yesterdayOrderCount,
        productCount: yesterdayProductCount
      },
      growthRates: {
        revenue: calculateGrowthRate(todayRevenue, yesterdayRevenue),
        orders: calculateGrowthRate(todayOrderCount, yesterdayOrderCount),
        products: calculateGrowthRate(todayProductCount, yesterdayProductCount)
      },
      pendingOrders,
      recentOrders
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê thời gian thực:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê thời gian thực',
      error: error.message 
    });
  }
});

// Lấy thống kê doanh thu theo ngày/tuần/tháng
router.get('/statistics/revenue', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { type = 'day' } = req.query;
    
    const now = new Date();
    let startDate, endDate;
    
    if (type === 'day') {
      // Lấy dữ liệu 7 ngày gần nhất
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = now;
    } else if (type === 'week') {
      // Lấy dữ liệu 4 tuần gần nhất
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 28);
      endDate = now;
    } else if (type === 'month') {
      // Lấy dữ liệu 12 tháng gần nhất
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      endDate = now;
    }

    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      paymentStatus: 'paid'
    });

    // Nhóm dữ liệu theo ngày/tuần/tháng
    let groupedData = {};
    
    orders.forEach(order => {
      let key;
      if (type === 'day') {
        key = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (type === 'week') {
        const weekStart = new Date(order.createdAt);
        weekStart.setDate(order.createdAt.getDate() - order.createdAt.getDay() + 1);
        key = weekStart.toISOString().split('T')[0];
      } else if (type === 'month') {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += order.totalAmount;
    });

    // Chuyển đổi sang format cho chart
    const labels = Object.keys(groupedData).sort();
    const revenue = labels.map(key => Math.round(groupedData[key] / 1000)); // Chuyển sang nghìn VNĐ

    res.json({
      revenue,
      labels,
      period: type === 'day' ? 'Ngày' : type === 'week' ? 'Tuần' : 'Tháng'
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê doanh thu:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê doanh thu',
      error: error.message 
    });
  }
});

// Lấy thống kê trạng thái đơn hàng
router.get('/statistics/order-status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Lấy số lượng đơn hàng theo từng trạng thái
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Map trạng thái sang tiếng Việt
    const statusMap = {
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy',
      'shipping': 'Đang vận chuyển',
      'confirming': 'Chờ xác nhận',
      'packing': 'Đang đóng gói',
      'processing': 'Đang xử lý'
    };

    // Chuyển đổi dữ liệu thành format cần thiết cho chart
    const labels = [];
    const series = [];

    orderStatusStats.forEach(stat => {
      const status = stat._id;
      const label = statusMap[status] || status;
      labels.push(label);
      series.push(stat.count);
    });

    res.json({
      labels,
      series
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê trạng thái đơn hàng:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê trạng thái đơn hàng',
      error: error.message 
    });
  }
});

// Lấy thống kê trạng thái đơn hàng chi tiết
router.get('/statistics/order-status-detailed', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Lấy số lượng đơn hàng theo từng trạng thái
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Map trạng thái sang tiếng Việt và màu sắc theo ảnh
    const statusConfig = {
      'confirmed': { 
        label: 'confirmed', 
        color: '#10B981', // Green
        icon: 'check'
      },
      'delivered': { 
        label: 'Đã giao hàng', 
        color: '#EF4444', // Red
        icon: 'check'
      },
      'cancelled': { 
        label: 'Đã hủy', 
        color: '#3B82F6', // Blue
        icon: 'x'
      },
      'confirming': { 
        label: 'Chờ xác nhận', 
        color: '#F97316', // Orange
        icon: 'clock'
      },
      'packing': { 
        label: 'Đang đóng gói', 
        color: '#8B5CF6', // Purple
        icon: 'package'
      },
      'shipping': { 
        label: 'Đang vận chuyển', 
        color: '#80CAEE', // Light Blue
        icon: 'truck'
      },
      'processing': { 
        label: 'Chờ xử lý', 
        color: '#059669', // Dark Green
        icon: 'gear'
      }
    };

    // Chuyển đổi dữ liệu thành format cần thiết cho donut chart
    const chartData = [];
    const summaryCards = [];

    orderStatusStats.forEach(stat => {
      const status = stat._id;
      const config = statusConfig[status];
      
      if (config) {
        chartData.push({
          label: config.label,
          value: stat.count,
          color: config.color,
          icon: config.icon
        });

        // Tạo summary cards cho 2 trạng thái chính (Đã giao hàng và Chờ xử lý)
        if (status === 'delivered' || status === 'processing') {
          summaryCards.push({
            status: status === 'delivered' ? 'Đã giao' : 'Chờ xử lý',
            count: stat.count,
            color: config.color,
            icon: config.icon
          });
        }
      }
    });

    // Thêm các trạng thái còn lại nếu không có dữ liệu
    const allStatuses = ['confirmed', 'delivered', 'cancelled', 'confirming', 'packing', 'shipping', 'processing'];
    allStatuses.forEach(status => {
      const existingData = chartData.find(item => item.label === statusConfig[status].label);
      if (!existingData) {
        chartData.push({
          label: statusConfig[status].label,
          value: 0,
          color: statusConfig[status].color,
          icon: statusConfig[status].icon
        });
      }
    });

    // Sắp xếp theo thứ tự như trong ảnh
    const orderMap = {
      'confirmed': 0,
      'delivered': 1,
      'cancelled': 2,
      'confirming': 3,
      'packing': 4,
      'shipping': 5,
      'processing': 6
    };

    chartData.sort((a, b) => {
      const aOrder = orderMap[a.label] ?? 999;
      const bOrder = orderMap[b.label] ?? 999;
      return aOrder - bOrder;
    });

    res.json({
      chartData,
      summaryCards
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê trạng thái đơn hàng chi tiết:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê trạng thái đơn hàng chi tiết',
      error: error.message 
    });
  }
});

module.exports = router; 