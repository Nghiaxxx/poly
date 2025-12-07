import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { showWarningAlert, showSuccessAlert } from '@/utils/sweetAlert';
import { getImageUrl } from '@/config/api';
import { getVnColorName } from '@/constants/colorMapShared';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage: string;
  onReviewSubmitted?: () => void;
  existingReview?: {
    rating: number;
    comment: string;
    images?: string[];
  };
  colorName?: string;
  dung_luong?: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  onReviewSubmitted,
  existingReview,
  colorName,
  dung_luong
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const user = useSelector((state: RootState) => state.user?.user);

  // Debug log to check variant info
  console.log('🔍 ReviewModal received variant info:', {
    colorName,
    dung_luong,
    vnColorName: colorName ? getVnColorName(colorName) : null
  });

  // Inject custom scrollbar CSS
  useEffect(() => {
    const styleId = 'review-modal-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .review-modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .review-modal-content::-webkit-scrollbar-track {
          background: #F7FAFC;
          border-radius: 4px;
        }
        .review-modal-content::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 4px;
        }
        .review-modal-content::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup on unmount
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const ratingLabels = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showWarningAlert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để đánh giá sản phẩm!');
      return;
    }

    if (comment.trim().length < 10) {
      showWarningAlert('Bình luận quá ngắn', 'Vui lòng viết bình luận ít nhất 10 ký tự!');
      return;
    }

    try {
      setUploading(true);
      
      // 1. Gửi đánh giá
      const res = await axios.post('/api/reviews', {
        ma_nguoi_dung: user._id,
        ma_san_pham: productId,
        so_sao: rating,
        binh_luan: comment,
        mau: colorName,
        dung_luong: dung_luong
      });

      // 2. Upload ảnh nếu có
      if (images.length > 0 && res.data.reviewId) {
        for (let file of images) {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('ma_danh_gia', res.data.reviewId);
          await axios.post('/api/upload-review-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      // 3. Hiển thị thông báo thành công
      if (res.data.aiCheck) {
        const { aiCheck } = res.data;
        if (aiCheck.isRejected) {
          const reasons = [];
          if (aiCheck.spam?.isSpam) reasons.push('Spam');
          if (aiCheck.toxic?.isToxic) reasons.push('Nội dung độc hại');
          
          showWarningAlert(
            'Bình luận bị từ chối', 
            `Lý do: ${reasons.join(', ')}\n\nGợi ý: ${aiCheck.spam?.suggestion || aiCheck.toxic?.suggestion}`
          );
        } else if (aiCheck.recommendation === 'review') {
          showSuccessAlert('Bình luận cần xem xét', 'Bình luận của bạn đã được gửi và sẽ được admin xem xét.');
        } else {
          showSuccessAlert('Thành công', 'Đánh giá của bạn đã được gửi thành công!');
        }
      } else {
        showSuccessAlert('Thành công', 'Đánh giá của bạn đã được gửi thành công!');
      }

      // 4. Reset form và đóng modal
      setRating(5);
      setComment('');
      setImages([]);
      onReviewSubmitted?.();
      onClose();
      
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error === 'Không thể đánh giá') {
        showWarningAlert(
          'Không thể đánh giá', 
          error.response.data.message || 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng'
        );
      } else if (error.response?.status === 429) {
        showWarningAlert('Quá nhiều bình luận', error.response.data.error);
      } else {
        showWarningAlert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
      }
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-16"
      onClick={onClose}
      style={{ overflow: 'hidden' }}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto review-modal-content"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          e.currentTarget.focus();
          // Force focus to enable scroll
          e.currentTarget.scrollTop = e.currentTarget.scrollTop;
        }}
        onWheel={(e) => {
          e.stopPropagation();
        }}
        onMouseMove={(e) => {
          // Ensure the modal can receive scroll events
          if (!e.currentTarget.matches(':focus-within')) {
            e.currentTarget.focus();
          }
        }}
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          // Custom scrollbar styles for Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 #F7FAFC',
        }}
        tabIndex={-1}
        data-modal-content="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {existingReview ? 'Chỉnh Sửa Đánh Giá' : 'Đánh Giá Sản Phẩm'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <img
              src={getImageUrl(productImage)}
              alt={productName}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h3 className="font-medium text-gray-900">{productName}</h3>
              {(colorName || dung_luong) && (
                <p className="text-sm text-gray-600 mt-1">
                  Phân loại hàng: {[
                    colorName && getVnColorName(colorName),
                    dung_luong
                  ].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chất lượng sản phẩm
            </label>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } cursor-pointer hover:text-yellow-400 transition-colors`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-yellow-500 font-medium">
                {ratingLabels[rating]}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét
            </label>
            <div className="text-sm text-gray-500 mb-2">
              Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé.
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé."
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={4}
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              Tối thiểu 10 ký tự
            </div>
          </div>

          {/* Images */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <input
                id="review-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="review-images"
                className="flex items-center gap-2 border border-gray-500 text-gray-500 px-4 py-2 rounded cursor-pointer hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Thêm Hình ảnh
              </label>
              
              {/* <label className="flex items-center gap-2 border border-gray-500 text-gray-500 px-4 py-2 rounded cursor-pointer hover:bg-gray-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Thêm Video
              </label> */}
            </div>

            {/* Preview Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded font-medium hover:bg-gray-50 transition"
            >
              Trở Lại
            </button>
            <button
              type="submit"
              disabled={uploading || comment.trim().length < 10}
              className={`flex-1 py-3 rounded font-medium transition ${
                uploading || comment.trim().length < 10
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {uploading ? 'Đang gửi...' : (existingReview ? 'Cập Nhật' : 'Hoàn Thành')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal; 