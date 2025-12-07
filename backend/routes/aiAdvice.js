const express = require('express');
const router = express.Router();
const UserEvent = require('../models/userEventModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const axios = require('axios');

// Khóa API và URL để gọi Gemini AI
const GEMINI_API_KEY = 'AIzaSyD9o82yYzXah3pB1ebRSq35BBX51VqQY-o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// API tư vấn AI cho user dựa trên hành vi xem sản phẩm và tìm kiếm
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  
  try {
    // Lấy danh sách sản phẩm user đã xem gần đây (giới hạn 5 sản phẩm để có context vừa đủ)
    const viewedEvents = await UserEvent.find({ userId, eventType: 'view_product' })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
      
    // Nếu user chưa xem sản phẩm nào thì trả về message khuyến khích
    if (!viewedEvents.length) {
      return res.json({ 
        message: 'Chào bạn! Hãy xem một số sản phẩm Apple để mình có thể tư vấn phù hợp nhất nhé!' 
      });
    }
    
    // Lấy thông tin chi tiết của các sản phẩm đã xem và tất cả sản phẩm
    const viewedProductIds = [...new Set(viewedEvents.map(e => e.productId))].map(id => new mongoose.Types.ObjectId(id));
    const viewedProducts = await Product.find({ _id: { $in: viewedProductIds }, an_hien: true }).lean();
    const allProducts = await Product.find({ an_hien: true }).lean();

    // Lấy thông tin về giỏ hàng và từ khóa tìm kiếm của user (để tạo context phong phú)
    const cartEvents = await UserEvent.find({ userId, eventType: 'add_to_cart' }).lean();
    const searchEvents = await UserEvent.find({ userId, eventType: 'search' }).lean();
    const cartProductIds = cartEvents.map(e => e.productId).filter(Boolean);
    const cartProducts = await Product.find({ _id: { $in: cartProductIds }, an_hien: true }).lean();
    const cartProductNames = cartProducts.map(p => p.TenSP);
    const searchKeywords = searchEvents.map(e => e.searchKeyword).filter(Boolean);

    // Tạo context phong phú và thông minh hơn dựa trên hành vi của user
    const userContext = [];
    if (viewedProducts.length > 0) {
      const productNames = viewedProducts.map(p => p.TenSP);
      userContext.push(`Bạn vừa xem qua: ${productNames.join(', ')}`);
    }
    if (searchKeywords.length > 0) {
      userContext.push(`Bạn đã tìm kiếm: ${searchKeywords.join(', ')}`);
    }
    
    // Kết hợp các thông tin context thành một chuỗi
    const contextString = userContext.join('. ');
    
    // Tạo prompt thông minh và chi tiết hơn để AI hiểu rõ vai trò và yêu cầu
    const prompt = `
    Bạn là một chuyên viên tư vấn Apple Store thân thiện, vui tính và am hiểu sâu về sản phẩm Apple. Hãy tư vấn cho khách hàng dựa trên thông tin sau:

    ${contextString}

    Hãy tư vấn theo cách:
    1. Bắt đầu bằng lời chào thân thiện và nhận xét thông minh về sở thích của họ
    2. Gợi ý 2-3 sản phẩm Apple phù hợp nhất từ danh sách: ${allProducts.map(p => p.TenSP).join(', ')}
    3. Giải thích lý do tại sao những sản phẩm này phù hợp với họ (dựa trên hành vi xem sản phẩm)
    4. Thêm một số lời khuyên hữu ích về việc sử dụng hoặc mua sắm
    5. Kết thúc bằng lời khuyến khích thân thiện và vui vẻ

    Yêu cầu:
    - Viết như một cuộc trò chuyện tự nhiên, thân thiện như đang nói chuyện với bạn bè
    - Sử dụng ngôn ngữ Việt Nam thân thiện, có thể dùng emoji nhẹ nhàng
    - Đừng liệt kê theo dạng bảng hay bullet points
    - Tạo cảm giác như đang nói chuyện với bạn bè thân thiết
    - Thêm một chút hài hước nhẹ nhàng, vui vẻ nếu phù hợp
    - Độ dài khoảng 4-5 câu, đủ để tạo sự thân thiện nhưng không quá dài
    - Sử dụng ngôn ngữ trẻ trung, hiện đại nhưng vẫn lịch sự
    - Có thể dùng các từ ngữ như "mình", "bạn", "nhé", "đấy" để tạo sự gần gũi
    `;

    // Chuẩn bị dữ liệu để gửi đến Gemini API
    const geminiPayload = {
      contents: [
        { parts: [ { text: prompt } ] }
      ]
    };

    // Gọi Gemini AI API với xử lý lỗi tốt hơn
    let reply = '';
    try {
      const geminiRes = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        geminiPayload,
        { timeout: 10000 } // Timeout 10 giây để tránh chờ quá lâu
      );
      
      // Kiểm tra và lấy kết quả từ API response
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
        // Sử dụng fallback message nếu API trả về dữ liệu không đúng format
        reply = generateFallbackMessage(viewedProducts, cartProducts, searchKeywords);
      }
    } catch (err) {
      console.error('Gemini API error:', err.message);
      // Sử dụng fallback message khi API gặp lỗi
      reply = generateFallbackMessage(viewedProducts, cartProducts, searchKeywords);
    }

    // Trả về message tư vấn AI động cho user
    res.json({ message: reply });
    
  } catch (err) {
    // Xử lý lỗi chung của toàn bộ quá trình
    console.error('AI advice error:', err);
    res.status(500).json({ 
      message: 'Xin lỗi, mình đang gặp chút vấn đề kỹ thuật. Hãy thử lại sau nhé!' 
    });
  }
});

// Hàm tạo fallback message khi AI API gặp lỗi hoặc không hoạt động
function generateFallbackMessage(viewedProducts, cartProducts, searchKeywords) {
  // Danh sách các message fallback đã chuẩn bị sẵn
  const messages = [
    `Chào bạn! Mình thấy bạn rất quan tâm đến Apple. Dựa trên những gì bạn đã xem và tìm kiếm, mình nghĩ bạn sẽ thích một số sản phẩm trong bộ sưu tập của chúng mình. Hãy để mình gợi ý cho bạn nhé!`,
    
    `Hey! Mình để ý bạn đang tìm hiểu về Apple. Với sở thích của bạn, mình tin rằng có một số sản phẩm sẽ rất phù hợp. Hãy để mình tư vấn thêm nhé!`,
    
    `Chào bạn! Mình thấy bạn có gu chọn sản phẩm rất tốt đấy. Dựa trên những gì bạn đã xem, mình có một vài gợi ý thú vị cho bạn. Bạn có muốn nghe không?`,
    
    `Xin chào! Mình để ý bạn rất am hiểu về Apple. Với kinh nghiệm của bạn, mình nghĩ có một số sản phẩm mới sẽ làm bạn thích thú. Để mình gợi ý nhé!`
  ];
  
  // Chọn message ngẫu nhiên từ danh sách để tạo sự đa dạng
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

module.exports = router; 