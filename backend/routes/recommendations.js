const express = require('express');
const router = express.Router();
const UserEvent = require('../models/userEventModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');
const axios = require('axios');

// Khóa API và URL để gọi Gemini AI
const GEMINI_API_KEY = 'AIzaSyD9o82yYzXah3pB1ebRSq35BBX51VqQY-o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// API lấy danh sách sản phẩm gợi ý cho user dựa trên hành vi xem sản phẩm
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Kiểm tra userId có hợp lệ không
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Bước 1: Lấy danh sách sản phẩm user đã xem gần đây (giới hạn 10 sản phẩm)
    const viewedEvents = await UserEvent.find({ userId, eventType: 'view_product' })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    
    // Nếu user chưa xem sản phẩm nào thì trả về mảng rỗng
    if (!viewedEvents.length) {
      return res.json([]);
    }
    
    // Lấy thông tin chi tiết của các sản phẩm đã xem và tất cả sản phẩm
    const viewedProductIds = [...new Set(viewedEvents.map(e => e.productId))].map(id => new mongoose.Types.ObjectId(id));
    const viewedProducts = await Product.find({ _id: { $in: viewedProductIds } }).lean();
    const allProducts = await Product.find({}).lean();

    // Xác định sản phẩm và danh mục mà user vừa xem gần nhất
    const mostRecentProduct = viewedProducts.find(p => p._id.equals(viewedEvents[0].productId));
    const mostRecentCategory = mostRecentProduct?.category || '';
    
    // Ghi log để debug
    console.log('Most recent product:', mostRecentProduct?.TenSP);
    console.log('Most recent category:', mostRecentCategory);

    // Lấy thông tin về giỏ hàng và từ khóa tìm kiếm của user (để tạo context phong phú)
    const cartEvents = await UserEvent.find({ userId, eventType: 'add_to_cart' }).lean();
    const searchEvents = await UserEvent.find({ userId, eventType: 'search' }).lean();
    const cartProductIds = cartEvents.map(e => e.productId).filter(Boolean);
    const cartProducts = await Product.find({ _id: { $in: cartProductIds } }).lean();
    const cartProductNames = cartProducts.map(p => p.TenSP);
    const searchKeywords = searchEvents.map(e => e.searchKeyword).filter(Boolean);

    // Bước 2: Chuẩn bị prompt cho Gemini AI (đồng bộ với aiAdvice.js)
    const listProductNames = viewedProducts.map(p => p.TenSP).join(', ');
    
    // Sắp xếp tất cả sản phẩm để ưu tiên danh mục của sản phẩm vừa xem
    const sortedAllProducts = allProducts.sort((a, b) => {
      if (a.category === mostRecentCategory && b.category !== mostRecentCategory) return -1;
      if (b.category === mostRecentCategory && a.category !== mostRecentCategory) return 1;
      return 0;
    });
    const allProductNames = sortedAllProducts.map(p => p.TenSP).join(', ');

    // Tạo prompt chi tiết để AI hiểu rõ yêu cầu
    const prompt = `
Chào bạn! Mình để ý bạn vừa xem qua sản phẩm: ${mostRecentProduct?.TenSP || 'Không có'}.
Danh mục của sản phẩm này: ${mostRecentCategory || 'Không có'}.
Ngoài ra, bạn đã xem các sản phẩm: ${listProductNames}.
Và bạn đã tìm kiếm với từ khóa: ${searchKeywords.join(', ') || 'Chưa có'}.

Từ danh sách sản phẩm sau, hãy chọn ĐÚNG 16 sản phẩm phù hợp nhất. 
Ưu tiên các sản phẩm thuộc danh mục "${mostRecentCategory}" hoặc liên quan đến "${mostRecentProduct?.TenSP || ''}".
Hãy đảm bảo các sản phẩm thuộc danh mục "${mostRecentCategory}" được liệt kê trước.

QUAN TRỌNG: Chỉ trả về tên sản phẩm, mỗi tên một dòng, KHÔNG có số thứ tự, KHÔNG có giải thích.

Danh sách sản phẩm: ${allProductNames}`;

    // Chuẩn bị dữ liệu để gửi đến Gemini API
    const geminiPayload = {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    };

    // Bước 3: Gọi Gemini AI API để lấy danh sách sản phẩm gợi ý
    let reply = '';
    try {
      const geminiRes = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        geminiPayload,
        { timeout: 10000 } // Timeout 10 giây
      );
      
      // Lấy kết quả từ API response
      if (geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        reply = geminiRes.data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      // Xử lý các loại lỗi khác nhau
      if (err.code === 'ECONNABORTED') {
        console.error('Gemini API timeout');
      } else if (err.response?.status === 429) {
        console.error('Rate limit exceeded');
      } else {
        console.error('Gemini API error:', err.message);
      }
      
      // Sử dụng fallback khi API gặp lỗi
      let fallbackProducts = [];
      if (mostRecentCategory) {
        // Lấy sản phẩm cùng danh mục, sắp xếp theo độ bán chạy
        fallbackProducts = allProducts
          .filter(p => p.category === mostRecentCategory && !viewedProductIds.includes(p._id))
          .sort((a, b) => (b.ban_chay || 0) - (a.ban_chay || 0));
      }
      if (fallbackProducts.length < 16) {
        // Bổ sung sản phẩm từ danh mục khác nếu chưa đủ 16
        const moreProducts = allProducts
          .filter(p => !viewedProductIds.includes(p._id) && p.category !== mostRecentCategory)
          .sort((a, b) => (b.ban_chay || 0) - (a.ban_chay || 0));
        fallbackProducts = [
          ...fallbackProducts,
          ...moreProducts.slice(0, 16 - fallbackProducts.length)
        ];
      }
      return res.json(fallbackProducts.slice(0, 16));
    }

    // Bước 4: Xử lý kết quả từ AI - tách tên sản phẩm từ reply
    const recommendedNames = reply
      .split('\n')
      .map(line => line.replace(/^[-\d.\s*]+/, '').trim()) // Loại bỏ số thứ tự, dấu gạch đầu dòng
      .filter(Boolean); // Loại bỏ dòng rỗng

    // Bước 5: Logic matching - tìm sản phẩm thực tế dựa trên tên AI đã gợi ý
    const normalize = str => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    let recommendedProducts = [];

    // Tìm sản phẩm có tên khớp chính xác với AI đã gợi ý
    const exactMatches = allProducts.filter(p =>
      recommendedNames.some(name => normalize(p.TenSP) === normalize(name))
    );

    // Sắp xếp kết quả: ưu tiên danh mục vừa xem, giữ thứ tự từ AI
    recommendedProducts = exactMatches
      .sort((a, b) => {
        // Ưu tiên danh mục của sản phẩm vừa xem
        if (a.category === mostRecentCategory && b.category !== mostRecentCategory) return -1;
        if (b.category === mostRecentCategory && a.category !== mostRecentCategory) return 1;
        // Giữ thứ tự từ AI nếu cùng danh mục
        return recommendedNames.indexOf(a.TenSP) - recommendedNames.indexOf(b.TenSP);
      })
      .slice(0, 16); // Giới hạn 16 sản phẩm

    // Ghi log để debug và theo dõi
    console.log('Gemini reply:', reply);
    console.log('Recommended names:', recommendedNames.length, 'items');
    console.log('Exact matches:', exactMatches.length);
    console.log('Final recommended:', recommendedProducts.map(p => p.TenSP));

    // Bước 6: Fallback khi AI không trả về kết quả
    if (recommendedProducts.length === 0) {
      console.log('No Gemini results, using last-viewed-category and best-seller fallback');
      let fallbackByCategory = [];
      if (mostRecentCategory) {
        // Lấy sản phẩm cùng danh mục, sắp xếp theo độ bán chạy
        fallbackByCategory = allProducts
          .filter(p => p.category === mostRecentCategory && !viewedProductIds.includes(p._id))
          .sort((a, b) => (b.ban_chay || 0) - (a.ban_chay || 0));
      }
      if (fallbackByCategory.length < 16) {
        // Bổ sung sản phẩm từ danh mục khác nếu chưa đủ 16
        const moreProducts = allProducts
          .filter(p => !viewedProductIds.includes(p._id) && p.category !== mostRecentCategory)
          .sort((a, b) => (b.ban_chay || 0) - (a.ban_chay || 0));
        fallbackByCategory = [
          ...fallbackByCategory,
          ...moreProducts.slice(0, 16 - fallbackByCategory.length)
        ];
      }
      recommendedProducts = fallbackByCategory.slice(0, 16);
    }

    // Trả về danh sách sản phẩm gợi ý cuối cùng
    res.json(recommendedProducts);
  } catch (err) {
    // Xử lý lỗi chung
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router;