"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash, FaEyeSlash, FaEye, FaInfoCircle } from "react-icons/fa";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { getApiUrl, getBaseUrl } from '@/config/api';

interface News {
  _id: string;
  tieu_de: string;
  slug: string;
  mo_ta: string;
  hinh: string;
  ngay: string;
  noi_dung: string;
  luot_xem: number;
  hot: boolean;
  an_hien: boolean;
  nguoi_dang?: { _id: string; TenKH: string };
  id_danh_muc?: { _id: string; ten_danh_muc: string };
}

export default function NewsTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNews, setEditNews] = useState<News | null>(null);
  const [newNews, setNewNews] = useState<{
    tieu_de: string;
    slug: string;
    mo_ta: string;
    hinh: string;
    ngay: string;
    noi_dung: string;
    luot_xem: number;
    hot: boolean;
    an_hien: boolean;
    nguoi_dang: string;
    id_danh_muc: string;
  }>({
    tieu_de: "",
    slug: "",
    mo_ta: "",
    hinh: "",
    ngay: new Date().toISOString().split('T')[0],
    noi_dung: "",
    luot_xem: 0,
    hot: false,
    an_hien: true,
    nguoi_dang: "",
    id_danh_muc: ""
  });
  const [imageError, setImageError] = useState("");
  const [newsCategories, setNewsCategories] = useState<{ _id: string; ten_danh_muc: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentNews, setContentNews] = useState<News | null>(null);
  const contentModalRef = useRef<HTMLDivElement>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ ten_danh_muc: "" });
  const [editCategory, setEditCategory] = useState<{ _id: string; ten_danh_muc: string } | null>(null);
  const [admins, setAdmins] = useState<{ _id: string; TenKH: string }[]>([]);

  const router = useRouter();

  const columns: ColumnDef<News, any>[] = [
    {
      id: "STT",
      header: () => <span className="text-black font-semibold">STT</span>,
      cell: ({
        row,
        table,
      }: {
        row: import('@tanstack/react-table').Row<News>;
        table: import('@tanstack/react-table').Table<News>;
      }) => {
        const pageSize = table.getState().pagination.pageSize;
        const pageIndex = table.getState().pagination.pageIndex;
        return <span className="text-black">{pageSize * pageIndex + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "hinh",
      header: () => <span className="text-black font-semibold">Hình ảnh</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <img
          src={getImageUrl(row.getValue("hinh"))}
          alt={row.getValue("tieu_de")}
          width={48}
          height={48}
          className="h-12 w-12 object-cover rounded-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/no-image.svg';
          }}
        />
      ),
    },
    {
      accessorKey: "tieu_de",
      header: () => <span className="text-black font-semibold">Tiêu đề</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <div className="max-w-[200px] truncate text-black">{row.getValue("tieu_de")}</div>
      ),
    },
    {
      accessorKey: "id_danh_muc",
      header: () => <span className="text-black font-semibold">Danh mục</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <span className="text-black">{row.original.id_danh_muc?.ten_danh_muc || "Chưa phân loại"}</span>
      )
    },
    {
      accessorKey: "luot_xem",
      header: () => <span className="text-black font-semibold">Lượt xem</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <span className="text-black">{row.getValue("luot_xem")}</span>
      )
    },
    {
      accessorKey: "hot",
      header: () => <span className="text-black font-semibold">Hot</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium inline-block text-black font-semibold
            ${row.getValue("hot") 
              ? "bg-orange-100 text-orange-800" 
              : "bg-gray-100 text-gray-800"}`}
        >
          {row.getValue("hot") ? "Hot" : "Bình thường"}
        </div>
      ),
    },
    {
      accessorKey: "an_hien",
      header: () => <span className="text-black font-semibold">Trạng thái</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium inline-block text-black font-semibold
            ${row.getValue("an_hien") 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"}`}
        >
          {row.getValue("an_hien") ? "Hiện" : "Ẩn"}
        </div>
      ),
    },
    {
      accessorKey: "ngay",
      header: () => <span className="text-black font-semibold">Ngày đăng</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <span className="text-black">{new Date(row.getValue("ngay")).toLocaleDateString("vi-VN")}</span>
      )
    },
    {
      header: () => <span className="text-black font-semibold">Nội dung</span>,
      id: "content",
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <button
          className="text-blue-600 hover:text-blue-800"
          title="Xem nội dung tin tức"
          onClick={e => {
            e.stopPropagation();
            setContentNews(row.original);
            setShowContentModal(true);
          }}
        >
          <FaInfoCircle size={20} />
        </button>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-black font-semibold">Thao tác</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<News> }) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditNews(row.original);
              setNewNews({
                tieu_de: row.original.tieu_de,
                slug: row.original.slug,
                mo_ta: row.original.mo_ta,
                hinh: row.original.hinh || "",
                ngay: row.original.ngay ? new Date(row.original.ngay).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                noi_dung: row.original.noi_dung,
                luot_xem: row.original.luot_xem || 0,
                hot: row.original.hot ?? false,
                an_hien: row.original.an_hien ?? true,
                nguoi_dang: row.original.nguoi_dang?._id || "",
                id_danh_muc: row.original.id_danh_muc?._id || ""
              });
              setShowModal(true);
            }}
            className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleToggleVisibility(row.original)}
            className={`p-2 ${
              row.original.an_hien 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-red-500 hover:bg-red-600"
            } text-white rounded-full`}
          >
            {row.original.an_hien ? <FaEye /> : <FaEyeSlash />}
          </button>
          <button
            onClick={() => handleDeleteNews(row.original)}
            className="p-2 bg-red-400 hover:bg-red-500 text-white rounded-full"
          >
            <FaTrash />
          </button>
        </div>
      )
    },
  ];

  // hàm fuzzy filter
  const fuzzyFilter = (row: any, columnId: string, value: string) => {
    const searchValue = value.toLowerCase();
    let cellValue = row.getValue(columnId);

    // Xử lý các trường hợp đặc biệt
    if (columnId === "id_danh_muc") {
      cellValue = row.original.id_danh_muc?.ten_danh_muc || "";
    } else if (typeof cellValue === "boolean") {
      cellValue = cellValue ? "hiện" : "ẩn";
    } else if (columnId === "ngay") {
      cellValue = new Date(cellValue).toLocaleDateString("vi-VN");
    }

    return String(cellValue)
      .toLowerCase()
      .includes(searchValue);
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(getApiUrl('news'));
        const data = await res.json();
        setNews(data);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    // Fetch news categories
    fetch(getApiUrl('newscategory'))
      .then(res => res.json())
      .then(data => setNewsCategories(data))
                .catch(error => {});
  }, []);

  useEffect(() => {
    if (showModal) {
      fetch(getApiUrl('users'))
        .then(res => res.json())
        .then(data => {
          setAdmins(data.filter((u: any) => u.role === "admin"));
        });
    }
  }, [showModal]);

  // Lọc tin tức theo danh mục bằng useMemo để tránh filter lại mỗi lần render
  const filteredNews = useMemo(() => {
    let sorted = [...news].sort((a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime());
    if (!selectedCategory) return sorted;
    return sorted.filter(n => String(n.id_danh_muc?._id) === String(selectedCategory));
  }, [news, selectedCategory]);

  const table = useReactTable({
    data: filteredNews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(), 
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter, 
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  // Thêm các hàm xử lý
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('hinh', file);
    try {
      const res = await fetch(getApiUrl('news/upload'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.path) {
        setNewNews(prev => ({ ...prev, hinh: data.path }));
      }
    } catch (error) {
      toast.error('Lỗi khi upload ảnh');
    }
  };

  const handleSaveNews = async () => {
    if (!newNews.tieu_de || !newNews.mo_ta || !newNews.noi_dung || !newNews.id_danh_muc) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn danh mục!');
      return;
    }

    // Tạo slug từ tiêu đề
    const slug = newNews.tieu_de
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const newsData = {
      ...newNews,
      slug,
      ngay: new Date(newNews.ngay).toISOString()
    };

    if (!newsData.nguoi_dang || newsData.nguoi_dang === "") {
      delete (newsData as any).nguoi_dang;
    }

    try {
      const res = await fetch(
        editNews 
          ? getApiUrl(`news/${editNews._id}`)
: getApiUrl('news'),
        {
          method: editNews ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newsData)
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || 'Có lỗi xảy ra!');
        return;
      }

      const data = await res.json();
      
      if (editNews) {
        setNews(prev => prev.map(n => n._id === data._id ? data : n));
        toast.success('Đã cập nhật tin tức thành công!');
      } else {
        setNews(prev => [data, ...prev]);
        toast.success('Đã thêm tin tức thành công!');
      }

      setShowModal(false);
      resetForm();

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Có lỗi xảy ra!');
      }
    }
  };

  const handleToggleVisibility = async (newsItem: News) => {
    try {
      const res = await fetch(getApiUrl(`news/${newsItem._id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ an_hien: !newsItem.an_hien })
      });
      const data = await res.json();
      // Gọi lại API để lấy danh sách mới nhất (đảm bảo đồng bộ)
              const resAll = await fetch(getApiUrl('news'));
      const allNews = await resAll.json();
      setNews(allNews);
      toast.success(`Đã ${data.an_hien ? 'hiện' : 'ẩn'} tin tức!`);
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleDeleteNews = async (newsItem: News) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin tức này?')) return;
    
    try {
      const res = await fetch(getApiUrl(`news/${newsItem._id}`), {
        method: "DELETE"
      });
      
      if (!res.ok) throw new Error('Có lỗi xảy ra');
      
      setNews(prev => prev.filter(n => n._id !== newsItem._id));
      toast.success('Đã xóa tin tức thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.ten_danh_muc.trim()) {
      toast.error('Vui lòng nhập tên danh mục!');
      return;
    }

    try {
      const res = await fetch(
        editCategory 
          ? getApiUrl(`newscategory/${editCategory._id}`)
          : getApiUrl('newscategory'),
        {
          method: editCategory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCategory)
        }
      );

      if (!res.ok) throw new Error('Có lỗi xảy ra');

      const data = await res.json();
      
      if (editCategory) {
        setNewsCategories(prev => prev.map(cat => cat._id === data._id ? data : cat));
        toast.success('Đã cập nhật danh mục thành công!');
      } else {
        setNewsCategories(prev => [data, ...prev]);
        toast.success('Đã thêm danh mục thành công!');
      }

      setShowCategoryModal(false);
      setNewCategory({ ten_danh_muc: "" });
      setEditCategory(null);

    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      const res = await fetch(getApiUrl(`newscategory/${categoryId}`), {
        method: "DELETE"
      });
      
      if (!res.ok) throw new Error('Có lỗi xảy ra');
      
      setNewsCategories(prev => prev.filter(cat => cat._id !== categoryId));
      toast.success('Đã xóa danh mục thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  // Thêm hàm resetForm vào trong component
  const resetForm = () => {
    setNewNews({
      tieu_de: "",
      slug: "",
      mo_ta: "",
      hinh: "",
      ngay: new Date().toISOString().split('T')[0],
      noi_dung: "",
      luot_xem: 0,
      hot: false,
      an_hien: true,
      nguoi_dang: "",
      id_danh_muc: ""
    });
    setEditNews(null);
    setImageError("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-lg text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Quản lý tin tức
        </h2>
        <div className="flex gap-4">
          <select
            className="border rounded px-3 py-2"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {newsCategories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.ten_danh_muc}</option>
            ))}
          </select>
          <Input
            placeholder="Tìm kiếm tin tức..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-64"
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => {
              setEditNews(null);
              resetForm();
              setShowModal(true);
            }}
          >
            Thêm tin tức
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => {
              setEditCategory(null);
              setNewCategory({ ten_danh_muc: "" });
              setShowCategoryModal(true);
            }}
          >
            Quản lý danh mục
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-blue-50 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không tìm thấy tin tức
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Trang {table.getState().pagination.pageIndex + 1} /
            {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Hiển thị {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal thêm/sửa tin tức */}
      {showModal && (
        <div className="fixed z-50 flex items-center justify-center backdrop-blur-sm top-5 left-30 right-0 bottom-0 w-full h-full">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-row gap-8 overflow-y-auto max-h-[80vh] max-w-[1200px] w-full">
            {/* Cột trái: Thông tin tin tức */}
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2 text-blue-700">{editNews ? "Sửa tin tức" : "Thêm tin tức mới"}</h2>
              <input
                className="border rounded px-3 py-2"
                placeholder="Tiêu đề tin tức"
                value={newNews.tieu_de}
                onChange={e => setNewNews({...newNews, tieu_de: e.target.value})}
              />
              <select
                className="border rounded px-3 py-2"
                value={newNews.id_danh_muc}
                onChange={e => setNewNews({...newNews, id_danh_muc: e.target.value})}
              >
                <option value="">-- Chọn danh mục --</option>
                {newsCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.ten_danh_muc}</option>
                ))}
              </select>
              <input
                type="date"
                className="border rounded px-3 py-2"
                placeholder="Ngày đăng"
                value={newNews.ngay}
                onChange={e => setNewNews({...newNews, ngay: e.target.value})}
              />
              <textarea
                className="border rounded px-3 py-2 h-20"
                placeholder="Mô tả ngắn"
                value={newNews.mo_ta}
                onChange={e => setNewNews({...newNews, mo_ta: e.target.value})}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newNews.an_hien}
                  onChange={e => setNewNews({...newNews, an_hien: e.target.checked})}
                />
                <span>Hiện tin tức</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newNews.hot}
                  onChange={e => setNewNews({...newNews, hot: e.target.checked})}
                />
                <span>Tin hot</span>
              </div>
              <select
                className="border rounded px-3 py-2"
                value={newNews.nguoi_dang}
                onChange={e => setNewNews({ ...newNews, nguoi_dang: e.target.value })}
              >
                <option value="">-- Chọn người đăng (admin) --</option>
                {admins.map(admin => (
                  <option key={admin._id} value={admin._id}>{admin.TenKH}</option>
                ))}
              </select>
            </div>
            {/* Cột phải: Ảnh & Nội dung */}
            <div className="flex-1 flex flex-col gap-4 border-l pl-8">
              <h3 className="font-semibold mb-2">Ảnh & Nội dung tin tức</h3>
              {/* Ảnh tin tức */}
              <input
                type="file"
                accept="image/*"
                className="border rounded px-3 py-2 text-black"
                onChange={handleImageChange}
              />
              {newNews.hinh && (
                <div className="relative w-24 h-24 mt-2">
                  <img
                    src={getImageUrl(newNews.hinh)}
                    alt="Ảnh tin tức"
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/no-image.svg';
                    }}
                    style={{ objectFit: 'cover', borderRadius: '0.375rem' }}
                  />
                </div>
              )}
              {imageError && (
                <div className="text-red-600 text-sm mt-1">{imageError}</div>
              )}
              {/* Nội dung tin tức */}
              <textarea
                className="border rounded px-3 py-2 h-40"
                placeholder="Nội dung chi tiết tin tức..."
                value={newNews.noi_dung}
                onChange={e => setNewNews({...newNews, noi_dung: e.target.value})}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded h-[40px]"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded h-[40px]"
                onClick={handleSaveNews}
              >
                Lưu
              </button>
            </div>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowModal(false)}>&times;</button>
          </div>
        </div>
      )}

      {/* Modal xem nội dung tin tức */}
      {showContentModal && contentNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowContentModal(false)}>
          <div
            ref={contentModalRef}
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-blue-700">Nội dung tin tức</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">Tiêu đề:</h4>
                <p className="text-gray-600">{contentNews.tieu_de}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Mô tả:</h4>
                <p className="text-gray-600">{contentNews.mo_ta}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Nội dung:</h4>
                <div className="text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {contentNews.noi_dung}
                </div>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowContentModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal quản lý danh mục tin tức */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
            <h3 className="text-lg font-bold mb-4 text-blue-700">
              {editCategory ? "Sửa danh mục" : "Quản lý danh mục tin tức"}
            </h3>
            
            {/* Form thêm/sửa danh mục */}
            <div className="flex gap-2 mb-6">
              <input
                className="border rounded px-3 py-2 flex-1"
                placeholder="Tên danh mục"
                value={newCategory.ten_danh_muc}
                onChange={e => setNewCategory({ ten_danh_muc: e.target.value })}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleSaveCategory}
              >
                {editCategory ? "Cập nhật" : "Thêm"}
              </button>
              {editCategory && (
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                  onClick={() => {
                    setEditCategory(null);
                    setNewCategory({ ten_danh_muc: "" });
                  }}
                >
                  Hủy
                </button>
              )}
            </div>

            {/* Danh sách danh mục */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Danh sách danh mục:</h4>
              {newsCategories.map(category => (
                <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{category.ten_danh_muc}</span>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded text-sm"
                      onClick={() => {
                        setEditCategory(category);
                        setNewCategory({ ten_danh_muc: category.ten_danh_muc });
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      className="px-3 py-1 bg-red-400 hover:bg-red-500 text-white rounded text-sm"
                      onClick={() => handleDeleteCategory(category._id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowCategoryModal(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}

const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/images/no-image.svg';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${getBaseUrl()}${imageUrl}`;
};