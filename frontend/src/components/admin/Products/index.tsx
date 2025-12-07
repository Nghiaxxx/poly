"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash, FaEyeSlash, FaEye, FaInfoCircle } from "react-icons/fa";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { colorMap, getVnColorName } from '@/constants/colorMapShared';
import { getApiUrl, getBaseUrl } from '@/config/api';

interface Product {
  _id: string;
  TenSP: string;
  id_danhmuc: string;
  khuyen_mai: number;
  hinh: string;
  an_hien: boolean;
  ngay_tao: string;
  categories?: { ten_danh_muc: string }[];
  video?: string[];
  thong_so_ky_thuat?: Record<string, any>;
  ban_chay?: number;
  hot?: boolean;
}

const FILTER_OPTIONS = [
  { value: "top_sold", label: "Bán chạy nhất" },
  { value: "least_sold", label: "Bán ít nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "hot", label: "Sản phẩm hot" },
  { value: "hidden", label: "Đang ẩn" },
];

export default function ProductTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<{
    TenSP: string;
    hinh: string;
    khuyen_mai: number;
    an_hien: boolean;
    id_danhmuc: string;
    video: string[];
    thong_so_ky_thuat: Record<string, any>;
    ban_chay: number;
    ngay_tao: string;
    hot: boolean;
  }>({
    TenSP: "",
    hinh: "",
    khuyen_mai: 0,
    an_hien: true,
    id_danhmuc: "",
    video: [],
    thong_so_ky_thuat: {},
    ban_chay: 0,
    ngay_tao: new Date().toISOString().split('T')[0],
    hot: false
  });
  const [imageError, setImageError] = useState("");
  const [categories, setCategories] = useState<{ _id: string; ten_danh_muc: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specProduct, setSpecProduct] = useState<Product | null>(null);
  const specModalRef = useRef<HTMLDivElement>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoProduct, setVideoProduct] = useState<Product | null>(null);
  const videoModalRef = useRef<HTMLDivElement>(null);
  const [filterOption, setFilterOption] = useState("top_sold");
  const [aiSpecLoading, setAiSpecLoading] = useState(false);
  const aiSpecTimeout = useRef<NodeJS.Timeout | null>(null);
  const [autoGenerateSpecs, setAutoGenerateSpecs] = useState(true);

  const router = useRouter();

  const columns: ColumnDef<Product, any>[] = [
    {
      id: "STT",
      header: () => <span className="text-black font-semibold">STT</span>,
      cell: ({
        row,
        table,
      }: {
        row: import('@tanstack/react-table').Row<Product>;
        table: import('@tanstack/react-table').Table<Product>;
      }) => {
        const pageSize = table.getState().pagination.pageSize;
        const pageIndex = table.getState().pagination.pageIndex;
        return <span className="text-black">{pageSize * pageIndex + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "hinh",
      header: () => <span className="text-black font-semibold">Hình ảnh</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <img
          src={getImageUrl(row.getValue("hinh"))}
          alt={row.getValue("TenSP")}
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
      accessorKey: "TenSP",
      header: () => <span className="text-black font-semibold">Tên sản phẩm</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <div className="max-w-[80px] truncate text-black">{row.getValue("TenSP")}</div>
      ),
    },
    {
      accessorKey: "categories",
      header: () => <span className="text-black font-semibold">Danh mục</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <span className="text-black">{row.original.categories?.[0]?.ten_danh_muc || "Chưa phân loại"}</span>
      )
    },
    {
      accessorKey: "khuyen_mai",
      header: () => <span className="text-black font-semibold">Khuyến mãi</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <span className="text-black">{`${row.getValue("khuyen_mai")}%`}</span>
      )
    },
    {
      accessorKey: "ban_chay",
      header: () => <span className="text-black font-semibold">Lượt bán</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <span className="text-black">{`${row.getValue("ban_chay")}`}</span>
      )
    },
    {
      accessorKey: "an_hien",
      header: () => <span className="text-black font-semibold">Trạng thái</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
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
      accessorKey: "ngay_tao",
      header: () => <span className="text-black font-semibold">Ngày tạo</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <span className="text-black">{new Date(row.getValue("ngay_tao")).toLocaleDateString("vi-VN")}</span>
      )
    },
    {
      header: () => <span className="text-black font-semibold">Video</span>,
      id: "video",
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <button
          className="text-blue-600 hover:text-blue-800"
          title="Xem video sản phẩm"
          onClick={e => {
            e.stopPropagation();
            setVideoProduct(row.original);
            setShowVideoModal(true);
          }}
        >
          <FaInfoCircle size={20} />
        </button>
      ),
    },
    {
      header: () => <span className="text-black font-semibold">Thông số</span>,
      id: "specs",
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <button
          className="text-blue-600 hover:text-blue-800"
          title="Xem thông số kỹ thuật"
          onClick={e => {
            e.stopPropagation();
            setSpecProduct(row.original);
            setShowSpecModal(true);
          }}
        >
          <FaInfoCircle size={20} />
        </button>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-black font-semibold">Thao tác</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Product> }) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditProduct(row.original);
              setNewProduct({
                TenSP: row.original.TenSP,
                hinh: row.original.hinh || "",
                khuyen_mai: row.original.khuyen_mai || 0,
                an_hien: row.original.an_hien ?? true,
                id_danhmuc: row.original.id_danhmuc || "",
                video: row.original.video || [],
                thong_so_ky_thuat: row.original.thong_so_ky_thuat || {},
                ban_chay: row.original.ban_chay || 0, // Giữ nguyên giá trị hiện tại
                ngay_tao: row.original.ngay_tao || new Date().toISOString().split('T')[0],
                hot: row.original.hot ?? false
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
        </div>
      )
    },
  ];

  // hàm fuzzy filter
  const fuzzyFilter = (row: any, columnId: string, value: string) => {
    const searchValue = value.toLowerCase();
    let cellValue = row.getValue(columnId);

    // Xử lý các trường hợp đặc biệt
    if (columnId === "categories") {
      cellValue = row.original.categories?.[0]?.ten_danh_muc || "";
    } else if (typeof cellValue === "boolean") {
      cellValue = cellValue ? "hiện" : "ẩn";
    } else if (columnId === "ngay_tao") {
      cellValue = new Date(cellValue).toLocaleDateString("vi-VN");
    }

    return String(cellValue)
      .toLowerCase()
      .includes(searchValue);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(getApiUrl('products'));
        const data = await res.json();
        setProducts(data);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Fetch categories
    fetch(getApiUrl('categories?an_hien=true'))
      .then(res => res.json())
      .then(data => setCategories(data))
                .catch(error => {});
  }, []);

  // Lọc sản phẩm theo danh mục bằng useMemo để tránh filter lại mỗi lần render
  const filteredProducts = useMemo(() => {
    let arr = [...products];
    // Lọc theo danh mục nếu có
    if (selectedCategory) {
      arr = arr.filter(p => String(p.id_danhmuc) === String(selectedCategory));
    }
    // Lọc theo tiêu chí dropdown
    switch (filterOption) {
      case "top_sold":
        arr = arr.sort((a, b) => (b.ban_chay || 0) - (a.ban_chay || 0));
        break;
      case "least_sold":
        arr = arr.sort((a, b) => (a.ban_chay || 0) - (b.ban_chay || 0));
        break;
      case "newest":
        arr = arr.sort((a, b) => new Date(b.ngay_tao).getTime() - new Date(a.ngay_tao).getTime());
        break;
      case "oldest":
        arr = arr.sort((a, b) => new Date(a.ngay_tao).getTime() - new Date(b.ngay_tao).getTime());
        break;
      case "hot":
        arr = arr.filter(p => p.hot);
        break;
      case "hidden":
        arr = arr.filter(p => p.an_hien === false);
        break;
      default:
        break;
    }
    return arr;
  }, [products, selectedCategory, filterOption]);

  const table = useReactTable({
    data: filteredProducts,
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
    formData.append('image', file);
    try {
      const res = await fetch(getApiUrl('products/upload-image'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setNewProduct(prev => ({ ...prev, hinh: data.url }));
      }
    } catch (error) {
      toast.error('Lỗi khi upload ảnh');
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch(getApiUrl('products/upload-video'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) uploadedUrls.push(data.url);
    }
    setNewProduct(prev => ({
      ...prev,
      video: [...(prev.video || []), ...uploadedUrls]
    }));
  };

  const handleSaveProduct = async () => {
    if (!newProduct.TenSP || !newProduct.id_danhmuc) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      // Chuẩn bị dữ liệu trước khi gửi (KHÔNG bao gồm ban_chay)
      const productData = {
        TenSP: newProduct.TenSP,
        hinh: newProduct.hinh,
        khuyen_mai: Number(newProduct.khuyen_mai) || 0,
        an_hien: Boolean(newProduct.an_hien),
        id_danhmuc: newProduct.id_danhmuc,
        video: Array.isArray(newProduct.video) ? newProduct.video : [],
        thong_so_ky_thuat: normalizeSpecs(newProduct.thong_so_ky_thuat || {}),
        hot: Boolean(newProduct.hot),
        ngay_tao: newProduct.ngay_tao
        // KHÔNG gửi ban_chay - field này sẽ được bảo vệ bởi backend
      };

      console.log('🛡️  Gửi dữ liệu sản phẩm (không bao gồm ban_chay):', productData);

      const res = await fetch(
        editProduct 
          ? getApiUrl(`products/${editProduct._id}`)
          : getApiUrl('products'),
        {
          method: editProduct ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData)
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      console.log('✅ Phản hồi từ server:', data);
      
      if (editProduct) {
        setProducts(prev => prev.map(p => p._id === data._id ? data : p));
        toast.success('Đã cập nhật sản phẩm thành công!');
      } else {
        setProducts(prev => [data, ...prev]);
        toast.success('Đã thêm sản phẩm thành công!');
      }

      setShowModal(false);
      setNewProduct({
        TenSP: "",
        hinh: "",
        khuyen_mai: 0,
        an_hien: true,
        id_danhmuc: "",
        video: [],
        thong_so_ky_thuat: {},
        ban_chay: 0,
        ngay_tao: new Date().toISOString().split('T')[0],
        hot: false
      });
      setEditProduct(null);

    } catch (error) {
      console.error('❌ Lỗi khi lưu sản phẩm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(`Có lỗi xảy ra: ${errorMessage}`);
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      const res = await fetch(getApiUrl(`products/${product._id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ an_hien: !product.an_hien })
      });
      const data = await res.json();
      setProducts(prev => prev.map(p => p._id === data._id ? data : p));
      toast.success(`Đã ${data.an_hien ? 'hiện' : 'ẩn'} sản phẩm!`);
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  // Thêm hàm resetForm vào trong component
  const resetForm = () => {
    setNewProduct({
      TenSP: "",
      hinh: "",
      khuyen_mai: 0,
      an_hien: true,
      id_danhmuc: "",
      video: [],
      thong_so_ky_thuat: {},
      ban_chay: 0,
      ngay_tao: new Date().toISOString().split('T')[0],
      hot: false
    });
    setEditProduct(null);
    setImageError("");
  };

  // Thêm hàm normalizeSpecs để chuẩn hóa specs từ AI
  const normalizeSpecs = (specs: Record<string, any>) => {
    const result = { ...specs };
    
    // Danh sách các trường cần xử lý đặc biệt
    const arrayFields = ['Camera', 'Ket_noi', 'Kich_thuoc_khoi_luong', 'Tien_ich_khac', 'Tinh_nang_camera'];
    
    arrayFields.forEach(key => {
      if (result[key]) {
        try {
          if (Array.isArray(result[key])) {
            // Đã là array, chỉ cần làm sạch
            result[key] = result[key].filter(item => item && item.toString().trim() !== '');
          } else if (typeof result[key] === 'object') {
            // Object, chuyển thành array
            result[key] = Object.values(result[key]).filter(item => item && item.toString().trim() !== '');
          } else if (typeof result[key] === 'string') {
            // String, split theo dấu phẩy
            result[key] = result[key]
              .split(',')
              .map((s: string) => s.trim())
              .filter(item => item !== '');
          }
        } catch (error) {
  
          result[key] = [];
        }
      } else {
        // Nếu không có giá trị, set thành array rỗng
        result[key] = [];
      }
    });
    
    // Làm sạch các trường string khác
    Object.keys(result).forEach(key => {
      if (!arrayFields.includes(key) && typeof result[key] === 'string') {
        result[key] = result[key].trim();
      }
    });
    
    return result;
  };

  // Hàm gọi AI sinh thông số kỹ thuật
  const fetchAISpecs = useCallback(async (productName: string) => {
    if (!productName) return;
    setAiSpecLoading(true);
    try {
      
      const res = await fetch(getApiUrl('generate-product-specs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productName })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      
      // Kiểm tra và xử lý dữ liệu an toàn
      if (data && data.success && data.specs && typeof data.specs === 'object') {

        
        // Lọc và làm sạch dữ liệu trước khi set
        const cleanedSpecs = Object.entries(data.specs).reduce((acc, [key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        setNewProduct(prev => ({
          ...prev,
          thong_so_ky_thuat: normalizeSpecs({ ...prev.thong_so_ky_thuat, ...cleanedSpecs })
        }));
        toast.success('Đã tự động điền thông số kỹ thuật!');
      } else {

        toast.error('Không thể tạo thông số kỹ thuật tự động');
      }
    } catch (err) {
      
      toast.error('Không thể tạo thông số kỹ thuật tự động');
    } finally {
      setAiSpecLoading(false);
    }
  }, []);

  // Tự động sinh thông số kỹ thuật khi nhập tên sản phẩm
  useEffect(() => {
    if (!autoGenerateSpecs) return;
    
    if (aiSpecTimeout.current) {
      clearTimeout(aiSpecTimeout.current);
    }

    if (newProduct.TenSP && newProduct.TenSP.length > 3) {
      // Kiểm tra xem đã có thông số kỹ thuật chưa
      const hasExistingSpecs = newProduct.thong_so_ky_thuat && 
        Object.keys(newProduct.thong_so_ky_thuat).length > 0 &&
        Object.values(newProduct.thong_so_ky_thuat).some(value => 
          value && (typeof value === 'string' ? value.trim() !== '' : true)
        );
      
      // Chỉ tạo AI nếu chưa có thông số kỹ thuật
      if (!hasExistingSpecs) {

        aiSpecTimeout.current = setTimeout(() => {
          
          fetchAISpecs(newProduct.TenSP);
        }, 2000); // Đợi 2 giây sau khi người dùng ngừng gõ
      } else {

      }
    }

    return () => {
      if (aiSpecTimeout.current) {
        clearTimeout(aiSpecTimeout.current);
      }
    };
  }, [newProduct.TenSP, newProduct.thong_so_ky_thuat, fetchAISpecs, autoGenerateSpecs]);

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
          Quản lý sản phẩm
        </h2>
        <div className="flex gap-4">
          <select
            className="border rounded px-3 py-2"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.ten_danh_muc}</option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={filterOption}
            onChange={e => setFilterOption(e.target.value)}
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-64"
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => {
              setEditProduct(null);
              setNewProduct({
                TenSP: "",
                hinh: "",
                khuyen_mai: 0,
                an_hien: true,
                id_danhmuc: "",
                video: [],
                thong_so_ky_thuat: {},
                ban_chay: 0,
                ngay_tao: new Date().toISOString().split('T')[0],
                hot: false
              });
              setShowModal(true);
            }}
          >
            Thêm sản phẩm
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
                  onClick={e => {
                    // Không trigger khi click vào nút thao tác
                    if ((e.target as HTMLElement).closest("button")) return;
                    router.push(`/admin/variant/${row.original._id}`);
                  }}
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
                  Không tìm thấy sản phẩm
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

      {/* Modal thêm/sửa sản phẩm */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Ảnh & Video sản phẩm</h2>
              <p className="text-gray-600 text-sm mt-1">Upload hình ảnh và video cho sản phẩm</p>
            </div>

            {/* Form content */}
            <div className="space-y-6">
              {/* Basic product info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Thông tin sản phẩm</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nhập tên sản phẩm..."
                      value={newProduct.TenSP}
                      onChange={e => setNewProduct({...newProduct, TenSP: e.target.value})}
                    />
                    {aiSpecLoading && (
                      <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Đang tạo thông số...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={newProduct.id_danhmuc}
                      onChange={e => setNewProduct({...newProduct, id_danhmuc: e.target.value})}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.ten_danh_muc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Khuyến mãi (%)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0"
                      value={newProduct.khuyen_mai === 0 ? '' : newProduct.khuyen_mai.toString()}
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setNewProduct({...newProduct, khuyen_mai: value === '' ? 0 : Number(value)});
                        }
                      }}
                      onFocus={e => {
                        if (newProduct.khuyen_mai === 0) {
                          e.target.select();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lượt bán</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="0"
                      value={newProduct.ban_chay === 0 ? '0' : newProduct.ban_chay.toString()}
                      disabled={true}
                      readOnly={true}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tạo</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={newProduct.ngay_tao}
                      onChange={e => setNewProduct({...newProduct, ngay_tao: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="an_hien"
                      checked={newProduct.an_hien}
                      onChange={e => setNewProduct({...newProduct, an_hien: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="an_hien" className="text-sm font-medium text-gray-700">Hiện sản phẩm</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hot"
                      checked={newProduct.hot}
                      onChange={e => setNewProduct({...newProduct, hot: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="hot" className="text-sm font-medium text-gray-700">Sản phẩm hot</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto_specs"
                      checked={autoGenerateSpecs}
                      onChange={e => setAutoGenerateSpecs(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="auto_specs" className="text-sm font-medium text-gray-700">Tự động sinh</label>
                  </div>
                </div>
              </div>

              {/* Thông số kỹ thuật */}
              <div className="space-y-4">
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPU</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                      placeholder="Apple A16 Bionic" 
                      value={newProduct.thong_so_ky_thuat.CPU || ''} 
                      onChange={e => setNewProduct(prev => ({...prev, thong_so_ky_thuat: {...prev.thong_so_ky_thuat, CPU: e.target.value}}))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GPU</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                      placeholder="Apple GPU 5-core" 
                      value={newProduct.thong_so_ky_thuat.GPU || ''} 
                      onChange={e => setNewProduct(prev => ({...prev, thong_so_ky_thuat: {...prev.thong_so_ky_thuat, GPU: e.target.value}}))} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Camera</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                    placeholder="48MP, 12MP, 12MP (cách nhau dấu phẩy)" 
                    value={Array.isArray(newProduct.thong_so_ky_thuat.Camera) ? newProduct.thong_so_ky_thuat.Camera.join(', ') : (newProduct.thong_so_ky_thuat.Camera || '')} 
                    onChange={e => {
                      const value = e.target.value;
                      const cameraArray = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
                      setNewProduct(prev => ({
                        ...prev, 
                        thong_so_ky_thuat: {
                          ...prev.thong_so_ky_thuat, 
                          Camera: cameraArray
                        }
                      }));
                    }} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Công nghệ màn hình</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                      placeholder="OLED" 
                      value={newProduct.thong_so_ky_thuat.Cong_nghe_man_hinh || ''} 
                      onChange={e => setNewProduct(prev => ({...prev, thong_so_ky_thuat: {...prev.thong_so_ky_thuat, Cong_nghe_man_hinh: e.target.value}}))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hệ điều hành</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                      placeholder="iOS 17" 
                      value={newProduct.thong_so_ky_thuat.He_dieu_hanh || ''} 
                      onChange={e => setNewProduct(prev => ({...prev, thong_so_ky_thuat: {...prev.thong_so_ky_thuat, He_dieu_hanh: e.target.value}}))} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ phân giải</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                      placeholder="2556 x 1179" 
                      value={newProduct.thong_so_ky_thuat.Do_phan_giai || ''} 
                      onChange={e => setNewProduct(prev => ({...prev, thong_so_ky_thuat: {...prev.thong_so_ky_thuat, Do_phan_giai: e.target.value}}))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kích thước màn hình</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                      placeholder="6.7 inch" 
                      value={newProduct.thong_so_ky_thuat.Kich_thuoc_man_hinh || ''} 
                      onChange={e => setNewProduct(prev => ({...prev, thong_so_ky_thuat: {...prev.thong_so_ky_thuat, Kich_thuoc_man_hinh: e.target.value}}))} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kết nối</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                    placeholder="WiFi 6, Bluetooth 5.3, 5G (cách nhau dấu phẩy)" 
                    value={Array.isArray(newProduct.thong_so_ky_thuat.Ket_noi) ? newProduct.thong_so_ky_thuat.Ket_noi.join(', ') : (newProduct.thong_so_ky_thuat.Ket_noi || '')} 
                    onChange={e => {
                      const value = e.target.value;
                      const ketNoiArray = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
                      setNewProduct(prev => ({
                        ...prev, 
                        thong_so_ky_thuat: {
                          ...prev.thong_so_ky_thuat, 
                          Ket_noi: ketNoiArray
                        }
                      }));
                    }} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kích thước & Khối lượng</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                    placeholder="159.9 x 76.7 x 7.85 mm, 206g (cách nhau dấu phẩy)" 
                    value={Array.isArray(newProduct.thong_so_ky_thuat.Kich_thuoc_khoi_luong) ? newProduct.thong_so_ky_thuat.Kich_thuoc_khoi_luong.join(', ') : (newProduct.thong_so_ky_thuat.Kich_thuoc_khoi_luong || '')} 
                    onChange={e => {
                      const value = e.target.value;
                      const kichThuocArray = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
                      setNewProduct(prev => ({
                        ...prev, 
                        thong_so_ky_thuat: {
                          ...prev.thong_so_ky_thuat, 
                          Kich_thuoc_khoi_luong: kichThuocArray
                        }
                      }));
                    }} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiện ích khác</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                    placeholder="Face ID, MagSafe, IP68 (cách nhau dấu phẩy)" 
                    value={Array.isArray(newProduct.thong_so_ky_thuat.Tien_ich_khac) ? newProduct.thong_so_ky_thuat.Tien_ich_khac.join(', ') : (newProduct.thong_so_ky_thuat.Tien_ich_khac || '')} 
                    onChange={e => {
                      const value = e.target.value;
                      const tienIchArray = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
                      setNewProduct(prev => ({
                        ...prev, 
                        thong_so_ky_thuat: {
                          ...prev.thong_so_ky_thuat, 
                          Tien_ich_khac: tienIchArray
                        }
                      }));
                    }} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tính năng camera</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" 
                    placeholder="Cinematic mode, ProRAW, Night mode (cách nhau dấu phẩy)" 
                    value={Array.isArray(newProduct.thong_so_ky_thuat.Tinh_nang_camera) ? newProduct.thong_so_ky_thuat.Tinh_nang_camera.join(', ') : (newProduct.thong_so_ky_thuat.Tinh_nang_camera || '')} 
                    onChange={e => {
                      const value = e.target.value;
                      const tinhNangArray = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
                      setNewProduct(prev => ({
                        ...prev, 
                        thong_so_ky_thuat: {
                          ...prev.thong_so_ky_thuat, 
                          Tinh_nang_camera: tinhNangArray
                        }
                      }));
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Nút đóng */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10" 
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            {/* Action buttons */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                onClick={handleSaveProduct}
              >
                {editProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem thông số kỹ thuật */}
      {showSpecModal && specProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowSpecModal(false)}>
          <div
            ref={specModalRef}
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-blue-700">Thông số kỹ thuật</h3>
            {specProduct.thong_so_ky_thuat && Object.keys(specProduct.thong_so_ky_thuat).length > 0 ? (
              <ul className="text-sm text-gray-700 space-y-2 max-h-72 overflow-y-auto">
                {Object.entries(specProduct.thong_so_ky_thuat).map(([key, value]) => (
                  value && value !== '' && (
                    <li key={key} className="flex gap-2">
                      <span className="font-semibold min-w-[110px]">{key}:</span>
                      <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                    </li>
                  )
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">Không có thông số kỹ thuật</div>
            )}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowSpecModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal xem video sản phẩm */}
      {showVideoModal && videoProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowVideoModal(false)}>
          <div
            ref={videoModalRef}
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-blue-700">Video sản phẩm</h3>
            {videoProduct.video && videoProduct.video.length > 0 && videoProduct.video[0] ? (
              <video
                width={320}
                height={180}
                controls
                autoPlay
                style={{ borderRadius: 8 }}
              >
                <source src={`${getBaseUrl()}/video/${videoProduct.video[0]}`} type="video/mp4" />
                Trình duyệt không hỗ trợ video.
              </video>
            ) : (
              <div className="text-gray-500 italic">Không có video</div>
            )}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowVideoModal(false)}
            >
              Đóng
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
  return `${getBaseUrl()}/images/${imageUrl.replace(/^\/images\//, '')}`;
};