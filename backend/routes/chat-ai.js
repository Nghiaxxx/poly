const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/productModel');
const Variant = require('../models/variantModel');
const Category = require('../models/categoryModel');
const FlashSale = require('../models/FlashSale');
const FlashSaleVariant = require('../models/FlashSaleVariant');

// Import colorMap từ file shared
const colorMap = {
  '#EFCFD2': 'Hồng nhạt',
  '#E9DFA7': 'Vàng nhạt',
  '#505865': 'Xám',
  '#000000': 'Đen',
  '#FFFFFF': 'Trắng',
  '#A3D8F4': 'Xanh dương nhạt',
  '#F5E6CC': 'Kem',
  '#F4B183': 'Cam nhạt',
  '#F7F7F7': 'Trắng tinh',
  '#D4E3E1': 'Xanh bạc hà',
  '#B6D7A8': 'Xanh lá nhạt',
  '#B4C7DC': 'Xanh nhạt',
  '#B7B7B7': 'Xám nhạt',
  '#FFD966': 'Vàng',
  '#F9CB9C': 'Cam',
  '#FFCC99': 'Cam nhạt',
  '#C9DAF8': 'Xanh dương',
  '#A2C4C9': 'Xanh ngọc',
  '#D9D2E9': 'Tím nhạt',
  '#B4A7D6': 'Tím',
  '#F4CCCC': 'Hồng',
  '#C27BA0': 'Hồng tím',
  '#A52A2A': 'Nâu',
  '#FFD700': 'Vàng gold',
  '#C0C0C0': 'Bạc',
  '#808080': 'Xám đậm',
  '#1D1D1F': 'Đen nhám',
  '#FBEFEF': 'Hồng phấn',
  '#F6E3B4': 'Vàng kem',
  '#E5E4E2': 'Bạch kim',
  '#D1C7B7': 'Titan tự nhiên',
  '#B5B5B5': 'Titan xám',
  '#E3E3E3': 'Titan trắng',
  '#232323': 'Titan đen',
  '#B9D9EB': 'Xanh dương nhạt',
  '#F3E2A9': 'Vàng nhạt',
  '#F5F5DC': 'Be',
  '#F8F8FF': 'Trắng xanh',
  '#F0FFF0': 'Xanh mint',
  '#F0F8FF': 'Xanh băng',
  '#E6E6FA': 'Tím lavender',
  '#FFFACD': 'Vàng chanh',
  '#FFE4E1': 'Hồng đào',
  '#F08080': 'Đỏ nhạt',
  '#DC143C': 'Đỏ',
  '#4169E1': 'Xanh hoàng gia',
  '#4682B4': 'Xanh thép',
  '#708090': 'Xám xanh',
  '#B0C4DE': 'Xanh đá',
  '#00CED1': 'Xanh ngọc đậm',
  '#20B2AA': 'Xanh biển',
  '#5F9EA0': 'Xanh cổ vịt',
  '#2E8B57': 'Xanh rêu',
  '#556B2F': 'Xanh ô liu',
  '#8B4513': 'Nâu đất',
  '#D2691E': 'Nâu cam',
  '#FFDAB9': 'Cam đào',
  '#FFF8DC': 'Vàng kem nhạt',
  '#E0FFFF': 'Xanh ngọc nhạt',
  '#F5FFFA': 'Trắng bạc hà',
  '#FDF5E6': 'Trắng ngà',
  '#FAEBD7': 'Trắng kem',
  '#FFEBCD': 'Vàng nhạt',
  '#FFE4B5': 'Vàng cam',
  '#FFDEAD': 'Vàng đất',
  '#F5DEB3': 'Vàng lúa mì',
  '#DEB887': 'Nâu vàng',
  '#D2B48C': 'Nâu nhạt',
  '#BC8F8F': 'Nâu hồng',
  '#F4A460': 'Nâu cát',
  '#DAA520': 'Vàng đồng',
  '#B8860B': 'Vàng sẫm',
  '#CD853F': 'Nâu đồng',
  '#8B0000': 'Đỏ đậm',
  '#800000': 'Đỏ nâu',
  '#A0522D': 'Nâu đỏ',
  '#808000': 'Xanh ô liu đậm',
  '#6B8E23': 'Xanh ô liu nhạt',
  '#9ACD32': 'Xanh vàng',
  '#32CD32': 'Xanh lá tươi',
  '#00FF00': 'Xanh lá',
  '#7FFF00': 'Xanh nõn chuối',
  '#7CFC00': 'Xanh cỏ',
  '#ADFF2F': 'Xanh vàng nhạt',
  '#00FF7F': 'Xanh ngọc tươi',
  '#00FA9A': 'Xanh ngọc sáng',
  '#40E0D0': 'Xanh ngọc biển',
  '#48D1CC': 'Xanh ngọc lam',
  '#00BFFF': 'Xanh da trời',
  '#1E90FF': 'Xanh dương sáng',
  '#6495ED': 'Xanh ngọc bích',
  '#7B68EE': 'Tím xanh',
  '#6A5ACD': 'Tím than',
  '#483D8B': 'Tím đậm',
  '#4B0082': 'Chàm',
  '#8A2BE2': 'Tím xanh đậm',
  '#9400D3': 'Tím đậm',
  '#9932CC': 'Tím nhạt',
  '#BA55D3': 'Tím hồng',
  '#800080': 'Tím',
  '#8B008B': 'Tím đậm',
  '#FF00FF': 'Hồng tím',
  '#FF69B4': 'Hồng cánh sen',
  '#FF1493': 'Hồng đậm',
  '#C71585': 'Hồng tím đậm',
  '#DB7093': 'Hồng nhạt',
  '#FFA07A': 'Cam nhạt',
  '#FF7F50': 'Cam san hô',
  '#FF6347': 'Đỏ cam',
  '#FF4500': 'Cam đỏ',
  '#FF8C00': 'Cam đậm',
  '#FFA500': 'Cam',
  '#FFFF00': 'Vàng',
  '#FFFFE0': 'Vàng nhạt',
  '#FAFAD2': 'Vàng nhạt',
  '#EEE8AA': 'Vàng nhạt',
  '#F0E68C': 'Vàng đất',
  '#BDB76B': 'Vàng ô liu',
  '#FFF0F5': 'Hồng lavender',
  '#D8BFD8': 'Tím nhạt',
  '#DDA0DD': 'Tím nhạt',
  '#EE82EE': 'Tím nhạt',
  '#DA70D6': 'Tím hồng',
  '#FFB6C1': 'Hồng nhạt',
  '#FFC0CB': 'Hồng',
  '#B1B3B6': 'Xám nhạt',
  '#F4B8DE': 'Hồng tím nhạt',
  '#A3B5F7': 'Xanh tím nhạt',
  '#B9D9D6': 'Xanh bạc nhạt',
  '#174C6F': 'Xanh navy đậm',
  '#1F72F2': 'Xanh dương sáng',
  '#2D2D2D': 'Đen xám',
  '#2E3641': 'Xám than',
  '#3BC6FF': 'Xanh cyan sáng',
  '#505153': 'Xám chì',
  '#767479': 'Xám bạc',
  '#88ADC6': 'Xanh pastel',
  '#9D9D9D': 'Xám nhạt',
  '#A7A7A7': 'Xám bạc nhạt',
  '#B5D999': 'Xanh lá nhạt',
  '#BAB4E7': 'Tím pastel',
  '#BFA48F': 'Nâu vàng nhạt',
  '#C1BDB2': 'Xám be',
  '#C2BCB2': 'Be xám',
  '#C7D8E0': 'Xanh băng nhạt',
  '#D9E7E8': 'Xanh bạc hà nhạt',
  '#DA3C3A': 'Đỏ tươi',
  '#E3E5E3': 'Xám bạc sáng',
  '#EBB9B0': 'Hồng đất',
  '#F0E5D3': 'Vàng kem nhạt',
  '#F3F2ED': 'Trắng ngà',
  '#F4E9D4': 'Vàng be nhạt',
  '#FBD96E': 'Vàng chanh',
  '#FDEB66': 'Vàng sáng',
  '#FFC1CC': 'Hồng phấn',
  '#FFFF99': 'Vàng nhạt',
  '#ffffff': 'Trắng',
};

const GEMINI_API_KEY = 'AIzaSyD9o82yYzXah3pB1ebRSq35BBX51VqQY-o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Thông tin cửa hàng
const STORE_INFO = {
  name: "Poly Smart",
  description: "Cửa hàng chuyên bán điện thoại chính hãng, uy tín, chất lượng cao",
  policies: [
    "Bảo hành chính hãng 12 tháng",
    "Giao hàng toàn quốc, thanh toán khi nhận hàng",
    "Đổi trả trong 7 ngày nếu có lỗi từ nhà sản xuất",
    "Hỗ trợ trả góp 0% lãi suất"
  ],
  contact: "Hotline: 1900-1234, Email: polysmart79@gmail.com"
};

const SMART_KEYWORDS = {
  brands: ['iphone', 'ipad', 'macbook', 'airpod', 'apple watch'],
  features: ['camera', 'pin', 'ram', 'rom', 'chip', 'màn hình', 'tốc độ', 'hiệu năng', 'gaming', 'chụp ảnh', 'quay video'],
  price_ranges: ['rẻ', 'giá rẻ', 'tầm trung', 'cao cấp', 'premium', 'đắt', 'giá cao'],
  conditions: ['mới', 'cũ', 'refurbished', 'đã qua sử dụng'],
  colors: ['đen', 'trắng', 'xanh', 'đỏ', 'vàng', 'tím', 'hồng', 'xám', 'bạc', 'vàng'],
  storage: ['64gb', '128gb', '256gb', '512gb', '1tb', '64 gb', '128 gb', '256 gb', '512 gb', '1 tb']
};
const PRICE_KEYWORDS = {
  cheap: ['rẻ', 'giá rẻ', 'thấp'],
  expensive: ['cao cấp', 'premium', 'đắt', 'giá cao'],
};
const STOP_WORDS = [
    'là', 'có', 'của', 'và', 'em', 'anh', 'chị', 'không', 'ạ', 'tôi', 'cửa', 'hàng', 'shop', 'mình', 'nào', 'cho', 'về', 'con', 'tư'
];

function getColorName(mau) {
  if (!mau) return '';
  const hex = mau.replace('#', '').toUpperCase();
  return colorMap[`#${hex}`] || mau;
}

const normalizeString = (str) => (str || '').toLowerCase().replace(/\s+/g, '');

const extractKeywords = (message) => {
  const normalizedMessage = message.toLowerCase()
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/[.,?]/g, '')
    .replace(/\bip\b/g, 'iphone');
  const words = normalizedMessage.split(/\s+/);
  const allPriceKeywords = [...PRICE_KEYWORDS.cheap, ...PRICE_KEYWORDS.expensive];
  // Các từ chung chung về thông tin sản phẩm không được coi là từ khóa sản phẩm
  const infoOnlyWords = ['thông', 'số', 'kỹ', 'thuật', 'đặc', 'điểm', 'chi', 'tiết', 'cấu', 'hình', 'specs', 'specification', 'thông_số', 'kỹ_thuật'];
  
  let nameAndFeatureKeywords = words.filter(word => {
    if (!word || STOP_WORDS.includes(word) || allPriceKeywords.includes(word) || infoOnlyWords.includes(word)) return false;
    if (/^\d+$/.test(word)) return true;
    for (const key in SMART_KEYWORDS) {
      if (SMART_KEYWORDS[key].some(k => k === word)) return true;
    }
    if (word.length > 2) return true;
    return false;
  });
  if (nameAndFeatureKeywords.length === 0) {
    nameAndFeatureKeywords = words.filter(word => {
      if (!word || infoOnlyWords.includes(word)) return false;
      if (/^\d+$/.test(word)) return true;
      for (const key in SMART_KEYWORDS) {
        if (SMART_KEYWORDS[key].some(k => k === word)) return true;
      }
      return false;
    });
  }
  const priceKeywords = words.filter(word => allPriceKeywords.includes(word));
  return { nameAndFeatureKeywords, priceKeywords };
};

function extractCompareProducts(message) {
  // Tìm các cụm "so sánh X và Y" hoặc "compare X vs Y"
  const compareRegex = /so sánh\s+(.+?)\s+(và|vs|với)\s+(.+)/i;
  const match = message.match(compareRegex);
  if (match) {
    const name1 = match[1].trim();
    const name2 = match[3].trim();
    return [name1, name2];
  }
  return null;
}

function extractProductNameFromMessage(message) {
  // Ưu tiên lấy cụm từ sau các từ khóa mua hàng
  const buyRegex = /(mua|giá|cần|tìm|có|bán)\s+(.+)$/i;
  const match = message.match(buyRegex);
  if (match) {
    return match[2].trim();
  }
  
  // Tìm tên sản phẩm cụ thể trong message
  const productNameRegex = /(iphone\s*\d+[a-zA-Z]*(?:\s+[a-zA-Z]+)?|ipad[a-zA-Z\s]*|macbook[a-zA-Z\s]*|airpod[a-zA-Z\s]*)/i;
  const productMatch = message.match(productNameRegex);
  if (productMatch) {
    return productMatch[1].trim();
  }
  
  return null;
}

// Hàm tách từ khóa quan trọng từ câu hỏi tự nhiên
function extractImportantKeywords(message) {
  let normalized = (message || '').toLowerCase()
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let words = normalized.split(' ').filter(w => w && !STOP_WORDS.includes(w));
  return words;
}

const searchProducts = async ({ nameAndFeatureKeywords, priceKeywords, compareNames, message, fromHistory = false }) => {
  if (fromHistory) {
    console.log('Tìm kiếm từ lịch sử với các từ khóa:', nameAndFeatureKeywords);
  }
  if (compareNames && compareNames.length === 2) {
    // Tìm chính xác hai sản phẩm này
    const allProducts = await Product.find({ an_hien: true }).lean();
    const found = compareNames.map(name => {
      return allProducts.find(p => normalizeString(p.TenSP) === normalizeString(name));
    }).filter(Boolean);
    // Lấy variants cho từng sản phẩm
    for (const p of found) {
      p.variants = await Variant.find({ id_san_pham: p._id.toString(), an_hien: true }).lean();
    }
    if (found.length === 2) return found;
    // Nếu không đủ 2 sản phẩm, fallback về logic cũ
  }
  
  // Nếu không có từ khóa sản phẩm, trả về mảng rỗng
  if (nameAndFeatureKeywords.length === 0) return [];
  
  // Kiểm tra xem có từ khóa sản phẩm cụ thể không (bỏ qua nếu từ history)
  if (!fromHistory) {
    const hasProductKeyword = nameAndFeatureKeywords.some(keyword => 
      SMART_KEYWORDS.brands.includes(keyword) || 
      /^\d+$/.test(keyword) ||
      keyword.length > 4
    );
    
    // Nếu không có từ khóa sản phẩm cụ thể, trả về mảng rỗng
    if (!hasProductKeyword) return [];
  }
  
  const keywordFull = nameAndFeatureKeywords.join(' ').toLowerCase().trim();
  const allProducts = await Product.find({ an_hien: true }).lean();
  
  // Tìm exact match trước
  const exactMatch = allProducts.find(p => normalizeString(p.TenSP) === normalizeString(keywordFull));
  if (exactMatch) {
    // Lấy variants cho sản phẩm này
    const variants = await Variant.find({ id_san_pham: exactMatch._id.toString(), an_hien: true }).lean();
    exactMatch.variants = variants;
    return [exactMatch];
  }
  
  // Nếu từ history, tìm sản phẩm có nhiều từ khóa match nhất
  if (fromHistory) {
    const matchedProducts = allProducts.map(p => {
      const normName = normalizeString(p.TenSP);
      let matchCount = 0;
      let totalKeywordLength = 0;
      
      nameAndFeatureKeywords.forEach(kw => {
        if (normName.includes(normalizeString(kw))) {
          matchCount++;
          totalKeywordLength += kw.length;
        }
      });
      
      return {
        ...p,
        _matchCount: matchCount,
        _totalKeywordLength: totalKeywordLength,
        _relevanceScore: matchCount * 100 + totalKeywordLength
      };
    }).filter(p => p._matchCount > 0);
    
    // Sắp xếp theo độ liên quan giảm dần
    matchedProducts.sort((a, b) => b._relevanceScore - a._relevanceScore);
    
    if (matchedProducts.length > 0) {
      // Chỉ lấy sản phẩm có relevance score cao nhất
      const bestMatch = matchedProducts[0];
      const variants = await Variant.find({ id_san_pham: bestMatch._id.toString(), an_hien: true }).lean();
      bestMatch.variants = variants;
      console.log('history:', bestMatch.TenSP, 'score:', bestMatch._relevanceScore);
      return [bestMatch];
    }
  }
  // Fuzzy AND match với nameAndFeatureKeywords
  const fuzzyAndMatch = allProducts.filter(p => {
    const normName = normalizeString(p.TenSP);
    return nameAndFeatureKeywords.every(kw => normName.includes(normalizeString(kw)));
  });
  for (const p of fuzzyAndMatch) {
    p.variants = await Variant.find({ id_san_pham: p._id.toString(), an_hien: true }).lean();
  }
  if (fuzzyAndMatch.length > 0) return fuzzyAndMatch;
  // Fuzzy match với các từ khóa quan trọng từ câu hỏi tự nhiên
  if (message) {
    const importantKeywords = extractImportantKeywords(message);
    const MIN_KEYWORD_MATCH = fromHistory ? 1 : 2;
    const MAIN_KEYWORDS = ['iphone', 'ipad', 'macbook', 'airpod', 'apple'];
    const mainKeyword = importantKeywords.find(kw => MAIN_KEYWORDS.includes(kw));
    
    // Chỉ tìm kiếm nếu có từ khóa chính (bỏ qua nếu từ history)
    if (!mainKeyword && !fromHistory) return [];
    
    // Sắp xếp sản phẩm theo số lượng từ khóa khớp giảm dần
    const scoredProducts = allProducts.map(p => {
      const normName = normalizeString(p.TenSP);
      let score = 0;
      importantKeywords.forEach(kw => {
        if (normName.includes(normalizeString(kw))) score++;
      });
      // Nếu có mainKeyword, sản phẩm phải chứa mainKeyword
      const hasMain = mainKeyword ? normName.includes(normalizeString(mainKeyword)) : true;
      return { ...p, _score: score, _hasMain: hasMain };
    }).filter(p => p._score >= MIN_KEYWORD_MATCH && p._hasMain);
    scoredProducts.sort((a, b) => b._score - a._score);
    for (const p of scoredProducts) {
      p.variants = await Variant.find({ id_san_pham: p._id.toString(), an_hien: true }).lean();
    }
    if (scoredProducts.length > 0) return scoredProducts;
  }
  
  // Nếu không có match, trả về mảng rỗng thay vì dùng aggregation
  return [];
};

const buildProductInfoForAI = (products, message = '') => {
  let productInfo = `Tìm thấy ${products.length} sản phẩm phù hợp:\n`;
  
  // Kiểm tra xem có hỏi về thông số kỹ thuật không
  const isSpecsQuery = /thông số|kỹ thuật|đặc điểm|chi tiết|cấu hình|specs|specification/i.test(message);
  
  products.forEach((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variantsInfo = variants.map(v =>
      `${v.dung_luong || ''} ${getColorName(v.mau)}`.trim()
    ).join(', ');
    const gia = variants[0]?.gia ? variants[0].gia.toLocaleString('vi-VN') : 'N/A';
    
    productInfo += `- Tên: ${product.TenSP}. Giá từ ${gia} VNĐ. Các phiên bản: ${variantsInfo}.\n`;
    
    // Nếu hỏi về thông số kỹ thuật và có thông số trong DB
    if (isSpecsQuery && product.thong_so_ky_thuat) {
      productInfo += `  Thông số kỹ thuật:\n`;
      const specs = product.thong_so_ky_thuat;
      if (specs.CPU) productInfo += `    - CPU: ${specs.CPU}\n`;
      if (specs.GPU) productInfo += `    - GPU: ${specs.GPU}\n`;
      if (specs.He_dieu_hanh) productInfo += `    - Hệ điều hành: ${specs.He_dieu_hanh}\n`;
      if (specs.Kich_thuoc_man_hinh) productInfo += `    - Kích thước màn hình: ${specs.Kich_thuoc_man_hinh}\n`;
      if (specs.Do_phan_giai) productInfo += `    - Độ phân giải: ${specs.Do_phan_giai}\n`;
      if (specs.Cong_nghe_man_hinh) productInfo += `    - Công nghệ màn hình: ${specs.Cong_nghe_man_hinh}\n`;
      if (specs.Camera && Array.isArray(specs.Camera)) productInfo += `    - Camera: ${specs.Camera.join(', ')}\n`;
      if (specs.Tinh_nang_camera && Array.isArray(specs.Tinh_nang_camera)) productInfo += `    - Tính năng camera: ${specs.Tinh_nang_camera.join(', ')}\n`;
      if (specs.Ket_noi && Array.isArray(specs.Ket_noi)) productInfo += `    - Kết nối: ${specs.Ket_noi.join(', ')}\n`;
      if (specs.Kich_thuoc_khoi_luong && Array.isArray(specs.Kich_thuoc_khoi_luong)) productInfo += `    - Kích thước & khối lượng: ${specs.Kich_thuoc_khoi_luong.join(', ')}\n`;
      if (specs.Tien_ich_khac && Array.isArray(specs.Tien_ich_khac)) productInfo += `    - Tiện ích khác: ${specs.Tien_ich_khac.join(', ')}\n`;
      productInfo += '\n';
    }
  });
  return productInfo;
};

// Hàm tách tên sản phẩm từ câu trả lời AI
function extractProductNamesFromAIReply(reply) {
  // Tìm tất cả cụm "iPhone 13", "iPhone 14", ...
  const matches = reply.match(/iPhone \d+(?: [A-Za-z]+)?/gi);
  if (!matches) return [];
  // Loại bỏ trùng lặp, chuẩn hóa
  return [...new Set(matches.map(name => name.trim().toLowerCase()))];
}

// Hàm lấy các chương trình flash sale đang diễn ra
const getActiveFlashSales = async () => {
  try {
    const now = new Date();
    const activeFlashSales = await FlashSale.find({
      an_hien: true,
      thoi_gian_bat_dau: { $lte: now },
      thoi_gian_ket_thuc: { $gte: now }
    }).lean();
    
    return activeFlashSales;
  } catch (error) {
    console.error('Lỗi khi lấy flash sale:', error);
    return [];
  }
};

// Hàm lấy sản phẩm flash sale đang có (còn hàng) - format cho ProductCard
const getActiveFlashSaleProducts = async () => {
  try {
    const now = new Date();
    
    // Lấy các flash sale đang diễn ra
    const activeFlashSales = await FlashSale.find({
      an_hien: true,
      thoi_gian_bat_dau: { $lte: now },
      thoi_gian_ket_thuc: { $gte: now }
    }).lean();
    
    if (activeFlashSales.length === 0) return [];
    
    const flashSaleIds = activeFlashSales.map(fs => fs._id);
    
    // Lấy variants flash sale còn hàng
    const flashSaleVariants = await FlashSaleVariant.find({
      id_flash_sale: { $in: flashSaleIds },
      an_hien: true,
      $expr: { $gt: ['$so_luong', '$da_ban'] } // Còn hàng
    })
    .populate('id_variant')
    .populate('id_flash_sale')
    .limit(2) // Chỉ lấy tối đa 2 sản phẩm
    .lean();
    
    // Lấy thông tin sản phẩm cho mỗi variant và format cho ProductCard
    const flashSaleProducts = [];
    for (const fsVariant of flashSaleVariants) {
      if (fsVariant.id_variant && fsVariant.id_flash_sale) {
        const product = await Product.findById(fsVariant.id_variant.id_san_pham).lean();
        if (product && product.an_hien) {
          // Tạo variant flash sale với giá đã giảm
          const flashSaleVariantForCard = {
            ...fsVariant.id_variant,
            gia: fsVariant.gia_flash_sale, // Giá flash sale
            gia_goc: fsVariant.id_variant.gia_goc || fsVariant.id_variant.gia, // Giá gốc để hiển thị gạch ngang
            isFlashSale: true,
            flashSaleInfo: {
              ten_su_kien: fsVariant.id_flash_sale.ten_su_kien,
              so_luong_con_lai: fsVariant.so_luong - fsVariant.da_ban,
              phan_tram_giam: fsVariant.phan_tram_giam_gia || Math.round((1 - fsVariant.gia_flash_sale / (fsVariant.id_variant.gia_goc || fsVariant.id_variant.gia)) * 100)
            }
          };
          
          // Tạo product với variant flash sale
          const flashSaleProduct = {
            ...product,
            variants: [flashSaleVariantForCard], // Chỉ có variant flash sale
            isFlashSale: true
          };
          
          flashSaleProducts.push(flashSaleProduct);
        }
      }
    }
    
    return flashSaleProducts.slice(0, 2); // Đảm bảo chỉ trả về tối đa 2 sản phẩm
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm flash sale:', error);
    return [];
  }
};

// Hàm format thông tin flash sale cho AI
const buildFlashSaleInfoForAI = (flashSales) => {
  if (!flashSales || flashSales.length === 0) {
    return 'Hiện tại không có chương trình flash sale nào đang diễn ra.';
  }
  
  let flashSaleInfo = `Hiện tại đang có ${flashSales.length} chương trình flash sale:\n`;
  
  flashSales.forEach((flashSale, index) => {
    const startDate = new Date(flashSale.thoi_gian_bat_dau).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endDate = new Date(flashSale.thoi_gian_ket_thuc).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    });
    
    flashSaleInfo += `${index + 1}. 🔥 **${flashSale.ten_su_kien}**\n`;
    flashSaleInfo += `   📅 Từ: ${startDate}\n`;
    flashSaleInfo += `   📅 Đến: ${endDate}\n\n`;
  });
  
  return flashSaleInfo;
};

// Hàm format sản phẩm flash sale cho AI (rút gọn vì sản phẩm sẽ hiển thị trong khung)
const buildFlashSaleProductsForAI = (flashSaleProducts) => {
  if (!flashSaleProducts || flashSaleProducts.length === 0) {
    return '';
  }
  
  let productInfo = `\n🔥 HIỆN CÓ ${flashSaleProducts.length} SẢN PHẨM FLASH SALE NỔI BẬT:\n`;
  
  flashSaleProducts.forEach((product, index) => {
    const variant = product.variants[0]; // Lấy variant đầu tiên (đã là flash sale variant)
    const flashSaleInfo = variant.flashSaleInfo;
    
    productInfo += `${index + 1}. **${product.TenSP}** - Giảm ${flashSaleInfo.phan_tram_giam}%, còn ${flashSaleInfo.so_luong_con_lai} sản phẩm\n`;
  });
  
  productInfo += `\n👀 Bạn có thể xem chi tiết sản phẩm và giá ưu đãi bên dưới!`;
  
  return productInfo;
};

// Thêm danh sách từ khóa không liên quan đến cửa hàng
const IRRELEVANT_KEYWORDS = [
  'chính trị', 'tôn giáo', 'quan hệ', 'tình yêu', 'hẹn hò', 'ly hôn', 'cưới xin',
  'bệnh tật', 'sức khỏe', 'y tế', 'bác sĩ', 'thuốc', 'điều trị', 'chẩn đoán',
  'giáo dục', 'học tập', 'thi cử', 'đại học', 'trường học', 'giáo viên',
  'thể thao', 'bóng đá', 'tennis', 'bơi lội', 'gym', 'tập thể dục',
  'du lịch', 'khách sạn', 'máy bay', 'tàu hỏa', 'xe buýt',
  'ẩm thực', 'nấu ăn', 'nhà hàng', 'đồ ăn', 'thức uống',
  'thời trang', 'quần áo', 'giày dép', 'túi xách', 'mỹ phẩm',
  'bất động sản', 'nhà đất', 'chung cư', 'văn phòng', 'cửa hàng',
  'tài chính', 'ngân hàng', 'đầu tư', 'chứng khoán', 'bảo hiểm',
  'pháp luật', 'luật sư', 'tòa án', 'kiện tụng', 'hợp đồng',
  'giải trí', 'phim ảnh', 'âm nhạc', 'sách báo', 'game',
  'công nghệ', 'lập trình', 'phần mềm', 'website', 'app',
  'xe cộ', 'ô tô', 'xe máy', 'sửa xe', 'bảo dưỡng',
  'nông nghiệp', 'trồng trọt', 'chăn nuôi', 'thủy sản',
  'công nghiệp', 'sản xuất', 'xây dựng', 'kiến trúc',
  'môi trường', 'ô nhiễm', 'rác thải', 'tái chế',
  'văn hóa', 'lịch sử', 'địa lý', 'nghệ thuật',
  'tâm lý', 'tư vấn', 'trị liệu', 'thiền', 'yoga',
  // Thêm từ khóa toán học và câu hỏi chung chung
  'toán học', 'tính toán', 'phép tính', 'cộng', 'trừ', 'nhân', 'chia',
  'bài toán', 'giải toán', 'tính', 'kết quả', 'đáp án', 'đáp số',
  '1+1', '2+2', '3+3', '4+4', '5+5', '6+6', '7+7', '8+8', '9+9', '10+10',
  '1-1', '2-2', '3-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9', '10-10',
  '1*1', '2*2', '3*3', '4*4', '5*5', '6*6', '7*7', '8*8', '9*9', '10*10',
  '1/1', '2/2', '3/3', '4/4', '5/5', '6/6', '7/7', '8/8', '9/9', '10/10'
];

// Thêm danh sách từ khóa liên quan đến cửa hàng
const RELEVANT_KEYWORDS = [
  'điện thoại', 'smartphone', 'iphone', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme',
  'ipad', 'tablet', 'máy tính bảng', 'macbook', 'laptop', 'máy tính xách tay',
  'airpod', 'tai nghe', 'headphone', 'earbuds', 'bluetooth',
  'apple watch', 'đồng hồ thông minh', 'smartwatch',
  'mua', 'bán', 'giá', 'giá cả', 'khuyến mãi', 'giảm giá', 'sale',
  'bảo hành', 'đổi trả', 'giao hàng', 'thanh toán', 'trả góp',
  'thông số', 'cấu hình', 'đặc điểm', 'tính năng', 'hiệu năng',
  'camera', 'pin', 'ram', 'rom', 'chip', 'màn hình', 'màu sắc',
  'dung lượng', 'bộ nhớ', 'lưu trữ', 'kết nối', 'wifi', '5g', '4g',
  'so sánh', 'đánh giá', 'review', 'ưu điểm', 'nhược điểm',
  'có tốt không', 'có nên mua', 'phù hợp', 'tư vấn', 'hỗ trợ',
  'cửa hàng', 'shop', 'poly smart', 'polysmart', 'poly',
  'chính hãng', 'hàng thật', 'authentic', 'original',
  'flash sale', 'flashsale', 'sự kiện', 'chương trình',
  'khách hàng', 'mua sắm', 'shopping', 'online', 'trực tuyến'
];

// Hàm kiểm tra xem câu hỏi có liên quan đến cửa hàng không
function isRelevantToStore(message) {
  if (!message) return false;
  
  const normalizedMessage = message.toLowerCase();
  
  // Kiểm tra câu hỏi toán học và phép tính
  const mathPatterns = [
    /^\d+\s*[\+\-\*\/]\s*\d+\s*\?*$/i,  // 1+1=?, 2+2, 3*4, etc.
    /^\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\?*$/i,  // 1+1=?, 2+2=?, etc.
    /^\?*\s*\d+\s*[\+\-\*\/]\s*\d+\s*$/i,  // ?1+1, ?2+2, etc.
    /^\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\d+$/i,  // 1+1=2, 2+2=4, etc.
    /^tính\s+\d+\s*[\+\-\*\/]\s*\d+/i,  // tính 1+1, tính 2*3, etc.
    /^kết quả\s+của\s+\d+\s*[\+\-\*\/]\s*\d+/i,  // kết quả của 1+1
    /^đáp án\s+của\s+\d+\s*[\+\-\*\/]\s*\d+/i,  // đáp án của 1+1
    /^giải\s+bài\s+toán/i,  // giải bài toán
    /^tính\s+toán/i,  // tính toán
    /^phép\s+tính/i   // phép tính
  ];
  
  const isMathQuestion = mathPatterns.some(pattern => pattern.test(normalizedMessage));
  if (isMathQuestion) {
    return false;
  }
  
  // Kiểm tra từ khóa không liên quan
  const hasIrrelevantKeywords = IRRELEVANT_KEYWORDS.some(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );
  
  // Kiểm tra từ khóa liên quan
  const hasRelevantKeywords = RELEVANT_KEYWORDS.some(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );
  
  // Kiểm tra câu hỏi chung chung không liên quan
  const generalQuestionPatterns = [
    /^[a-z\s]+\?*$/i,  // Câu hỏi chỉ có chữ cái và dấu ?
    /^[0-9\s\+\-\*\/\?=]+$/i,  // Chỉ có số và phép tính
    /^[a-z0-9\s\+\-\*\/\?=]+$/i,  // Chữ và số với phép tính
    /^[a-z\s]+\s*\?$/i,  // Câu hỏi chung chung kết thúc bằng ?
    /^[a-z\s]+\s*\?*$/i   // Câu hỏi chung chung
  ];
  
  const isGeneralQuestion = generalQuestionPatterns.some(pattern => pattern.test(normalizedMessage));
  if (isGeneralQuestion && !hasRelevantKeywords) {
    return false;
  }
  
  // Kiểm tra các câu hỏi chung chung cụ thể
  const specificGeneralQuestions = [
    'thời tiết', 'nấu cơm', 'nấu ăn', 'làm thế nào', 'cách làm',
    'bạn là ai', 'bạn tên gì', 'xin chào', 'hello', 'hi',
    'chào bạn', 'chào', 'xin chào', 'good morning', 'good afternoon',
    'good evening', 'good night', 'bye', 'tạm biệt', 'hẹn gặp lại'
  ];
  
  const hasSpecificGeneralQuestion = specificGeneralQuestions.some(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );
  
  if (hasSpecificGeneralQuestion && !hasRelevantKeywords) {
    return false;
  }
  
  // Nếu có từ khóa không liên quan và không có từ khóa liên quan
  if (hasIrrelevantKeywords && !hasRelevantKeywords) {
    return false;
  }
  
  // Kiểm tra các pattern không liên quan
  const irrelevantPatterns = [
    /bạn có thể giúp tôi với vấn đề cá nhân/i,
    /tôi đang gặp khó khăn trong cuộc sống/i,
    /bạn có thể tư vấn về tình cảm/i,
    /tôi muốn hỏi về sức khỏe/i,
    /bạn có biết về chính trị/i,
    /tôi cần tư vấn pháp luật/i,
    /bạn có thể dạy tôi/i,
    /tôi muốn học/i,
    /bạn có thể giải thích về/i,
    /^[a-z\s]+\?*$/i,  // Câu hỏi chung chung
    /^[0-9\s\+\-\*\/\?=]+$/i,  // Chỉ có số và phép tính
    /^[a-z0-9\s\+\-\*\/\?=]+$/i  // Chữ và số với phép tính
  ];
  
  const hasIrrelevantPattern = irrelevantPatterns.some(pattern => 
    pattern.test(normalizedMessage)
  );
  
  if (hasIrrelevantPattern && !hasRelevantKeywords) {
    return false;
  }
  
  // Kiểm tra độ dài câu hỏi quá ngắn và không có từ khóa liên quan
  if (normalizedMessage.length < 10 && !hasRelevantKeywords) {
    return false;
  }
  
  return true;
}

// Thêm prompt cơ bản để định hướng AI
const BASE_PROMPT = `Bạn là trợ lý AI chuyên nghiệp của cửa hàng điện thoại Poly Smart. 
Bạn chỉ được phép trả lời các câu hỏi liên quan đến:

1. Sản phẩm điện tử: iPhone, iPad, MacBook, AirPods, Apple Watch
2. Thông tin mua sắm: giá cả, khuyến mãi, flash sale, thanh toán, giao hàng
3. Dịch vụ khách hàng: bảo hành, đổi trả, hỗ trợ kỹ thuật
4. Thông số kỹ thuật và đặc điểm sản phẩm
5. So sánh và đánh giá sản phẩm
6. Tư vấn mua sắm phù hợp

QUAN TRỌNG: Bạn KHÔNG được phép trả lời các câu hỏi về:
- Toán học, phép tính, bài toán
- Chính trị, tôn giáo, sức khỏe, giáo dục, thể thao
- Du lịch, ẩm thực, thời trang, bất động sản
- Tài chính, pháp luật, giải trí, công nghệ lập trình
- Xe cộ, nông nghiệp, công nghiệp, môi trường
- Văn hóa, lịch sử, địa lý, nghệ thuật, tâm lý

Nếu người dùng hỏi về các chủ đề trên, bạn PHẢI từ chối một cách lịch sự và hướng dẫn họ về các chủ đề liên quan đến cửa hàng.
Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. Sử dụng emoji phù hợp để tạo cảm giác gần gũi.`;

// Cải tiến hàm tạo prompt từ chối
function createRejectionPrompt(message) {
  return `Bạn là trợ lý AI của cửa hàng điện thoại Poly Smart. Khách hàng đã hỏi: "${message}"
Hãy trả lời rằng bạn không thể trả lời câu hỏi này vì nó không liên quan đến sản phẩm và dịch vụ của Poly Smart.
Sau đó hướng dẫn họ về các chủ đề bạn có thể hỗ trợ.
Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. Sử dụng emoji phù hợp.`;
}

// Thêm hàm kiểm tra nội dung không phù hợp trong câu trả lời của AI
function containsInappropriateContent(reply) {
  if (!reply) return false;
  
  const inappropriatePatterns = [
    /tôi không thể trả lời/i,
    /tôi không biết/i,
    /tôi không có thông tin/i,
    /tôi không thể giúp/i,
    /tôi không được phép/i,
    /tôi không thể tư vấn/i,
    /tôi không thể đưa ra lời khuyên/i,
    /tôi không thể đánh giá/i,
    /tôi không thể so sánh/i,
    /tôi không thể bình luận/i
  ];
  
  return inappropriatePatterns.some(pattern => pattern.test(reply));
}

// Thêm hàm làm sạch và cải thiện câu trả lời của AI
function cleanAndImproveReply(reply, message) {
  if (!reply) return reply;
  
  // Kiểm tra xem câu trả lời có chứa phép tính toán học không
  const mathAnswerPatterns = [
    /\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\d+/i,  // 1+1=2, 2*3=6, etc.
    /kết quả là \d+/i,  // kết quả là 2
    /đáp án là \d+/i,   // đáp án là 2
    /bằng \d+/i,        // bằng 2
    /=\s*\d+/i          // = 2
  ];
  
  const containsMathAnswer = mathAnswerPatterns.some(pattern => pattern.test(reply));
  if (containsMathAnswer) {
    return `Xin lỗi, em chỉ có thể hỗ trợ thông tin về sản phẩm và dịch vụ của Poly Smart.
     Anh/Chị cần tìm hiểu gì về sản phẩm không ạ?`;
  }
  
  // Kiểm tra câu trả lời có vẻ như đang đánh giá chính mình
  const selfEvaluationPatterns = [
    /tuyệt vời.*cách trả lời/i,
    /rất chuyên nghiệp.*lịch sự/i,
    /bạn đã từ chối.*khéo léo/i,
    /sử dụng emoji.*tăng tính thân thiện/i,
    /hoàn hảo/i,
    /excellent/i,
    /perfect/i,
    /professional/i,
    /polite/i
  ];
  
  const containsSelfEvaluation = selfEvaluationPatterns.some(pattern => pattern.test(reply));
  if (containsSelfEvaluation) {
    return `Xin lỗi, em chỉ có thể hỗ trợ thông tin về sản phẩm và dịch vụ của Poly Smart.
     Anh/Chị cần tìm hiểu gì về sản phẩm không ạ?`;
  }
  
  // Loại bỏ các câu trả lời không phù hợp
  if (containsInappropriateContent(reply)) {
    return `Xin lỗi, em chỉ có thể hỗ trợ thông tin về sản phẩm và dịch vụ của Poly Smart.
     Anh/Chị cần tìm hiểu gì về sản phẩm không ạ?`;
  }
  
  // Đảm bảo câu trả lời có thông tin hữu ích
  if (reply.length < 50) {
    return `Em hiểu câu hỏi của Anh/Chị về "${message}". Tuy nhiên, em cần thêm thông tin để có thể tư vấn chính xác hơn.
Anh/Chị có thể cho em biết cụ thể hơn về:
- Loại sản phẩm Anh/Chị quan tâm (iPhone, iPad, MacBook, v.v.)
- Mục đích sử dụng
- Ngân sách dự kiến
- Các yêu cầu đặc biệt

Em sẽ tư vấn chi tiết và phù hợp nhất cho Anh/Chị! 📱✨`;
  }
  
  return reply;
}

router.post('/chat-ai', async (req, res) => {
  const { message, history } = req.body;
  
  // Kiểm tra xem câu hỏi có liên quan đến cửa hàng không
  if (!isRelevantToStore(message)) {
    // Sử dụng prompt đơn giản và thân thiện hơn
    const simpleRejectionPrompt = `Bạn là trợ lý AI của Poly Smart. Khách hỏi: "${message}" 
    Hãy trả lời một cách thân thiện và tự nhiên: "Xin lỗi, em chỉ có thể hỗ trợ thông tin về sản phẩm và dịch vụ của Poly Smart.
    Anh/Chị cần tìm hiểu gì về sản phẩm không ạ?"`;
    
    try {
      const geminiRes = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            { parts: [ { text: simpleRejectionPrompt } ] }
          ]
        }
      );
      
      let reply = "";
      if (
        geminiRes.data &&
        geminiRes.data.candidates &&
        geminiRes.data.candidates[0] &&
        geminiRes.data.candidates[0].content &&
        geminiRes.data.candidates[0].content.parts &&
        geminiRes.data.candidates[0].content.parts[0] &&
        geminiRes.data.candidates[0].content.parts[0].text
      ) {
        reply = geminiRes.data.candidates[0].content.parts[0].text;
      } else {
        reply = rejectionPrompt;
      }
      
      return res.json({
        reply,
        products: [],
        flashSaleProducts: [],
        isRejected: true
      });
    } catch (err) {
      console.error('Lỗi khi gọi Gemini API cho câu hỏi không liên quan:', err.message);
      return res.json({
        reply: `Xin lỗi, em chỉ có thể hỗ trợ thông tin về sản phẩm và dịch vụ của Poly Smart. 
        Anh/Chị cần tìm hiểu gì về sản phẩm không ạ?`,
        products: [],
        flashSaleProducts: [],
        isRejected: true
      });
    }
  }
  
  const networkOnlyKeywords = [
    'đặc điểm', 'so sánh', 'review', 'ưu điểm', 'nhược điểm', 'có tốt không', 'có nên mua', 'đánh giá', 'so với', 'khác biệt', 'điểm khác'
  ];
  const isNetworkOnly = networkOnlyKeywords.some(k => message.toLowerCase().includes(k));
  
  // Kiểm tra xem có hỏi về flash sale không
  const flashSaleKeywords = ['flash sale', 'flashsale', 'flash-sale', 'giảm giá', 'khuyến mãi', 'sale off', 'chương trình giảm giá', 'sự kiện giảm giá'];
  const isFlashSaleQuery = flashSaleKeywords.some(k => message.toLowerCase().includes(k));
  let products = [];
  let prompt = message;
  let geminiPayload;
  
  if (isNetworkOnly) {
    // lấy kiến thức trên mạng, không lấy từ DB, không gửi history
    products = [];
    prompt = `${BASE_PROMPT}\n\n${message}`;
    geminiPayload = {
      contents: [
        { parts: [ { text: prompt } ] }
      ]
    };
     } else if (isFlashSaleQuery) {
     // Xử lý câu hỏi về flash sale
     const activeFlashSales = await getActiveFlashSales();
     const flashSaleProducts = await getActiveFlashSaleProducts();
     const flashSaleInfo = buildFlashSaleInfoForAI(activeFlashSales);
     const flashSaleProductsInfo = buildFlashSaleProductsForAI(flashSaleProducts);
     
     prompt = `${BASE_PROMPT}\n\nKhách hỏi: "${message}"\n\nThông tin chương trình flash sale hiện tại:\n${flashSaleInfo}${flashSaleProductsInfo}\n\nHãy giới thiệu các chương trình flash sale một cách thân thiện,
      hấp dẫn và khuyến khích khách hàng tham gia. 
      Nếu có sản phẩm flash sale cụ thể, hãy nhấn mạnh ưu đãi và tính khan hiếm.
      Sử dụng emoji và ngôn ngữ bán hàng chuyên nghiệp.`;
     
     geminiPayload = {
       contents: [
         { parts: [ { text: prompt } ] }
       ]
     };
     
     console.log('Truy vấn flash sale:', activeFlashSales.length, 'active events,', flashSaleProducts.length, 'products');
  } else {
    let { nameAndFeatureKeywords, priceKeywords } = extractKeywords(message);
    let compareNames = extractCompareProducts(message);
    const productName = extractProductNameFromMessage(message);
    if (productName) {
      // Tìm sản phẩm theo tên đầy đủ trước
      const allProducts = await Product.find({ an_hien: true }).lean();
      const found = allProducts.filter(p => normalizeString(p.TenSP).includes(normalizeString(productName)));
      for (const p of found) {
        p.variants = await Variant.find({ id_san_pham: p._id.toString(), an_hien: true }).lean();
      }
      products = found;
    }
    if (!products.length) {
      // Kiểm tra xem câu hỏi có từ khóa liên quan đến thông tin sản phẩm không
      const infoKeywords = ['thông số', 'đặc điểm', 'chi tiết', 'cấu hình', 'specs', 'specification', 'kỹ thuật'];
      const hasInfoKeyword = infoKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
             // Nếu không có từ khóa sản phẩm, cố gắng lấy từ history
       if (nameAndFeatureKeywords.length === 0 && history && history.length > 0) {
         // Lấy tin nhắn user gần nhất trong history
         const userMessages = history.filter(h => h.role === 'user');
         if (userMessages.length > 0) {
           const lastUserMessage = userMessages[userMessages.length - 1];
           const previousKeywords = extractKeywords(lastUserMessage.content);
           
           // Kiểm tra xem tin nhắn trước có từ khóa sản phẩm cụ thể không
           const hasPreviousProductKeyword = previousKeywords.nameAndFeatureKeywords.some(keyword => 
             SMART_KEYWORDS.brands.includes(keyword) || 
             /^\d+$/.test(keyword) ||
             keyword.length > 4
           );
           
           if (previousKeywords.nameAndFeatureKeywords.length > 0 && hasPreviousProductKeyword) {
             nameAndFeatureKeywords = previousKeywords.nameAndFeatureKeywords;
             console.log('Lấy context từ history:', nameAndFeatureKeywords);
             
             // Trích xuất tên sản phẩm chính xác từ tin nhắn trước
             const exactProductName = extractProductNameFromMessage(lastUserMessage.content);
             console.log('Tên sản phẩm chính xác từ lịch sử:', exactProductName);
             
             if (exactProductName) {
               // Tìm chính xác sản phẩm đó
               const allProducts = await Product.find({ an_hien: true }).lean();
               const specificProduct = allProducts.find(p => 
                 normalizeString(p.TenSP).includes(normalizeString(exactProductName))
               );
               
               if (specificProduct) {
                 const variants = await Variant.find({ id_san_pham: specificProduct._id.toString(), an_hien: true }).lean();
                 specificProduct.variants = variants;
                 products = [specificProduct];
                 console.log(' Đã tìm thấy sản phẩm cụ thể:', specificProduct.TenSP);
               } else {
                 // Fallback to normal search
                 products = await searchProducts({ nameAndFeatureKeywords, priceKeywords, compareNames, message, fromHistory: true });
               }
             } else {
               // Tìm sản phẩm với flag fromHistory = true
               products = await searchProducts({ nameAndFeatureKeywords, priceKeywords, compareNames, message, fromHistory: true });
               console.log('Tìm thấy sản phẩm từ lịch sử:', products.length);
               
               // Nếu tìm được nhiều sản phẩm, chỉ lấy sản phẩm đầu tiên (có score cao nhất)
               if (products.length > 1) {
                 console.log('Tìm thấy nhiều sản phẩm, lấy sản phẩm có liên quan nhất');
                 products = [products[0]];
               }
             }
           }
         }
       }
      
      // Chỉ gọi searchProducts nếu chưa tìm được từ history
      if (!products.length) {
        products = await searchProducts({ nameAndFeatureKeywords, priceKeywords, compareNames, message });
      }
      
      // Nếu vẫn không tìm được sản phẩm sau khi lấy từ history
      if (!products.length && hasInfoKeyword) {
        console.log('Không tìm thấy sản phẩm từ context, nameAndFeatureKeywords:', nameAndFeatureKeywords);
      }
    }
    if (/so sánh|compare|khác biệt|điểm khác/i.test(message)) {
      prompt = `${BASE_PROMPT}\n\nNếu người dùng yêu cầu so sánh hai sản phẩm, hãy trả lời bằng bảng so sánh (table) ở định dạng Markdown, không dùng đoạn text dài. Nếu có thể, hãy thêm nhận xét ngắn gọn sau bảng.\n\nCâu hỏi của khách: "${message}"`;
         } else if (products.length > 0) {
       const productDataForAI = buildProductInfoForAI(products, message);
       
               // Lấy thông tin flash sale và sản phẩm để đề xuất
        const activeFlashSales = await getActiveFlashSales();
        const flashSaleProducts = await getActiveFlashSaleProducts();
        const flashSaleInfo = activeFlashSales.length > 0 ? `\n\n🔥 THÔNG TIN FLASH SALE:\n${buildFlashSaleInfoForAI(activeFlashSales)}` : '';
        const flashSaleProductsInfo = buildFlashSaleProductsForAI(flashSaleProducts);
       
                // Nếu hỏi về thông số kỹ thuật, tùy chỉnh prompt
         if (/thông số|kỹ thuật|đặc điểm|chi tiết|cấu hình|specs|specification/i.test(message)) {
           prompt = `${BASE_PROMPT}\n\nKhách hỏi: "${message}"\nDưới đây là thông tin chi tiết sản phẩm:\n${productDataForAI}${flashSaleInfo}${flashSaleProductsInfo}\nHãy trình bày thông số kỹ thuật một cách rõ ràng, dễ hiểu và hấp dẫn. Nếu không có thông số kỹ thuật cụ thể, hãy tư vấn dựa trên thông tin có sẵn. Nếu có flash sale và sản phẩm flash sale, hãy nhắc nhở khách hàng về cơ hội giảm giá và tính khan hiếm.`;
         } else {
           prompt = `${BASE_PROMPT}\n\nKhách hỏi: "${message}"\nDưới đây là các sản phẩm phù hợp:\n${productDataForAI}${flashSaleInfo}${flashSaleProductsInfo}\nHãy tư vấn ngắn gọn, thân thiện. Nếu có flash sale và sản phẩm flash sale đang diễn ra, hãy nhắc nhở khách hàng về cơ hội mua sắm với giá ưu đãi và tính khan hiếm của sản phẩm.`;
         }
     } else {
        // Kiểm tra xem có phải câu hỏi về thông tin sản phẩm không
        const infoKeywords = ['thông số', 'đặc điểm', 'chi tiết', 'cấu hình', 'specs', 'specification', 'kỹ thuật'];
        const hasInfoKeyword = infoKeywords.some(keyword => 
          message.toLowerCase().includes(keyword)
        );
        
                            if (hasInfoKeyword) {
             // Lấy flash sale và sản phẩm để đề xuất khi không tìm thấy sản phẩm
             const activeFlashSales = await getActiveFlashSales();
             const flashSaleProducts = await getActiveFlashSaleProducts();
             const flashSaleInfo = activeFlashSales.length > 0 ? `\n\n🔥 Tuy nhiên, bạn có thể quan tâm đến các chương trình flash sale đang diễn ra:\n${buildFlashSaleInfoForAI(activeFlashSales)}` : '';
             const flashSaleProductsInfo = buildFlashSaleProductsForAI(flashSaleProducts);
             
             prompt = `${BASE_PROMPT}\n\nKhách hỏi: "${message}"\nHiện tại tôi chưa rõ bạn muốn hỏi thông tin về sản phẩm nào. Bạn có thể cho tôi biết cụ thể tên sản phẩm không ạ? Ví dụ: iPhone 15 Plus, MacBook Pro, iPad Air,...${flashSaleInfo}${flashSaleProductsInfo}`;
           } else {
             // Có thể đề xuất flash sale cho các câu hỏi chung chung
             const activeFlashSales = await getActiveFlashSales();
             const flashSaleProducts = await getActiveFlashSaleProducts();
             if (activeFlashSales.length > 0 || flashSaleProducts.length > 0) {
               const flashSaleInfo = buildFlashSaleInfoForAI(activeFlashSales);
               const flashSaleProductsInfo = buildFlashSaleProductsForAI(flashSaleProducts);
               prompt = `${BASE_PROMPT}\n\n${message}\n\n🔥 Hiện tại cửa hàng đang có chương trình flash sale hấp dẫn:\n${flashSaleInfo}${flashSaleProductsInfo}`;
             } else {
               prompt = `${BASE_PROMPT}\n\n${message}`;
             }
           }
      }
    // Chuẩn bị payload cho Gemini API
    if (products.length > 0 && history && history.length > 0) {
      // Nếu có sản phẩm và có history, gửi kèm history để AI hiểu context
      const historyContents = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));
      
      geminiPayload = {
        contents: [
          ...historyContents,
          { 
            role: 'user',
            parts: [{ text: prompt }] 
          }
        ]
      };
    } else {
      geminiPayload = {
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      };
    }
  }
  let reply = "";
  try {
    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      geminiPayload
    );
    // Kiểm tra an toàn dữ liệu trả về từ Gemini
    if (
      geminiRes.data &&
      geminiRes.data.candidates &&
      geminiRes.data.candidates[0] &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.parts &&
      geminiRes.data.candidates[0].content.parts[0] &&
      geminiRes.data.candidates[0].content.parts[0].text
    ) {
      reply = geminiRes.data.candidates[0].content.parts[0].text;
      
      // Làm sạch và cải thiện câu trả lời
      reply = cleanAndImproveReply(reply, message);
    } else {
      console.error('Gemini trả về dữ liệu không đúng định dạng:', JSON.stringify(geminiRes.data));
      reply = "Xin lỗi, AI không trả về kết quả phù hợp.";
    }
  } catch (err) {
    console.error('Lỗi khi gọi Gemini API:', err.message);
    if (err.response && err.response.data) {
      console.error('Chi tiết:', err.response.data);
    }
    reply = "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
  }

     // Nếu AI trả lời có nhắc tên sản phẩm cụ thể, chỉ render các sản phẩm đó
   let filteredProducts = products;
   const aiProductNames = extractProductNamesFromAIReply(reply);
   if (aiProductNames.length > 0 && products && products.length > 0) {
     filteredProducts = products.filter(p => {
       const normName = (p.TenSP || '').toLowerCase();
       return aiProductNames.some(aiName => normName.includes(aiName));
     });
   }
   
   // Lấy sản phẩm flash sale để hiển thị trong khung sản phẩm
   let flashSaleProducts = [];
   let finalProducts = filteredProducts;
   
   // CHỈ lấy và hiển thị flash sale products khi khách hỏi trực tiếp về flash sale
   if (isFlashSaleQuery) {
     try {
       flashSaleProducts = await getActiveFlashSaleProducts();
       finalProducts = [...flashSaleProducts, ...filteredProducts];
     } catch (error) {
       console.error('Lỗi khi lấy flash sale products:', error);
       finalProducts = filteredProducts;
     }
   }
 
   res.json({
     reply,
     products: finalProducts,
     flashSaleProducts: [] 
   });
});

// API sinh mô tả sản phẩm chuẩn SEO bằng AI
router.post('/generate-product-description', async (req, res) => {
  const { name, specs } = req.body;
  if (!name || !specs) {
    return res.status(400).json({ success: false, message: 'Thiếu tên sản phẩm hoặc thông số kỹ thuật.' });
  }
  // Tạo prompt cho AI
  let specsText = Object.entries(specs).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
  const prompt = `Viết một đoạn mô tả sản phẩm chuẩn SEO, thu hút khách hàng cho sản phẩm sau:\nTên: ${name}\nThông số kỹ thuật:\n${specsText}\nĐoạn mô tả nên ngắn gọn, hấp dẫn, có chứa từ khóa liên quan.`;
  try {
    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }
    );
    let description = '';
    if (
      geminiRes.data &&
      geminiRes.data.candidates &&
      geminiRes.data.candidates[0] &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.parts &&
      geminiRes.data.candidates[0].content.parts[0] &&
      geminiRes.data.candidates[0].content.parts[0].text
    ) {
      description = geminiRes.data.candidates[0].content.parts[0].text;
    } else {
      description = 'Không thể sinh mô tả AI.';
    }
    res.json({ success: true, description });
  } catch (err) {
    console.error('Lỗi khi gọi Gemini API:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi AI hoặc mạng.' });
  }
});

// API sinh thông số kỹ thuật tự động bằng AI
router.post('/generate-product-specs', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Thiếu tên sản phẩm.' });
  }
  
  const prompt = `Dựa trên tên sản phẩm "${name}", hãy sinh ra thông số kỹ thuật chi tiết. Trả về kết quả dưới dạng JSON object với các trường sau:
{
  "CPU": "tên chip xử lý",
  "Camera": ["camera chính", "camera phụ", "camera selfie"],
  "GPU": "tên GPU",
  "Cong_nghe_man_hinh": "công nghệ màn hình",
  "He_dieu_hanh": "hệ điều hành",
  "Do_phan_giai": "độ phân giải màn hình",
  "Ket_noi": ["wifi", "bluetooth", "5g", "4g"],
  "Kich_thuoc_khoi_luong": ["kích thước", "trọng lượng"],
  "Kich_thuoc_man_hinh": "kích thước màn hình",
  "Tien_ich_khac": ["tính năng 1", "tính năng 2"],
  "Tinh_nang_camera": ["tính năng camera 1", "tính năng camera 2"]
}

Chỉ trả về JSON object, không có text khác.`;
  
  try {
    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }
    );
    
    let specs = {};
    if (
      geminiRes.data &&
      geminiRes.data.candidates &&
      geminiRes.data.candidates[0] &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.parts &&
      geminiRes.data.candidates[0].content.parts[0] &&
      geminiRes.data.candidates[0].content.parts[0].text
    ) {
      const responseText = geminiRes.data.candidates[0].content.parts[0].text;
      try {
        // Tìm JSON trong response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          specs = JSON.parse(jsonMatch[0]);
        } else {
          specs = {};
        }
      } catch (parseError) {
        console.error('Lỗi parse JSON:', parseError);
        specs = {};
      }
    }
    
    res.json({ success: true, specs });
  } catch (err) {
    console.error('Lỗi khi gọi Gemini API:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi AI hoặc mạng.' });
  }
});

module.exports = router;


