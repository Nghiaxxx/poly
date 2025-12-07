"use client";

import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { FaFileExcel, FaFileCsv, FaDownload, FaEye, FaCheck, FaTruck, FaTimes } from "react-icons/fa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { getApiUrl } from '@/config/api';

interface Order {
  _id: string;
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    email?: string;
  };
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface OrderDetail extends Order {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
    colorName?: string;
  }>;
  updatedAt: string;
  transferContent?: string;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branch?: string;
  };
}

const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "confirming", label: "Chờ xác nhận" },
  { value: "packing", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao" },
  { value: "delivered", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả thanh toán" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "failed", label: "Thanh toán thất bại" },
];

const FILTER_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest_amount", label: "Giá trị cao nhất" },
  { value: "lowest_amount", label: "Giá trị thấp nhất" },
];

const Orders = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [filterOption, setFilterOption] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const router = useRouter();

  const columns: ColumnDef<Order, any>[] = [
    {
      id: "STT",
      header: () => <span className="text-black font-semibold">STT</span>,
      cell: ({
        row,
        table,
      }: {
        row: import('@tanstack/react-table').Row<Order>;
        table: import('@tanstack/react-table').Table<Order>;
      }) => {
        const pageSize = table.getState().pagination.pageSize;
        const pageIndex = table.getState().pagination.pageIndex;
        return <span className="text-black">{pageSize * pageIndex + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "_id",
      header: () => <span className="text-black font-semibold">Mã đơn</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => (
        <div className="max-w-[120px] truncate text-black font-mono text-sm">{row.getValue("_id")}</div>
      ),
    },
    {
      accessorKey: "customerInfo",
      header: () => <span className="text-black font-semibold">Khách hàng</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => (
        <div className="text-black">
          <div className="font-medium">{row.original.customerInfo.fullName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.original.customerInfo.phone || 'N/A'}</div>
        </div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: () => <span className="text-black font-semibold">Tổng tiền</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => (
        <span className="text-black font-semibold text-green-600">
          {(row.getValue("totalAmount") as number).toLocaleString()}₫
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: () => <span className="text-black font-semibold">PT Thanh toán</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => {
        const paymentMethod = row.getValue("paymentMethod") as string;
        return (
          <span className="text-black">
            {paymentMethod ? paymentMethod.toUpperCase() : 'N/A'}
          </span>
        );
      },
    },
    // {
    //   accessorKey: "paymentStatus",
    //   header: () => <span className="text-black font-semibold">TT Thanh toán</span>,
    //   cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => {
    //     const status = row.getValue("paymentStatus");
    //     return (
    //       <div
    //         className={`px-3 py-1 rounded-full text-xs font-medium inline-block text-black font-semibold
    //           ${status === 'paid' 
    //             ? "bg-green-100 text-green-800" 
    //             : status === 'pending'
    //             ? "bg-yellow-100 text-yellow-800"
    //             : "bg-red-100 text-red-800"}`}
    //       >
    //         {status === 'paid' ? 'Đã thanh toán' : status === 'pending' ? 'Chờ thanh toán' : 'Thất bại'}
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "orderStatus",
      header: () => <span className="text-black font-semibold">Trạng thái đơn</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => {
        const status = row.getValue("orderStatus");
        const statusConfig = {
          confirming: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Chờ xác nhận" },
          packing: { bg: "bg-blue-100", text: "text-blue-800", label: "Đã xác nhận" },
          shipping: { bg: "bg-purple-100", text: "text-purple-800", label: "Đang giao" },
          delivered: { bg: "bg-green-100", text: "text-green-800", label: "Hoàn thành" },
          cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Đã hủy" },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirming;
        return (
          <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block text-black font-semibold ${config.bg} ${config.text}`}>
            {config.label}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <span className="text-black font-semibold">Ngày tạo</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => (
        <span className="text-black text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    // {
    //   id: "actions",
    //   header: () => <span className="text-black font-semibold">Thao tác</span>,
    //   cell: ({ row }: { row: import('@tanstack/react-table').Row<Order> }) => (
    //     <div className="flex gap-2">
    //       <button
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           handleRowClick(row.original._id);
    //         }}
    //         className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full"
    //         title="Xem chi tiết"
    //       >
    //         <FaEye />
    //       </button>
    //       {/* {row.original.paymentStatus !== 'paid' && (
    //         <button
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             handleConfirmPayment(row.original);
    //           }}
    //           className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
    //           title="Xác nhận thanh toán"
    //         >
    //           <FaCheck />
    //         </button>
    //       )}
    //       {row.original.orderStatus === 'packing' && (
    //         <button
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             handleShippingOrder(row.original);
    //           }}
    //           className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full"
    //           title="Chuyển sang đang giao"
    //         >
    //           <FaTruck />
    //         </button>
    //       )}
    //       {['confirming', 'packing', 'shipping'].includes(row.original.orderStatus) && (
    //         <button
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             handleCancelOrder(row.original);
    //           }}
    //           className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
    //           title="Hủy đơn"
    //         >
    //           <FaTimes />
    //         </button>
    //       )} */}
    //     </div>
    //   ),
    // },
  ];

  // Hàm fuzzy filter
  const fuzzyFilter = (row: any, columnId: string, value: string) => {
    const searchValue = value.toLowerCase();
    let cellValue = row.getValue(columnId);

    // Xử lý các trường hợp đặc biệt
    if (columnId === "customerInfo") {
      cellValue = `${row.original.customerInfo.fullName || ''} ${row.original.customerInfo.phone || ''}`;
    } else if (columnId === "createdAt") {
      cellValue = new Date(cellValue).toLocaleDateString("vi-VN");
    } else if (columnId === "totalAmount") {
      cellValue = cellValue.toLocaleString() + '₫';
    }

    return String(cellValue)
      .toLowerCase()
      .includes(searchValue);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl('orders'));
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleRowClick = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(getApiUrl(`orders/${orderId}`));
      const data = await res.json();
      setSelectedOrder(data);
      setShowModal(true);
    } catch (err) {
      setSelectedOrder(null);
      toast.error('Không thể tải chi tiết đơn hàng');
    }
    setDetailLoading(false);
  };

  const handleConfirmPayment = async (order: Order) => {
    setActionLoading(true);
    try {
      await fetch(getApiUrl(`orders/${order._id}/payment`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' })
      });
      
      // Reload danh sách
      const res = await fetch(getApiUrl('orders'));
      const data = await res.json();
      setOrders(data.orders || []);
      toast.success('Đã xác nhận thanh toán!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xác nhận thanh toán!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShippingOrder = async (order: Order) => {
    setActionLoading(true);
    try {
      await fetch(getApiUrl(`orders/${order._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: 'shipping' })
      });
      
      const res = await fetch(getApiUrl('orders'));
      const data = await res.json();
      setOrders(data.orders || []);
      toast.success('Đã chuyển sang trạng thái đang giao!');
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliveredOrder = async (order: Order) => {
    setActionLoading(true);
    try {
      await fetch(getApiUrl(`orders/${order._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: 'delivered' })
      });
      
      const res = await fetch(getApiUrl('orders'));
      const data = await res.json();
      setOrders(data.orders || []);
      toast.success('Đã hoàn thành đơn hàng!');
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    
    setActionLoading(true);
    try {
      await fetch(getApiUrl(`orders/${order._id}/cancel`), {
        method: 'PUT'
      });
      
      const res = await fetch(getApiUrl('orders'));
      const data = await res.json();
      setOrders(data.orders || []);
      toast.success('Đã hủy đơn hàng!');
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setActionLoading(false);
    }
  };

  // Lọc đơn hàng theo các tiêu chí
  const filteredOrders = useMemo(() => {
    let arr = [...orders];
    
    // Lọc theo trạng thái đơn hàng
    if (orderStatusFilter !== "all") {
      arr = arr.filter(order => order.orderStatus === orderStatusFilter);
    }
    
    // Lọc theo trạng thái thanh toán
    if (paymentStatusFilter !== "all") {
      arr = arr.filter(order => order.paymentStatus === paymentStatusFilter);
    }
    
    // Lọc theo ngày
    if (dateFrom) {
      arr = arr.filter(order => new Date(order.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      arr = arr.filter(order => new Date(order.createdAt) <= new Date(dateTo));
    }
    
    // Sắp xếp theo tiêu chí
    switch (filterOption) {
      case "newest":
        arr = arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        arr = arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "highest_amount":
        arr = arr.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "lowest_amount":
        arr = arr.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      default:
        break;
    }
    
    return arr;
  }, [orders, orderStatusFilter, paymentStatusFilter, dateFrom, dateTo, filterOption]);

  const table = useReactTable({
    data: filteredOrders,
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

  // Xuất Excel
  const handleExportExcel = () => {
    const excelData = filteredOrders.map(order => ({
      'Mã đơn': order._id,
      'Khách hàng': order.customerInfo.fullName || 'N/A',
      'SĐT': order.customerInfo.phone || 'N/A',
      'Email': order.customerInfo.email || 'N/A',
      'Địa chỉ': `${order.customerInfo.address || ''}, ${order.customerInfo.city || ''}`,
      'Tổng tiền (VNĐ)': order.totalAmount,
      'Phương thức thanh toán': order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A',
      'Trạng thái thanh toán': order.paymentStatus,
      'Trạng thái đơn': order.orderStatus,
      'Ngày tạo': new Date(order.createdAt).toLocaleString('vi-VN'),
    }));

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = Object.keys(excelData[0] || {});
    
    headers.forEach((header: string) => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.border = '1px solid #ddd';
      th.style.padding = '8px';
      th.style.backgroundColor = '#f2f2f2';
      th.style.fontWeight = 'bold';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    excelData.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach(header => {
        const td = document.createElement('td');
        td.textContent = String(row[header as keyof typeof row] || '');
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Danh sách đơn hàng</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Danh sách đơn hàng</h1>
            <p>Xuất ngày: ${new Date().toLocaleString('vi-VN')}</p>
            <p>Tổng số đơn hàng: ${filteredOrders.length}</p>
          </div>
          ${table.outerHTML}
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file Excel thành công!');
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
          Quản lý đơn hàng
        </h2>
        <div className="flex gap-4">
          <select
            className="border rounded px-3 py-2"
            value={orderStatusFilter}
            onChange={e => setOrderStatusFilter(e.target.value)}
          >
            {ORDER_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={paymentStatusFilter}
            onChange={e => setPaymentStatusFilter(e.target.value)}
          >
            {PAYMENT_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
            placeholder="Tìm kiếm mã đơn, tên khách..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-64"
          />
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={handleExportExcel}
          >
            <FaFileExcel className="mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày:</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày:</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
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
                  onClick={() => router.push(`/admin/order/orders/${row.original._id}`)}
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
                  Không tìm thấy đơn hàng
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

      {/* Modal chi tiết đơn hàng */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[85vh] overflow-y-auto">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h2>
              <p className="text-gray-600 text-sm mt-1">Thông tin chi tiết và quản lý đơn hàng</p>
            </div>

            {detailLoading ? (
              <div className="flex justify-center items-center h-32">
                <span className="text-lg text-gray-500">Đang tải chi tiết...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700">Thông tin đơn hàng</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Mã đơn:</span> <span className="font-mono">{selectedOrder._id}</span></div>
                      <div><span className="font-medium">Ngày tạo:</span> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</div>
                      <div><span className="font-medium">Ngày cập nhật:</span> {new Date(selectedOrder.updatedAt).toLocaleString('vi-VN')}</div>
                      <div><span className="font-medium">Tổng tiền:</span> <span className="font-semibold text-green-600">{selectedOrder.totalAmount.toLocaleString()}₫</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700">Thông tin khách hàng</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Họ tên:</span> {selectedOrder.customerInfo.fullName || 'N/A'}</div>
                      <div><span className="font-medium">SĐT:</span> <a href={`tel:${selectedOrder.customerInfo.phone}`} className="text-blue-600 underline">{selectedOrder.customerInfo.phone || 'N/A'}</a></div>
                      <div><span className="font-medium">Email:</span> <a href={`mailto:${selectedOrder.customerInfo.email || ''}`} className="text-blue-600 underline">{selectedOrder.customerInfo.email || 'N/A'}</a></div>
                      <div><span className="font-medium">Địa chỉ:</span> {selectedOrder.customerInfo.address || ''}, {selectedOrder.customerInfo.city || ''}</div>
                    </div>
                  </div>
                </div>

                {/* Trạng thái và thanh toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700">Trạng thái đơn hàng</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Trạng thái:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          selectedOrder.orderStatus === 'shipping' ? 'bg-purple-100 text-purple-800' :
                          selectedOrder.orderStatus === 'packing' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedOrder.orderStatus === 'delivered' ? 'Hoàn thành' :
                           selectedOrder.orderStatus === 'shipping' ? 'Đang giao' :
                           selectedOrder.orderStatus === 'packing' ? 'Đã xác nhận' :
                           selectedOrder.orderStatus === 'cancelled' ? 'Đã hủy' :
                           'Chờ xác nhận'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Phương thức:</span> {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.toUpperCase() : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Thanh toán:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' :
                           selectedOrder.paymentStatus === 'pending' ? 'Chờ thanh toán' :
                           'Thất bại'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.paymentMethod === 'atm' && selectedOrder.bankInfo && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-700">Thông tin ngân hàng</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">Ngân hàng:</span> {selectedOrder.bankInfo.bankName}</div>
                        <div><span className="font-medium">Số tài khoản:</span> {selectedOrder.bankInfo.accountNumber}</div>
                        <div><span className="font-medium">Tên tài khoản:</span> {selectedOrder.bankInfo.accountName}</div>
                        <div><span className="font-medium">Chi nhánh:</span> {selectedOrder.bankInfo.branch}</div>
                        {selectedOrder.transferContent && (
                          <div><span className="font-medium">Nội dung:</span> {selectedOrder.transferContent}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Danh sách sản phẩm */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700">Sản phẩm đã đặt</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Số lượng</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Đơn giá</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{item.name || 'N/A'}</div>
                                  {item.colorName && (
                                    <div className="text-sm text-gray-500">Màu: {item.colorName}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{item.price.toLocaleString()}₫</td>
                            <td className="px-4 py-3 font-medium">{(item.price * item.quantity).toLocaleString()}₫</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Nút thao tác */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedOrder.paymentStatus !== 'paid' && (
                    <Button
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FaCheck className="mr-2" />
                      Xác nhận thanh toán
                    </Button>
                  )}
                  
                  {selectedOrder.orderStatus === 'packing' && (
                    <Button
                      onClick={() => handleShippingOrder(selectedOrder)}
                      disabled={actionLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <FaTruck className="mr-2" />
                      Chuyển sang đang giao
                    </Button>
                  )}
                  
                  {selectedOrder.orderStatus === 'shipping' && (
                    <Button
                      onClick={() => handleDeliveredOrder(selectedOrder)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FaCheck className="mr-2" />
                      Hoàn thành
                    </Button>
                  )}
                  
                  {['confirming', 'packing', 'shipping'].includes(selectedOrder.orderStatus) && (
                    <Button
                      onClick={() => handleCancelOrder(selectedOrder)}
                      disabled={actionLoading}
                      variant="destructive"
                    >
                      <FaTimes className="mr-2" />
                      Hủy đơn
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Nút đóng */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10" 
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
};

export default Orders; 