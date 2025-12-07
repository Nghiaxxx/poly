const axios = require('axios');
const GEMINI_API_KEY = 'AIzaSyD9o82yYzXah3pB1ebRSq35BBX51VqQY-o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Ngưỡng điểm số để quyết định từ chối
const SPAM_THRESHOLD = 70;
const TOXIC_THRESHOLD = 70;
const OVERALL_THRESHOLD = 75;

class AICommentChecker {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.apiUrl = GEMINI_API_URL;
  }

  /**
   * Kiểm tra bình luận có phải spam không
   * @param {string} comment - Nội dung bình luận
   * @param {Object} userInfo - Thông tin người dùng
   * @param {Object} productInfo - Thông tin sản phẩm
   * @returns {Object} - Kết quả kiểm tra
   */
  async checkSpam(comment, userInfo, productInfo) {
    try {
      console.log('🔍 [AI CHECK] Bắt đầu kiểm tra SPAM:', {
        comment: comment.substring(0, 100) + (comment.length > 100 ? '...' : ''),
        user: userInfo.TenKH || 'Khách',
        product: productInfo.TenSP || 'Không xác định',
        timestamp: new Date().toISOString()
      });

      const prompt = `
Bạn là hệ thống AI kiểm tra spam bình luận. Hãy phân tích bình luận sau và trả về kết quả dưới dạng JSON:

BÌNH LUẬN: "${comment}"
NGƯỜI DÙNG: ${userInfo.TenKH || 'Khách'}
SẢN PHẨM: ${productInfo.TenSP || 'Không xác định'}

Hãy kiểm tra các dấu hiệu spam sau:
1. Nội dung lặp lại, copy-paste
2. Liên kết quảng cáo không liên quan
3. Nội dung quá ngắn hoặc quá dài
4. Sử dụng từ khóa spam
5. Bình luận không liên quan đến sản phẩm
6. Nhiều bình luận giống nhau từ cùng 1 user

QUY TẮC QUYẾT ĐỊNH:
- Nếu spamScore >= 70: isSpam = true
- Nếu spamScore < 70: isSpam = false
- spamScore phải từ 0-100

Trả về JSON với format:
{
  "isSpam": true/false,
  "spamScore": 0-100,
  "spamReasons": ["lý do 1", "lý do 2"],
  "suggestion": "gợi ý cải thiện"
}

Chỉ trả về JSON, không có text khác.`;

      console.log('📤 [AI CHECK] Gửi request đến Gemini API...');
      const startTime = Date.now();
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ [AI CHECK] Gemini API response time: ${responseTime}ms`);

      const result = this.parseGeminiResponse(response);
      console.log('📥 [AI CHECK] Kết quả SPAM từ Gemini:', result);
      
      // Đảm bảo tính nhất quán giữa điểm số và flag
      const originalIsSpam = result.isSpam;
      if (result.spamScore >= SPAM_THRESHOLD && !result.isSpam) {
        result.isSpam = true;
        console.log(`⚠️ [AI CHECK] Tự động sửa chữa: spamScore ${result.spamScore}% >= ${SPAM_THRESHOLD}% nhưng isSpam = false → sửa thành true`);
      } else if (result.spamScore < SPAM_THRESHOLD && result.isSpam) {
        result.isSpam = false;
        console.log(`⚠️ [AI CHECK] Tự động sửa chữa: spamScore ${result.spamScore}% < ${SPAM_THRESHOLD}% nhưng isSpam = true → sửa thành false`);
      }
      
      if (originalIsSpam !== result.isSpam) {
        console.log(`✅ [AI CHECK] Đã sửa chữa kết quả SPAM: ${originalIsSpam} → ${result.isSpam}`);
      }
      
      console.log('✅ [AI CHECK] Hoàn thành kiểm tra SPAM:', {
        isSpam: result.isSpam,
        spamScore: result.spamScore,
        spamReasons: result.spamReasons,
        suggestion: result.suggestion
      });
      
      return result;
    } catch (error) {
      console.error('❌ [AI CHECK] Lỗi khi check spam:', error.message);
      return {
        isSpam: false,
        spamScore: 0,
        spamReasons: ['Không thể kiểm tra do lỗi hệ thống'],
        suggestion: 'Bình luận được chấp nhận tạm thời'
      };
    }
  }

  /**
   * Kiểm tra nội dung bình luận có xấu không
   * @param {string} comment - Nội dung bình luận
   * @returns {Object} - Kết quả kiểm tra
   */
  async checkToxicContent(comment) {
    try {
      console.log('🔍 [AI CHECK] Bắt đầu kiểm tra TOXIC:', {
        comment: comment.substring(0, 100) + (comment.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      });

      const prompt = `
Bạn là hệ thống AI kiểm tra nội dung độc hại. Hãy phân tích bình luận sau và trả về kết quả dưới dạng JSON:

BÌNH LUẬN: "${comment}"

Hãy kiểm tra các nội dung độc hại sau:
1. Từ ngữ thô tục, chửi bới
2. Nội dung khiêu dâm, phản cảm
3. Nội dung bạo lực, đe dọa
4. Nội dung phân biệt đối xử, kỳ thị
5. Nội dung chính trị nhạy cảm
6. Nội dung quảng cáo trái phép
7. Nội dung giả mạo, lừa đảo

QUY TẮC QUYẾT ĐỊNH:
- Nếu toxicityScore >= 70: isToxic = true
- Nếu toxicityScore < 70: isToxic = false
- toxicityScore phải từ 0-100
- severity: "low" (0-30), "medium" (31-70), "high" (71-100)

Trả về JSON với format:
{
  "isToxic": true/false,
  "toxicityScore": 0-100,
  "toxicityTypes": ["loại độc hại 1", "loại độc hại 2"],
  "severity": "low/medium/high",
  "suggestion": "gợi ý cải thiện"
}

Chỉ trả về JSON, không có text khác.`;

      console.log('📤 [AI CHECK] Gửi request đến Gemini API cho TOXIC...');
      const startTime = Date.now();
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ [AI CHECK] Gemini API response time cho TOXIC: ${responseTime}ms`);

      const result = this.parseGeminiResponse(response);
      console.log('📥 [AI CHECK] Kết quả TOXIC từ Gemini:', result);
      
      // Đảm bảo tính nhất quán giữa điểm số và flag
      const originalIsToxic = result.isToxic;
      if (result.toxicityScore >= TOXIC_THRESHOLD && !result.isToxic) {
        result.isToxic = true;
        console.log(`⚠️ [AI CHECK] Tự động sửa chữa: toxicityScore ${result.toxicityScore}% >= ${TOXIC_THRESHOLD}% nhưng isToxic = false → sửa thành true`);
      } else if (result.toxicityScore < TOXIC_THRESHOLD && result.isToxic) {
        result.isToxic = false;
        console.log(`⚠️ [AI CHECK] Tự động sửa chữa: toxicityScore ${result.toxicityScore}% < ${TOXIC_THRESHOLD}% nhưng isToxic = true → sửa thành false`);
      }
      
      if (originalIsToxic !== result.isToxic) {
        console.log(`✅ [AI CHECK] Đã sửa chữa kết quả TOXIC: ${originalIsToxic} → ${result.isToxic}`);
      }
      
      // Đảm bảo severity nhất quán với điểm số
      const originalSeverity = result.severity;
      if (result.toxicityScore <= 30) {
        result.severity = 'low';
      } else if (result.toxicityScore <= 70) {
        result.severity = 'medium';
      } else {
        result.severity = 'high';
      }
      
      if (originalSeverity !== result.severity) {
        console.log(`⚠️ [AI CHECK] Tự động sửa chữa severity: ${originalSeverity} → ${result.severity} (dựa trên toxicityScore ${result.toxicityScore}%)`);
      }
      
      console.log('✅ [AI CHECK] Hoàn thành kiểm tra TOXIC:', {
        isToxic: result.isToxic,
        toxicityScore: result.toxicityScore,
        toxicityTypes: result.toxicityTypes,
        severity: result.severity,
        suggestion: result.suggestion
      });
      
      return result;
    } catch (error) {
      console.error('❌ [AI CHECK] Lỗi khi check toxic content:', error.message);
      return {
        isToxic: false,
        toxicityScore: 0,
        toxicityTypes: ['Không thể kiểm tra do lỗi hệ thống'],
        severity: 'low',
        suggestion: 'Bình luận được chấp nhận tạm thời'
      };
    }
  }

  /**
   * Kiểm tra tổng hợp bình luận
   * @param {string} comment - Nội dung bình luận
   * @param {Object} userInfo - Thông tin người dùng
   * @param {Object} productInfo - Thông tin sản phẩm
   * @returns {Object} - Kết quả kiểm tra tổng hợp
   */
  async checkComment(comment, userInfo, productInfo) {
    try {
      console.log('🚀 [AI CHECK] ===== BẮT ĐẦU KIỂM TRA BÌNH LUẬN =====');
      console.log('📝 [AI CHECK] Thông tin bình luận:', {
        comment: comment.substring(0, 100) + (comment.length > 100 ? '...' : ''),
        user: userInfo.TenKH || 'Khách',
        product: productInfo.TenSP || 'Không xác định',
        commentLength: comment.length,
        timestamp: new Date().toISOString()
      });
      console.log('⚙️ [AI CHECK] Ngưỡng điểm số:', {
        SPAM_THRESHOLD,
        TOXIC_THRESHOLD,
        OVERALL_THRESHOLD
      });

      // Kiểm tra song song
      console.log('🔄 [AI CHECK] Bắt đầu kiểm tra song song SPAM và TOXIC...');
      const startTime = Date.now();
      
      const [spamResult, toxicResult] = await Promise.all([
        this.checkSpam(comment, userInfo, productInfo),
        this.checkToxicContent(comment)
      ]);

      const totalTime = Date.now() - startTime;
      console.log(`⏱️ [AI CHECK] Tổng thời gian kiểm tra song song: ${totalTime}ms`);

      // Tính điểm tổng hợp và quyết định từ chối
      const overallScore = Math.max(spamResult.spamScore, toxicResult.toxicityScore);
      console.log('📊 [AI CHECK] Kết quả điểm số:', {
        spamScore: spamResult.spamScore,
        toxicityScore: toxicResult.toxicityScore,
        overallScore
      });
      
      // Logic quyết định cải thiện: từ chối nếu có flag hoặc điểm số vượt ngưỡng
      const isRejected = 
        spamResult.isSpam || 
        toxicResult.isToxic ||
        spamResult.spamScore >= SPAM_THRESHOLD ||
        toxicResult.toxicityScore >= TOXIC_THRESHOLD ||
        overallScore >= OVERALL_THRESHOLD;

      console.log('🎯 [AI CHECK] Quyết định từ chối:', {
        spamResult_isSpam: spamResult.isSpam,
        toxicResult_isToxic: toxicResult.isToxic,
        spamScore_over_threshold: spamResult.spamScore >= SPAM_THRESHOLD,
        toxicityScore_over_threshold: toxicResult.toxicityScore >= TOXIC_THRESHOLD,
        overallScore_over_threshold: overallScore >= OVERALL_THRESHOLD,
        final_isRejected: isRejected
      });

      // Xác định lý do từ chối
      const rejectionReasons = [];
      if (spamResult.isSpam || spamResult.spamScore >= SPAM_THRESHOLD) {
        rejectionReasons.push('Spam');
      }
      if (toxicResult.isToxic || toxicResult.toxicityScore >= TOXIC_THRESHOLD) {
        rejectionReasons.push('Nội dung độc hại');
      }
      if (overallScore >= OVERALL_THRESHOLD && rejectionReasons.length === 0) {
        rejectionReasons.push('Điểm tổng hợp cao');
      }

      console.log('📋 [AI CHECK] Lý do từ chối:', rejectionReasons);

      // Xác định recommendation
      let recommendation = 'approve';
      if (isRejected) {
        if (overallScore >= 90) {
          recommendation = 'reject';
        } else if (overallScore >= 70) {
          recommendation = 'review';
        } else {
          recommendation = 'approve';
        }
      }

      console.log('💡 [AI CHECK] Recommendation:', {
        overallScore,
        recommendation,
        reason: recommendation === 'reject' ? 'Điểm quá cao (>=90)' : 
                recommendation === 'review' ? 'Điểm cao (>=70)' : 'Điểm thấp (<70)'
      });

      const finalResult = {
        isRejected,
        overallScore,
        spam: spamResult,
        toxic: toxicResult,
        recommendation,
        rejectionReasons,
        thresholds: {
          spamThreshold: SPAM_THRESHOLD,
          toxicThreshold: TOXIC_THRESHOLD,
          overallThreshold: OVERALL_THRESHOLD
        },
        timestamp: new Date().toISOString()
      };

      console.log('✅ [AI CHECK] ===== HOÀN THÀNH KIỂM TRA BÌNH LUẬN =====');
      console.log('📋 [AI CHECK] Kết quả cuối cùng:', {
        isRejected: finalResult.isRejected,
        overallScore: finalResult.overallScore,
        recommendation: finalResult.recommendation,
        rejectionReasons: finalResult.rejectionReasons,
        spam: {
          isSpam: finalResult.spam.isSpam,
          spamScore: finalResult.spam.spamScore
        },
        toxic: {
          isToxic: finalResult.toxic.isToxic,
          toxicityScore: finalResult.toxic.toxicityScore,
          severity: finalResult.toxic.severity
        }
      });
      console.log('🎯 [AI CHECK] Quyết định:', finalResult.isRejected ? '❌ TỪ CHỐI' : '✅ CHẤP NHẬN');
      console.log('');

      return finalResult;
    } catch (error) {
      console.error('❌ [AI CHECK] Lỗi khi check comment:', error.message);
      console.error('❌ [AI CHECK] Stack trace:', error.stack);
      return {
        isRejected: false,
        overallScore: 0,
        spam: { isSpam: false, spamScore: 0, spamReasons: [], suggestion: '' },
        toxic: { isToxic: false, toxicityScore: 0, toxicityTypes: [], severity: 'low', suggestion: '' },
        recommendation: 'approve',
        rejectionReasons: [],
        thresholds: {
          spamThreshold: SPAM_THRESHOLD,
          toxicThreshold: TOXIC_THRESHOLD,
          overallThreshold: OVERALL_THRESHOLD
        },
        timestamp: new Date().toISOString(),
        error: 'Lỗi hệ thống kiểm tra'
      };
    }
  }

  /**
   * Parse response từ Gemini API
   * @param {Object} response - Response từ Gemini
   * @returns {Object} - Kết quả đã parse
   */
  parseGeminiResponse(response) {
    try {
      if (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text
      ) {
        const text = response.data.candidates[0].content.parts[0].text;
        
        // Tìm JSON trong response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('Không thể parse response từ Gemini');
    } catch (error) {
      console.error('Lỗi parse Gemini response:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra bình luận có hợp lệ về độ dài
   * @param {string} comment - Nội dung bình luận
   * @returns {Object} - Kết quả kiểm tra
   */
  validateCommentLength(comment) {
    const minLength = 10;
    const maxLength = 1000;
    
    if (!comment || comment.trim().length < minLength) {
      return {
        isValid: false,
        reason: `Bình luận phải có ít nhất ${minLength} ký tự`
      };
    }
    
    if (comment.length > maxLength) {
      return {
        isValid: false,
        reason: `Bình luận không được vượt quá ${maxLength} ký tự`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Kiểm tra tần suất bình luận của user
   * @param {string} userId - ID người dùng
   * @param {Array} recentComments - Danh sách bình luận gần đây
   * @returns {Object} - Kết quả kiểm tra
   */
  checkCommentFrequency(userId, recentComments) {
    const userComments = recentComments.filter(c => c.ma_nguoi_dung === userId);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentUserComments = userComments.filter(c => 
      new Date(c.ngay_danh_gia) > oneHourAgo
    );
    
    if (recentUserComments.length >= 5) {
      return {
        isExcessive: true,
        reason: 'Bạn đã bình luận quá nhiều trong 1 giờ qua',
        suggestion: 'Vui lòng đợi một lúc trước khi bình luận tiếp'
      };
    }
    
    return { isExcessive: false };
  }
}

module.exports = new AICommentChecker(); 