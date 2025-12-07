const products = require("../models/productModel");
const variants = require("../models/variantModel");
const categories = require("../models/categoryModel");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/video'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const checkfile = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Bạn chỉ được upload file ảnh'));
  }
  return cb(null, true);
};

const checkVideoFile = (req, file, cb) => {
  if (!file.originalname.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
    return cb(new Error('Bạn chỉ được upload file video'));
  }
  return cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: checkfile });
const uploadVideo = multer({ storage: videoStorage, fileFilter: checkVideoFile });

const getAllProducts = async (req, res) => {
  console.log("getAllProducts");
  try {
    // Xây dựng điều kiện tìm kiếm
    const queryConditions = {};
    
    // Nếu có query parameter id_danhmuc hoặc category, thêm vào điều kiện
    if (req.query.id_danhmuc) {
      queryConditions.id_danhmuc = req.query.id_danhmuc;
    } else if (req.query.category) {
      queryConditions.id_danhmuc = req.query.category;
    }
    
    // Nếu có query parameter an_hien, thêm vào điều kiện (cho frontend)
    if (req.query.an_hien !== undefined) {
      queryConditions.an_hien = req.query.an_hien === 'true';
    }
    
    // Lấy sản phẩm theo điều kiện
    let productsList;
    if (req.query.limit) {
      productsList = await products.find(queryConditions).limit(Number(req.query.limit));
    } else {
      productsList = await products.find(queryConditions);
    }

    if (!productsList.length) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm nào" });
    }

    const productIds = productsList.map((product) => product._id.toString());
    const categoryIds = productsList.map((product) =>
      product.id_danhmuc.toString()
    );

    // Kiểm tra xem có phải request từ admin không
    const isAdminRequest = req.query.admin === 'true';
    
    let variantAll;
    if (isAdminRequest) {
      // Admin: lấy tất cả variants (bao gồm cả ẩn)
      variantAll = await variants.find({
        id_san_pham: { $in: productIds },
      });
    } else {
      // Client: chỉ lấy variants đang hiện
      variantAll = await variants.find({
        id_san_pham: { $in: productIds },
        an_hien: { $ne: false } // an_hien !== false (bao gồm true và undefined)
      });
    }

    const categoryAll = await categories.find(
      { _id: { $in: categoryIds }, an_hien: true },
      "ten_danh_muc video"
    );

    const productsWithCategories = productsList.map((product) => {
      const productObj = product.toObject();
      // Thêm categories từ categoryAll dựa trên id_danhmuc
      productObj.categories = categoryAll
        .filter(
          (category) =>
            category._id.toString() === product.id_danhmuc.toString()
        )
        .map((category) => category.toObject());
      // Gắn variants
      productObj.variants = variantAll
        .filter((variant) => variant.id_san_pham === product._id.toString())
        .map((variant) => variant.toObject());
      return productObj;
    });

    res.status(200).json(productsWithCategories);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};


const getProductById = async (req, res) => {
  try {
    // Lấy sản phẩm theo ID (không filter an_hien để admin có thể xem)
    const product = await products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra xem có phải request từ admin không (dựa vào query parameter)
    const isAdminRequest = req.query.admin === 'true';
    
    let variantList;
    if (isAdminRequest) {
      // Admin: lấy tất cả variants (bao gồm cả ẩn)
      variantList = await variants.find({
        id_san_pham: product._id.toString(),
      });
    } else {
      // Client: chỉ lấy variants đang hiện
      variantList = await variants.find({
        id_san_pham: product._id.toString(),
        an_hien: { $ne: false } // an_hien !== false (bao gồm true và undefined)
      });
    }

    const category = await categories.findById(
      product.id_danhmuc,
      "ten_danh_muc video an_hien"
    );
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    const productObj = product.toObject();
    // Thêm categories dưới dạng mảng
    productObj.categories = [category.toObject()];
    // Gắn variants
    productObj.variants = variantList.map((variant) => variant.toObject());

    res.status(200).json(productObj);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

const addPro = async (req, res) => {
  try {
    // Đảm bảo ban_chay = 0 cho sản phẩm mới
    const productData = { ...req.body };
    
    // Force ban_chay = 0 và xóa nếu có trong request
    productData.ban_chay = 0;
    delete req.body.ban_chay; // Xóa khỏi request body
    
    console.log('🛡️  Tạo sản phẩm mới với ban_chay = 0 (không cho phép fake)');
    console.log('📝 Dữ liệu gốc:', req.body);
    console.log('🔄 Dữ liệu đã được bảo vệ:', productData);
    
    const newProduct = new products(productData);
    const saved = await newProduct.save();
    
    res.status(201).json({
      ...saved.toObject(),
      message: 'Sản phẩm được tạo với lượt bán = 0. Lượt bán sẽ tự động tăng khi có đơn hàng thực tế.',
      warning: 'Field ban_chay đã được force = 0 để tránh fake data'
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo sản phẩm:', error);
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm: " + error.message });
  }
};

const uploadImage = [upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file được upload' });
  }
  // Đường dẫn public để frontend truy cập
  const imageUrl = `/images/${req.file.filename}`;
  res.status(200).json({ url: imageUrl });
}];

const uploadVideoProduct = [uploadVideo.single('video'), (req, res) => {
  console.log('=== PRODUCT VIDEO UPLOAD REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  if (!req.file) {
    console.log('❌ No file uploaded');
    return res.status(400).json({ message: 'Không có file được upload' });
  }
  
  console.log('✅ File uploaded successfully:', {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
  
  const videoUrl = `/video/${req.file.filename}`;
  console.log('📹 Generated video URL:', videoUrl);
  
  res.status(200).json({ url: videoUrl });
}];

const deletePro = async (req, res) => {
  try {
    const deleted = await products.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
    }
    res.status(200).json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm: ' + error.message });
  }
};

const editPro = async (req, res) => {
  try {
    // Bảo vệ field ban_chay khỏi việc update trực tiếp
    const updateData = { ...req.body };
    
    // Nếu cố gắng update ban_chay, xóa field này
    if (updateData.ban_chay !== undefined) {
      console.log('⚠️  Không cho phép update trực tiếp field ban_chay. Field này sẽ bị bỏ qua.');
      delete updateData.ban_chay;
    }
    
    // Lấy sản phẩm hiện tại để kiểm tra
    const currentProduct = await products.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
    }
    
    // Cập nhật sản phẩm (không bao gồm ban_chay)
    const updated = await products.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true,
        runValidators: true // Chạy validation
      }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
    }
    
    res.status(200).json({
      ...updated.toObject(),
      message: 'Sản phẩm được cập nhật thành công. Field ban_chay không thể thay đổi trực tiếp.',
      currentSalesCount: updated.ban_chay
    });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm: ' + error.message });
  }
};

// Tìm kiếm sản phẩm theo từ khóa
const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    // Tách từ khóa thành các từ riêng lẻ và tạo regex cho mỗi từ
    const keywords = keyword.split(' ').filter(k => k);
    const regexes = keywords.map(k => new RegExp(k.replace(/([.*+?^${}()|[\\]\\\\])/g, '\\$1'), "i"));

    // Tạo điều kiện tìm kiếm
    const searchConditions = {
      $and: [
        ...regexes.map(regex => ({ TenSP: regex }))
      ]
    };
    
    const productsList = await products.find(searchConditions);

    if (!productsList.length) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm phù hợp" });
    }
    // Lấy variants và categories tương tự getAllProducts
    const productIds = productsList.map((product) => product._id.toString());
    const categoryIds = productsList.map((product) => product.id_danhmuc.toString());
    const variantAll = await variants.find({ id_san_pham: { $in: productIds } });
    const categoryAll = await categories.find(
      { _id: { $in: categoryIds }, an_hien: true },
      "ten_danh_muc video"
    );
    const productsWithCategories = productsList.map((product) => {
      const productObj = product.toObject();
      productObj.categories = categoryAll
        .filter((category) => category._id.toString() === product.id_danhmuc.toString())
        .map((category) => category.toObject());
      productObj.variants = variantAll
        .filter((variant) => variant.id_san_pham === product._id.toString())
        .map((variant) => variant.toObject());
      return productObj;
    });
    res.status(200).json(productsWithCategories);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};

// Đếm số lượng sản phẩm đang hiện
const countProducts = async (req, res) => {
  try {
    const count = await products.countDocuments({ an_hien: true });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đếm sản phẩm: ' + error.message });
  }
};

// Lấy top sản phẩm bán chạy/ế
const getTopProducts = async (req, res) => {
  try {
    const { type = 'best', limit = 5 } = req.query;
    const sortOrder = type === 'worst' ? 1 : -1;
    const topProducts = await products.find({ an_hien: true }).sort({ ban_chay: sortOrder }).limit(Number(limit));
    res.status(200).json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy top sản phẩm: ' + error.message });
  }
};

// API để admin xem thống kê lượt bán sản phẩm (chỉ đọc)
const getProductSalesStats = async (req, res) => {
  try {
    const { limit = 20, sort = 'desc' } = req.query;
    
    // Chỉ admin mới có thể xem thống kê này
    // Bạn có thể thêm middleware verifyAdmin ở đây
    
    const sortOrder = sort === 'asc' ? 1 : -1;
    
    const products = await products.find({})
      .select('TenSP ban_chay hinh id_danhmuc ngay_tao')
      .sort({ ban_chay: sortOrder })
      .limit(Number(limit))
      .populate('id_danhmuc', 'ten_danh_muc');
    
    // Tính tổng thống kê
    const totalStats = await products.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalSales: { $sum: '$ban_chay' },
          avgSales: { $avg: '$ban_chay' },
          maxSales: { $max: '$ban_chay' },
          minSales: { $min: '$ban_chay' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        products: products.map(p => ({
          _id: p._id,
          TenSP: p.TenSP,
          ban_chay: p.ban_chay,
          hinh: p.hinh,
          category: p.id_danhmuc?.ten_danh_muc || 'N/A',
          ngay_tao: p.ngay_tao
        })),
        stats: totalStats[0] || {
          totalProducts: 0,
          totalSales: 0,
          avgSales: 0,
          maxSales: 0,
          minSales: 0
        }
      },
      message: 'Thống kê lượt bán sản phẩm (chỉ đọc)'
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi lấy thống kê lượt bán:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê lượt bán: ' + error.message 
    });
  }
};

// API để admin xem chi tiết lượt bán của một sản phẩm
const getProductSalesDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await products.findById(id)
      .select('TenSP ban_chay hinh id_danhmuc ngay_tao')
      .populate('id_danhmuc', 'ten_danh_muc');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    // Lấy thông tin variants của sản phẩm
    const variants = await variants.find({ id_san_pham: id })
      .select('dung_luong mau ram phien_ban gia so_luong_hang an_hien');
    
    res.status(200).json({
      success: true,
      data: {
        product: {
          _id: product._id,
          TenSP: product.TenSP,
          ban_chay: product.ban_chay,
          hinh: product.hinh,
          category: product.id_danhmuc?.ten_danh_muc || 'N/A',
          ngay_tao: product.ngay_tao
        },
        variants: variants.map(v => ({
          _id: v._id,
          dung_luong: v.dung_luong,
          mau: v.mau,
          ram: v.ram,
          phien_ban: v.phien_ban,
          gia: v.gia,
          so_luong_hang: v.so_luong_hang,
          an_hien: v.an_hien
        }))
      },
      message: 'Chi tiết lượt bán sản phẩm (chỉ đọc)'
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi lấy chi tiết lượt bán:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy chi tiết lượt bán: ' + error.message 
    });
  }
};

// API để test việc bảo vệ field ban_chay
const testBanChayProtection = async (req, res) => {
  try {
    const { testType = 'create' } = req.query;
    
    if (testType === 'create') {
      // Test tạo sản phẩm với ban_chay > 0
      const testData = {
        TenSP: 'Test Product - Ban Chay Protection',
        ban_chay: 9999, // Cố gắng fake
        id_danhmuc: '507f1f77bcf86cd799439011' // ID giả
      };
      
      console.log('🧪 Test tạo sản phẩm với ban_chay = 9999');
      console.log('📝 Dữ liệu gốc:', testData);
      
      const newProduct = new products(testData);
      const saved = await newProduct.save();
      
      res.status(200).json({
        success: true,
        testType: 'create',
        originalData: testData,
        savedData: saved.toObject(),
        message: 'Test hoàn thành - Kiểm tra xem ban_chay có được force = 0 không',
        expected: 'ban_chay phải = 0',
        actual: `ban_chay = ${saved.ban_chay}`
      });
      
      // Xóa sản phẩm test
      await products.findByIdAndDelete(saved._id);
      
    } else if (testType === 'update') {
      // Test cập nhật sản phẩm với ban_chay mới
      const testProduct = new products({
        TenSP: 'Test Product for Update',
        ban_chay: 0,
        id_danhmuc: '507f1f77bcf86cd799439011'
      });
      
      const saved = await testProduct.save();
      
      console.log('🧪 Test cập nhật sản phẩm với ban_chay = 5000');
      
      const updated = await products.findByIdAndUpdate(
        saved._id,
        { ban_chay: 5000, TenSP: 'Updated Product' },
        { new: true }
      );
      
      res.status(200).json({
        success: true,
        testType: 'update',
        originalProduct: saved.toObject(),
        updateData: { ban_chay: 5000, TenSP: 'Updated Product' },
        updatedProduct: updated.toObject(),
        message: 'Test hoàn thành - Kiểm tra xem ban_chay có được bảo vệ không',
        expected: 'ban_chay phải giữ nguyên = 0',
        actual: `ban_chay = ${updated.ban_chay}`
      });
      
      // Xóa sản phẩm test
      await products.findByIdAndDelete(saved._id);
      
    } else {
      res.status(400).json({
        success: false,
        message: 'Test type không hợp lệ. Sử dụng: create hoặc update'
      });
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi test bảo vệ ban_chay:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi test bảo vệ ban_chay: ' + error.message 
    });
  }
};

module.exports = { 
  getAllProducts, 
  getProductById, 
  addPro, 
  uploadImage, 
  uploadVideoProduct, 
  deletePro, 
  editPro, 
  searchProducts, 
  countProducts, 
  getTopProducts,
  getProductSalesStats,
  getProductSalesDetail,
  testBanChayProtection
};
