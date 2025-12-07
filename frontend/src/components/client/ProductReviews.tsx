import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { showWarningAlert, showSuccessAlert, showErrorAlert } from '@/utils/sweetAlert';
import { getBaseUrl } from "@/config/api";
import { getVnColorName } from '@/constants/colorMapShared';


//bình luận đánh giá sp
interface ImageReview {
  duong_dan_anh: string;
  ghi_chu?: string;
}

interface Review {
  _id: string;
  ma_nguoi_dung: {
    _id: string;
    TenKH?: string;
    email: string;
    avatar?: string;
  };
  ma_san_pham: string;
  so_sao: number;
  binh_luan: string;
  ngay_danh_gia: string;
  images?: ImageReview[];
  phan_hoi?: string;
  
  // Thông tin biến thể nếu có
  ma_bien_the?: string;
  dung_luong?: string;
  mau?: string;
  
  ai_check?: {
    is_checked: boolean;
    is_rejected: boolean;
    overall_score: number;
    spam: {
      is_spam: boolean;
      spam_score: number;
      spam_reasons: string[];
      suggestion?: string;
    };
    toxic: {
      is_toxic: boolean;
      toxicity_score: number;
      toxicity_types: string[];
      severity: 'low' | 'medium' | 'high';
      suggestion?: string;
    };
    recommendation: 'approve' | 'reject' | 'review';
    rejection_reasons?: string[];
    thresholds?: {
      spam_threshold: number;
      toxic_threshold: number;
      overall_threshold: number;
    };
  };
}

interface ProductReviewsProps {
  ma_san_pham: string;
  ma_nguoi_dung: string;
  // Thông tin biến thể được chọn từ trang sản phẩm (nếu có)
  selectedVariant?: { _id?: string; dung_luong?: string; mau?: string };
}

// Hàm chuẩn hóa đường dẫn ảnh review
    const API_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || getBaseUrl();
const getImageUrl = (url: string) => {
  // Nếu là URL đầy đủ, thay thế /api/images/ thành /images/
  if (url.startsWith('http')) {
    return url.replace('/api/images/', '/images/');
  }
  // Nếu bắt đầu bằng /api/images/, thay thành /images/
  if (url.startsWith('/api/images/')) {
    return `${API_BASE_URL}/images/${url.split('/api/images/')[1]}`;
  }
  // Nếu bắt đầu bằng /images/, thêm domain
  if (url.startsWith('/images/')) {
    return `${API_BASE_URL}${url}`;
  }
  // Trường hợp còn lại
  return `${API_BASE_URL}/images/reviews/${url}`;
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ ma_san_pham, ma_nguoi_dung, selectedVariant }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [soSao, setSoSao] = useState<number>(5);
  const [binhLuan, setBinhLuan] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [product, setProduct] = useState(null);
  const [replyInputs, setReplyInputs] = useState<{ [id: string]: string }>({});

  const user = useSelector((state: RootState) => state.user?.user);
  const userId = user?._id;

  // Debug: Log selectedVariant prop
  useEffect(() => {
    console.log('ProductReviews - selectedVariant:', selectedVariant);
  }, [selectedVariant]);

  // Component hiển thị dấu tích xanh "AI đã kiểm duyệt"
  const AICheckedBadge = ({ aiCheck }: { aiCheck: any }) => {
    if (!aiCheck?.is_checked || aiCheck?.is_rejected) return null;
    
    return (
      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs border border-green-200">
        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 00-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">AI đã kiểm duyệt</span>
      </div>
    );
  };



  // Lấy danh sách đánh giá
  useEffect(() => {
    if (!ma_san_pham) return;
    setLoading(true);
    axios.get(`/api/reviews?ma_san_pham=${ma_san_pham}`)
      .then(res => {
        console.log('ProductReviews - Reviews data:', res.data);
        setReviews(res.data);
      })
      .finally(() => setLoading(false));
  }, [ma_san_pham, refresh]);

  // Upload ảnh (chỉ lưu file vào state, không upload ngay)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  // Gửi đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showWarningAlert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để đánh giá sản phẩm!');
      return;
    }

    try {
      setUploading(true);
      
      // 1. Gửi đánh giá với AI check
      const reviewData = {
        ma_nguoi_dung: user._id,
        ma_san_pham,
        so_sao: soSao,
        binh_luan: binhLuan,
        // Truyền thông tin biến thể nếu có
        ma_bien_the: selectedVariant?._id,
        dung_luong: selectedVariant?.dung_luong,
        mau: selectedVariant?.mau,
      };
      
      console.log('ProductReviews - Submitting review with data:', reviewData);
      
      const res = await axios.post('/api/reviews', reviewData);

      // Kiểm tra kết quả AI
      if (res.data.aiCheck) {
        const { aiCheck, message } = res.data;
        
        if (aiCheck.isRejected) {
          // Hiển thị lý do bị từ chối
          const reasons = [];
          if (aiCheck.spam.isSpam) reasons.push('Spam');
          if (aiCheck.toxic.isToxic) reasons.push('Nội dung độc hại');
          
          showWarningAlert(
            'Bình luận bị từ chối', 
            `Lý do: ${reasons.join(', ')}\n\nGợi ý: ${aiCheck.spam.suggestion || aiCheck.toxic.suggestion}`
          );
          return;
        } else if (aiCheck.recommendation === 'review') {
          showWarningAlert(
            'Bình luận cần xem xét', 
            'Bình luận của bạn đã được gửi và sẽ được admin xem xét trong thời gian sớm nhất.'
          );
        } else {
          showWarningAlert('Thành công', 'Bình luận của bạn đã được gửi thành công!');
        }
      }

      const reviewId = res.data.reviewId;
      
      // 2. Nếu có ảnh, upload từng ảnh với ma_danh_gia
      if (images.length > 0) {
        for (let file of images) {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('ma_danh_gia', reviewId);
          await axios.post('/api/upload-review-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      
      // 3. Reset form và refresh
      setSoSao(5);
      setBinhLuan('');
      setImages([]);
      setRefresh(r => r + 1);
      
    } catch (error: any) {
      
      
      if (error.response?.data?.error === 'Bình luận bị từ chối bởi AI') {
        const details = error.response.data.details;
        const reasons = [];
        if (details.spam?.isSpam) reasons.push('Spam');
        if (details.toxic?.isToxic) reasons.push('Nội dung độc hại');
        
        // Sử dụng rejectionReasons nếu có
        if (details.rejectionReasons && details.rejectionReasons.length > 0) {
          reasons.push(...details.rejectionReasons);
        }
        
        showWarningAlert(
          'Bình luận bị từ chối', 
          `Lý do: ${reasons.join(', ')}\n\nGợi ý: ${details.spam?.suggestion || details.toxic?.suggestion}`
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

  const handleReply = async (parentId: string) => {
    if (!user) {
      showWarningAlert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để phản hồi!');
      return;
    }
    const reply = replyInputs[parentId];
    if (!reply) return;
    await axios.post('/api/reviews', {
      ma_nguoi_dung: user._id,
      ma_san_pham,
      so_sao: 5,
      binh_luan: reply,
      parent_id: parentId
    });
    setReplyInputs(inputs => ({ ...inputs, [parentId]: '' }));
    setRefresh(r => r + 1);
  };

  // Tính toán tổng điểm và bộ lọc
  const total = reviews.length;
  const avgRating = total ? (reviews.reduce((sum, r) => sum + r.so_sao, 0) / total).toFixed(1) : 0;
  const countByStar = [5, 4, 3, 2, 1].map(star => reviews.filter(r => r.so_sao === star).length);
  const [filter, setFilter] = useState<'all' | number>('all');
  const [showImageOnly, setShowImageOnly] = useState(false);
  let filtered = reviews;
  if (filter !== 'all') filtered = filtered.filter(r => r.so_sao === filter);
  if (showImageOnly) filtered = filtered.filter(r => r.images && r.images.length > 0);

  return (
    <div className="bg-white p-4 sm:p-8">
      {/* Thống kê và bộ lọc */}
      <div className="mb-6">
        <div className="text-xl font-bold mb-2 text-black">ĐÁNH GIÁ SẢN PHẨM</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-start sm:items-center sm:mr-8">
            <span className="text-3xl sm:text-4xl font-bold text-red-500">{avgRating} <span className="text-base sm:text-lg text-gray-500 font-normal">trên 5</span></span>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mb-2">
              <button className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border ${filter==='all'?'bg-red-500 text-white':'bg-white text-gray-700'}`} onClick={()=>setFilter('all')}>Tất Cả</button>
              {[5,4,3,2,1].map((star,i)=>(
                <button key={star} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border ${filter===star?'bg-red-500 text-white':'bg-white text-gray-700'}`} onClick={()=>setFilter(star)}>{star} Sao ({countByStar[i]})</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border ${!showImageOnly?'bg-gray-200':''} text-gray-700`} onClick={()=>setShowImageOnly(false)}>Có Bình Luận ({reviews.length})</button>
              <button className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border ${showImageOnly?'bg-gray-200':''} text-gray-700`} onClick={()=>setShowImageOnly(true)}>Có Hình Ảnh / Video ({reviews.filter(r=>r.images && r.images.length>0).length})</button>
            </div>
          </div>
        </div>
      </div>
      {/* Danh sách đánh giá */}
      <div className="flex flex-col gap-8">
        {loading && <div>Đang tải đánh giá...</div>}
        {!loading && filtered.length === 0 && <div className="text-gray-500 text-center">Chưa có đánh giá nào</div>}
        {filtered.map(r => (
          <div key={r._id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-b pb-6">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {r.ma_nguoi_dung && r.ma_nguoi_dung.avatar ? (
                <img src={getImageUrl(r.ma_nguoi_dung.avatar)} alt={r.ma_nguoi_dung.TenKH || r.ma_nguoi_dung.email || 'avatar'} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2.5a5.5 5.5 0 00-3.096 10.047 9.005 9.005 0 00-5.9 8.18.75.75 0 001.5.045 7.5 7.5 0 0114.993 0 .75.75 0 001.499-.044 9.005 9.005 0 00-5.9-8.181A5.5 5.5 0 0012 2.5zM8 8a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                <span className="font-medium text-gray-900">{r.ma_nguoi_dung?.TenKH || r.ma_nguoi_dung?.email || 'Ẩn danh'}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < r.so_sao ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                    </svg>
                  ))}
                </div>
                
                {/* Sử dụng component AICheckedBadge */}
                <AICheckedBadge aiCheck={r.ai_check} />
                
                <span className="text-xs sm:text-sm text-gray-500">{new Date(r.ngay_danh_gia).toLocaleDateString('vi-VN', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
              
              {/* Hiển thị phân loại trên dòng riêng */}
              {(r.dung_luong || r.mau) && (
                <div className="text-sm text-gray-600 mb-2">
                  Phân loại hàng: {[
                    r.mau && getVnColorName(r.mau),
                    r.dung_luong
                  ].filter(Boolean).join(',')}
                </div>
              )}
              <p className="text-gray-800 mb-3 text-[14px] sm:text-[15px]">{r.binh_luan}</p>
              {r.images && r.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
                  {r.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={getImageUrl(img.duong_dan_anh)}
                        alt={img.ghi_chu || 'review'}
                        className="w-16 h-16 sm:w-[70px] sm:h-[70px] object-contain bg-white border rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* PHẢN HỒI QTV */}
              {r.phan_hoi && (
                <div className="flex gap-3 mt-4 ml-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-500">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">Quản Trị Viên</span>
                      <span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">QTV</span>
                    </div>
                    <div className="bg-gray-100 rounded px-3 py-2 mt-1 text-gray-800">{r.phan_hoi}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
