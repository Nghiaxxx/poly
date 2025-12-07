"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import Breadcrumb from '@/components/admin/Breadcrumbs/Breadcrumb';
import { getApiUrl, getBaseUrl } from '@/config/api';
import type { ColumnDef } from "@tanstack/react-table";
import { 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel, 
  useReactTable, 
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState
} from "@tanstack/react-table";
import { FaEye, FaEyeSlash, FaTrash, FaReply, FaCheck, FaTimes, FaExclamationTriangle, FaSync } from "react-icons/fa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmAlert } from '@/utils/sweetAlert';

interface Review {
  _id: string;
  ma_nguoi_dung: { TenKH: string; email: string } | string;
  ma_san_pham: { TenSP: string } | string;
  so_sao: number;
  binh_luan: string;
  ngay_danh_gia: string;
  images?: { duong_dan_anh: string }[];
  an_hien: boolean;
  phan_hoi?: string;
  
  // AI Moderation fields
  moderation_status?: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_note?: string;
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

// Component riêng cho Reply Input để tránh re-render issues
const ReplyInputComponent = React.memo(({ 
  reviewId, 
  existingReply,
  onReply 
}: {
  reviewId: string;
  existingReply?: string;
  onReply: (id: string, reply: string) => void;
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback(() => {
    if (inputValue.trim()) {
      onReply(reviewId, inputValue.trim());
      setInputValue('');
    }
  }, [reviewId, inputValue, onReply]);

  return (
    <div className="flex flex-col gap-2">
      {existingReply && (
        <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <strong>Phản hồi:</strong> {existingReply}
        </div>
      )}
      
      <div className="relative">
        <input
          className="border border-stroke rounded-lg px-3 py-2 pr-20 text-sm focus:outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input w-full"
          placeholder="Nhập phản hồi..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
        
        <Button 
          size="sm" 
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className="absolute right-1 top-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs h-8"
        >
          <FaReply className="w-3 h-3 mr-1" />
          Gửi
        </Button>
      </div>
    </div>
  );
});

ReplyInputComponent.displayName = 'ReplyInputComponent';

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest_rating", label: "Đánh giá cao nhất" },
  { value: "lowest_rating", label: "Đánh giá thấp nhất" },
  { value: "hidden", label: "Đã ẩn" },
  { value: "visible", label: "Đang hiển thị" },
  { value: "ai_checked", label: "AI đã kiểm duyệt" },
  { value: "ai_rejected", label: "AI từ chối" },
  { value: "pending_ai", label: "Chờ AI kiểm duyệt" }
];

const ReviewAdminPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('reviews/all'));
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      setReviews(arr);
    } catch (err) {
      setError("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  // Lọc reviews theo các tiêu chí
  const filteredReviews = useMemo(() => {
    let arr = [...reviews];
    
    // Lọc theo tiêu chí dropdown
    switch (filterOption) {
      case "newest":
        arr = arr.sort((a, b) => new Date(b.ngay_danh_gia).getTime() - new Date(a.ngay_danh_gia).getTime());
        break;
      case "oldest":
        arr = arr.sort((a, b) => new Date(a.ngay_danh_gia).getTime() - new Date(b.ngay_danh_gia).getTime());
        break;
      case "highest_rating":
        arr = arr.sort((a, b) => b.so_sao - a.so_sao);
        break;
      case "lowest_rating":
        arr = arr.sort((a, b) => a.so_sao - b.so_sao);
        break;
      case "hidden":
        arr = arr.filter(r => r.an_hien === false);
        break;
      case "visible":
        arr = arr.filter(r => r.an_hien === true);
        break;
      case "ai_checked":
        arr = arr.filter(r => r.ai_check?.is_checked && !r.ai_check.is_rejected);
        break;
      case "ai_rejected":
        arr = arr.filter(r => r.ai_check?.is_checked && r.ai_check.is_rejected);
        break;
      case "pending_ai":
        arr = arr.filter(r => !r.ai_check?.is_checked);
        break;
      default:
        break;
    }
    
    return arr;
  }, [reviews, filterOption]);

  const handleToggleHide = useCallback(async (id: string) => {
    try {
      await fetch(getApiUrl(`reviews/${id}/toggle-hide`), { method: 'PATCH' });
      fetchReviews();
    } catch (err) {
      showErrorAlert('Lỗi', 'Lỗi khi cập nhật trạng thái ẩn/hiện!');
    }
  }, []);

  const handleReply = useCallback(async (id: string, reply: string) => {
    try {
      await fetch(getApiUrl(`reviews/${id}/reply`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phan_hoi: reply })
      });
      fetchReviews();
    } catch (err) {
      showErrorAlert('Lỗi', 'Lỗi khi gửi phản hồi!');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const result = await showConfirmAlert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa đánh giá này?', 'Xóa', 'Hủy');
    if (result.isConfirmed) {
      try {
        const res = await fetch(getApiUrl(`reviews/${id}`), { 
          method: 'DELETE' 
        });
        if (res.ok) {
          showSuccessAlert('Thành công', 'Đã xóa đánh giá thành công!');
          fetchReviews();
        } else {
          showErrorAlert('Lỗi', 'Lỗi khi xóa đánh giá!');
        }
      } catch (err) {
        showErrorAlert('Lỗi', 'Lỗi khi xóa đánh giá!');
      }
    }
  }, []);

  const handleModerateReview = async (reviewId: string, action: string, note?: string) => {
    try {
      const apiUrl = getApiUrl(`reviews/${reviewId}/moderate`);
      const requestBody = {
        action,
        note: note || `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} bởi admin`,
        moderatorId: 'admin'
      };
      
      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (res.ok) {
        showSuccessAlert('Thành công', `Review đã được ${action === 'approve' ? 'duyệt' : action === 'reject' ? 'từ chối' : 'đánh dấu'}`);
        fetchReviews();
      } else {
        const errorData = await res.text();
        showErrorAlert('Lỗi', `Lỗi khi thực hiện hành động: ${res.status} - ${errorData}`);
      }
    } catch (error) {
      showErrorAlert('Lỗi', 'Không thể thực hiện hành động');
    }
  };

  const handleRecheckAI = async (reviewId: string) => {
    try {
      const res = await fetch(getApiUrl(`reviews/${reviewId}/recheck-ai`), {
        method: 'POST'
      });
      
      if (res.ok) {
        showSuccessAlert('Thành công', 'Đã chạy lại AI check');
        fetchReviews();
      } else {
        showErrorAlert('Lỗi', 'Lỗi khi chạy lại AI check');
      }
    } catch (error) {
      showErrorAlert('Lỗi', 'Không thể chạy lại AI check');
    }
  };

  const renderStars = (rating: number) => {
    return "⭐".repeat(rating);
  };

  // Định nghĩa columns cho data table
  const columns: ColumnDef<Review>[] = useMemo(() => [
    {
      id: "STT",
      header: () => <span className="text-black dark:text-white font-semibold">STT</span>,
      cell: ({ row, table }) => {
        const pageSize = table.getState().pagination.pageSize;
        const pageIndex = table.getState().pagination.pageIndex;
        return <span className="text-black dark:text-white">{pageSize * pageIndex + row.index + 1}</span>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "ma_san_pham",
      header: () => <span className="text-black dark:text-white font-semibold">Sản phẩm</span>,
      cell: ({ row }) => {
        const product = row.getValue("ma_san_pham");
        return (
          <div className="font-medium text-black dark:text-white">
            {typeof product === "object" && product && 'TenSP' in product ? (product as any).TenSP : product}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "ma_nguoi_dung",
      header: () => <span className="text-black dark:text-white font-semibold">Người dùng</span>,
      cell: ({ row }) => {
        const user = row.getValue("ma_nguoi_dung");
        return (
          <div className="text-black dark:text-white">
            {(() => {
              if (typeof user === "object" && user && 'TenKH' in user) {
                return (user as any).TenKH || (user as any).email || 'N/A';
              }
              return user || 'N/A';
            })()}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "so_sao",
      header: () => <span className="text-black dark:text-white font-semibold">Số sao</span>,
      cell: ({ row }) => (
        <div className="text-yellow-500 font-semibold">
          {renderStars(row.getValue("so_sao"))}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "binh_luan",
      header: () => <span className="text-black dark:text-white font-semibold">Bình luận</span>,
      cell: ({ row }) => (
        <div className="max-w-xs text-black dark:text-white break-words">
          {row.getValue("binh_luan")}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "ai_moderation",
      header: () => <span className="text-black dark:text-white font-semibold">AI Kiểm duyệt</span>,
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="space-y-2">
            {review.ai_check?.is_checked && (
              <div className="text-xs space-y-1">
                {!review.ai_check.is_rejected && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs border border-green-200">
                    <FaCheck className="w-3 h-3 text-green-600" />
                    <span className="font-medium">AI đã kiểm duyệt</span>
                  </div>
                )}
                
                {review.ai_check.is_rejected && (
                  <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs border border-red-200">
                    <FaTimes className="w-3 h-3 text-red-600" />
                    <span className="font-medium">AI đã từ chối</span>
                  </div>
                )}
                
                {review.ai_check.rejection_reasons && review.ai_check.rejection_reasons.length > 0 && (
                  <div className="text-xs text-red-600">
                    Lý do từ chối: {review.ai_check.rejection_reasons.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            <Button 
              size="sm" 
              onClick={() => handleRecheckAI(review._id)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs"
            >
              <FaSync className="w-3 h-3 mr-1" />
              Recheck AI
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "ngay_danh_gia",
      header: () => <span className="text-black dark:text-white font-semibold">Ngày đánh giá</span>,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.getValue("ngay_danh_gia")).toLocaleString("vi-VN")}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "images",
      header: () => <span className="text-black dark:text-white font-semibold">Ảnh</span>,
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div>
            {review.images && review.images.length > 0 ? (
              <div className="flex gap-1">
                {review.images.map((img, imgIdx) => (
                  <img 
                    key={imgIdx} 
                    src={`${getBaseUrl()}${img.duong_dan_anh}`} 
                    alt="Ảnh review" 
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:scale-110 transition-transform cursor-pointer" 
                  />
                ))}
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <span className="text-black dark:text-white font-semibold">Hành động</span>,
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex flex-col gap-2">
            <ReplyInputComponent
              reviewId={review._id}
              existingReply={review.phan_hoi}
              onReply={handleReply}
            />
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={review.an_hien ? 'destructive' : 'default'} 
                size="sm" 
                onClick={() => handleToggleHide(review._id)}
                className="px-3 py-1 text-xs"
              >
                {review.an_hien ? <FaEyeSlash className="w-3 h-3 mr-1" /> : <FaEye className="w-3 h-3 mr-1" />}
                {review.an_hien ? 'Ẩn' : 'Hiện'}
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(review._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
              >
                <FaTrash className="w-3 h-3 mr-1" />
                Xóa
              </Button>
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [handleToggleHide, handleReply, handleDelete]);

  const table = useReactTable({
    data: filteredReviews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <>
      <Breadcrumb pageName="Quản lý đánh giá sản phẩm & AI Kiểm duyệt" />
      
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        {/* Header với tìm kiếm và lọc */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                className="w-full sm:w-80"
                placeholder="Tìm kiếm theo sản phẩm, user, bình luận..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
              
              <select
                className="border border-stroke rounded-lg px-4 py-2 focus:outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                value={filterOption}
                onChange={e => setFilterOption(e.target.value)}
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            onClick={fetchReviews}
            className="bg-primary hover:bg-opacity-90 text-white px-6 py-2 rounded-lg"
          >
            <FaSync className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-lg text-gray-600">Đang tải...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
        ) : (
          <div className="space-y-4">
            {/* Data Table */}
            <div className="rounded-md border">
              <Table className="w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-50 dark:bg-meta-4">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="font-semibold text-black dark:text-white">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-b border-gray-200 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Không có đánh giá nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} trong{" "}
                {table.getFilteredRowModel().rows.length} hàng được chọn.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Sau
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Hàng mỗi trang</p>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="border border-stroke rounded-lg px-2 py-1 focus:outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                >
                  {[5, 10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewAdminPage;