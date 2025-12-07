require('dotenv').config();
const fs = require('fs');
const https = require('https');
const http = require('http');
const express = require('express');
const mongoose = require("mongoose");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

require('./models/userModel');
require('./models/orderModel');
require('./models/bankTransactionModel');
require('./models/categoryModel');
require('./models/productModel');
require('./models/variantModel');
require('./models/voucherModel');
require('./models/giftVoucherModel');
require('./models/userVoucherModel');
require('./models/newsModel');
require('./models/newsCategoryModel');
require('./models/reviewModel');
require('./models/settingModel');
require('./models/FlashSale');
require('./models/FlashSaleVariant');
require('./models/userEventModel');
require('./models/luckyWheelResultModel');
require('./models/imageReviewModel');
require('./models/addressModel');
require('./models/virtualWalletModel'); // Vi
require('./models/napTienModel'); // Nap_tien
require('./models/hoanTienModel'); // Hoan_tien

// Connect to MongoDB after models are registered
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/DB_ShopTao")
  .then(() => console.log("MongoDB đã kết nối hẹ hẹ hẹ http://localhost:3000/ "))
  .catch((err) => console.log(err));

var cors = require("cors");
var createError = require("http-errors");

var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var categoriesRouter = require("./routes/categories");
var productsRouter = require("./routes/products");
const variantRoutes = require("./routes/variants");
const settingsRouter = require("./routes/settings");
const flashsalesRouter = require('./routes/flashsales');
const newsCategoryRouter = require("./routes/newsCategories");
const newsRouter = require("./routes/news");
const voucherRouter = require('./routes/vouchers');
const giftVoucherRouter = require('./routes/giftVouchers');
const ordersRouter = require('./routes/orders');
const chatAiRouter = require('./routes/chat-ai');
const reviewsRouter = require('./routes/reviews');
const uploadReviewImageRouter = require('./routes/uploadReviewImage');
const userVouchersRouter = require('./routes/userVouchers');
const trackEventRouter = require('./routes/trackEvent');

const bankTransactionsRouter = require('./routes/bankTransactions');
const autoPaymentRouter = require('./routes/autoPayment');
const recommendationsRouter = require('./routes/recommendations');
const aiAdviceRouter = require('./routes/aiAdvice');
const adminStatisticsRouter = require('./routes/admin-statistics');
const momoRouter = require('./routes/momo');
const addressRouter = require('./routes/address');
const returnRequestsRouter = require('./routes/returnRequests');
const walletRouter = require('./routes/wallet');

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use(logger("dev")); // Comment để tắt HTTP request logging
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(cookieParser());

// Health check endpoint - đặt trước tất cả routes để cPanel có thể kiểm tra
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('OK');
});

app.use('/images', express.static('public/images'));
app.use('/video', express.static(path.join(__dirname, 'public/video')));
app.use(express.static(path.join(__dirname, "public")));

// Middleware để đảm bảo content-type nhất quán cho tất cả responses
app.use((req, res, next) => {
  // Set default charset cho text/html responses nếu chưa có
  const originalSend = res.send;
  res.send = function(body) {
    const contentType = res.get('Content-Type');
    if (contentType && contentType.includes('text/html') && !contentType.includes('charset')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    return originalSend.call(this, body);
  };
  next();
});

// app.use(cors());
app.use(cors({
  origin: [
    'https://nghiaht.io.vn',
    'https://www.nghiaht.io.vn',
    'https://api.nghiaht.io.vn',
    'https://poly.nghiaht.io.vn',
    'https://polysmart.me',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://api.polysmart.me',
    // Vercel frontend domains
    /^https:\/\/poly-.*\.vercel\.app$/,  // Vercel preview URLs
    'https://poly-l38s.vercel.app',  // Vercel production domain
    'https://poly-l38s-6bp47bo4j-nghiaxxxs-projects.vercel.app'  // Vercel deployment URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/variants", variantRoutes);
app.use("/api/settings", settingsRouter);
app.use('/api/flashsales', flashsalesRouter);
app.use("/api/newscategory", newsCategoryRouter);
app.use("/api/news", newsRouter);
app.use('/api/vouchers', voucherRouter);
app.use('/api/gift-vouchers', giftVoucherRouter);
app.use('/api/orders', ordersRouter);
app.use('/api', chatAiRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/upload-review-image', uploadReviewImageRouter);
app.use('/api/user-vouchers', userVouchersRouter);
app.use('/api/track-event', trackEventRouter);

app.use('/api/bank-transactions', bankTransactionsRouter);
app.use('/api/auto-payment', autoPaymentRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/ai-advice', aiAdviceRouter);
app.use('/api/admin', adminStatisticsRouter);
app.use('/api/momo', momoRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/return-requests', returnRequestsRouter);
app.use('/api/wallet', walletRouter);

// Swagger setup
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PolyPay API',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3000' },
    ],
  },
  apis: ['./routes/*.js'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route - cPanel health check (đặt sau tất cả routes để tránh conflict)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>API Server</title></head><body><h1>API Server is running</h1><p>Backend API for PolySmart</p><p>Status: OK</p></body></html>');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// error handler
app.use(function (err, req, res, next) {
  // Log error for debugging
  console.error('Error:', err);

  // Set status code
  const statusCode = err.status || 500;

  // Return JSON response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// var httpsServer = http.createServer(app);
//   httpsServer.listen(3450, () => {console.log('Server running on port 3450')}); // Bind tất cả interfaces
//   httpsServer.on('error', (err) => {console.log('Error', err)});
//   httpsServer.on('close', () => {console.log('Server Close')});


module.exports = app;
