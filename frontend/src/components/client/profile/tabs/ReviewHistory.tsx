import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { fetchApi, getImageUrl } from '@/config/api';

// Review interface
interface ReviewHistoryItem {
  _id: string;
  ma_san_pham: {
    _id: string;
    TenSP: string;
    hinh?: string;
  };
  so_sao: number;
  binh_luan: string;
  ngay_danh_gia: string;
  images?: { duong_dan_anh: string; ghi_chu?: string }[];
  ai_check?: {
    is_checked: boolean;
    is_rejected: boolean;
  };
}

export default function ReviewHistory() {
  const user = useSelector((state: RootState) => state.user.user);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [loadingReviewHistory, setLoadingReviewHistory] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Lấy lịch sử đánh giá khi component mount
  useEffect(() => {
    if (user?._id) {
      setLoadingReviewHistory(true);
      setReviewError("");
      fetchApi(`/reviews/by-user?ma_nguoi_dung=${user._id}`)
        .then((data) => {
          setReviewHistory(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          setReviewError(err.message || "Không thể tải lịch sử đánh giá");
        })
        .finally(() => setLoadingReviewHistory(false));
    }
  }, [user?._id, user?.email]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Lịch sử đánh giá sản phẩm</h2>
      {loadingReviewHistory ? (
        <div>Đang tải lịch sử đánh giá...</div>
      ) : reviewError ? (
        <div className="text-red-500">{reviewError}</div>
      ) : reviewHistory.length === 0 ? (
        <div className="text-gray-500">
          Bạn chưa có đánh giá sản phẩm nào.
        </div>
      ) : (
        <div className="space-y-6">
          {reviewHistory.map((r) => (
            <div key={r._id} className="border-b pb-4 flex gap-4">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
                {r.ma_san_pham?.hinh ? (
                  <img
                    src={getImageUrl(r.ma_san_pham.hinh)}
                    alt={r.ma_san_pham.TenSP}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg
                    className="w-10 h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {r.ma_san_pham?.TenSP || "Sản phẩm đã xóa"}
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.so_sao ? "text-yellow-400" : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Dấu tích xanh "AI đã kiểm duyệt" */}
                  {r.ai_check?.is_checked && !r.ai_check?.is_rejected && (
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs border border-green-200">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">AI đã kiểm duyệt</span>
                    </div>
                  )}
                  
                  <span className="text-xs text-gray-500">
                    {new Date(r.ngay_danh_gia).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="mb-2 text-gray-800">{r.binh_luan}</div>
                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {r.images.map((img, i) => (
                      <img
                        key={i}
                        src={getImageUrl(img.duong_dan_anh)}
                        alt={img.ghi_chu || "review"}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 