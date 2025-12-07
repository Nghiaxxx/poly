"use client";

import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash, FaPlus, FaHome, FaUser, FaEye, FaEyeSlash, FaUserShield } from "react-icons/fa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/config/api';

interface User {
  _id: string;
  TenKH: string;
  email: string;
  Sdt?: string;
  dia_chi?: string;
  gioi_tinh?: string;
  sinh_nhat?: string;
  role: string;
  active?: boolean;
  ngay_tao?: string;
}

const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "user", label: "Người dùng" },
  { value: "admin", label: "Quản trị viên" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

const FILTER_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "name_desc", label: "Tên Z-A" },
];

export default function UserAdminPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    TenKH: "",
    email: "",
    password: "",
    Sdt: "",
    dia_chi: "",
    gioi_tinh: "",
    sinh_nhat: "",
    active: true,
    role: "user"
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOption, setFilterOption] = useState("newest");
  const router = useRouter();

  const columns: ColumnDef<User, any>[] = [
    {
      id: "STT",
      header: () => <span className="text-black font-semibold">STT</span>,
      cell: ({
        row,
        table,
      }: {
        row: import('@tanstack/react-table').Row<User>;
        table: import('@tanstack/react-table').Table<User>;
      }) => {
        const pageSize = table.getState().pagination.pageSize;
        const pageIndex = table.getState().pagination.pageIndex;
        return <span className="text-black">{pageSize * pageIndex + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "TenKH",
      header: () => <span className="text-black font-semibold">Tên khách hàng</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => (
        <div className="text-black">
          <div className="font-medium">{row.getValue("TenKH")}</div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "Sdt",
      header: () => <span className="text-black font-semibold">Số điện thoại</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => (
        <span className="text-black">{row.getValue("Sdt") || 'N/A'}</span>
      ),
    },
    {
      accessorKey: "dia_chi",
      header: () => <span className="text-black font-semibold">Địa chỉ</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => (
        <div className="max-w-[200px] truncate text-black" title={row.getValue("dia_chi") as string}>
          {row.getValue("dia_chi") || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: "gioi_tinh",
      header: () => <span className="text-black font-semibold">Giới tính</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => {
        const gender = row.getValue("gioi_tinh") as string;
        
        // Hàm dịch giới tính sang tiếng Việt
        const translateGender = (genderValue: string) => {
          if (!genderValue) return 'N/A';
          
          const genderLower = genderValue.toLowerCase().trim();
          switch (genderLower) {
            case 'male':
            case 'nam':
              return 'Nam';
            case 'female':
            case 'nữ':
            case 'nu':
              return 'Nữ';
            case 'other':
            case 'khác':
              return 'Khác';
            default:
              return genderValue; // Giữ nguyên nếu không nhận diện được
          }
        };
        
        return (
          <span className="text-black">
            {translateGender(gender)}
          </span>
        );
      },
    },
    {
      accessorKey: "sinh_nhat",
      header: () => <span className="text-black font-semibold">Ngày sinh</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => {
        const birthday = row.getValue("sinh_nhat") as string;
        return (
          <span className="text-black text-sm">
            {birthday ? new Date(birthday).toLocaleDateString("vi-VN") : 'N/A'}
          </span>
        );
      },
    },
    {
      accessorKey: "role",
      header: () => <span className="text-black font-semibold">Vai trò</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => {
        const role = row.getValue("role") as string;
        return (
          <div className="flex items-center gap-2">
            <FaUserShield className={`w-4 h-4 ${role === 'admin' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              role === 'admin' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: () => <span className="text-black font-semibold">Trạng thái</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => {
        const active = row.getValue("active") as boolean;
        const role = row.original.role;
        
        if (role === 'admin') {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Admin
            </span>
          );
        }
        
        return (
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium inline-block text-black font-semibold
              ${active 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"}`}
          >
            {active ? "Hoạt động" : "Ngừng"}
          </div>
        );
      },
    },
    // {
    //   accessorKey: "ngay_tao",
    //   header: () => <span className="text-black font-semibold">Ngày tạo</span>,
    //   cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => {
    //     const ngayTao = row.getValue("ngay_tao") as string;
    //     return (
    //       <span className="text-black text-sm">
    //         {ngayTao ? new Date(ngayTao).toLocaleDateString("vi-VN") : 'N/A'}
    //       </span>
    //     );
    //   },
    // },
    {
      id: "actions",
      header: () => <span className="text-black font-semibold">Thao tác</span>,
      cell: ({ row }: { row: import('@tanstack/react-table').Row<User> }) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row.original)}
            className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full"
            title="Chỉnh sửa"
          >
            <FaEdit />
          </button>
          {row.original.role !== 'admin' && (
            <button
              onClick={() => handleToggleStatus(row.original._id)}
              className={`p-2 ${
                row.original.active 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-red-500 hover:bg-red-600"
              } text-white rounded-full`}
              title={row.original.active ? "Ngừng hoạt động" : "Kích hoạt"}
            >
              {row.original.active ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
          <button
            onClick={() => handleToggleRole(row.original._id, row.original.role)}
            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full"
            title="Thay đổi vai trò"
          >
            <FaUserShield />
          </button>
          <button
            onClick={() => setDeleteId(row.original._id)}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
            title="Xóa"
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  // Hàm fuzzy filter
  const fuzzyFilter = (row: any, columnId: string, value: string) => {
    const searchValue = value.toLowerCase();
    let cellValue = row.getValue(columnId);

    // Xử lý các trường hợp đặc biệt
    if (columnId === "TenKH") {
      cellValue = `${row.original.TenKH} ${row.original.email}`;
    } else if (columnId === "sinh_nhat" || columnId === "ngay_tao") {
      cellValue = cellValue ? new Date(cellValue).toLocaleDateString("vi-VN") : '';
    }

    return String(cellValue)
      .toLowerCase()
      .includes(searchValue);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(getApiUrl('users'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu user");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const openEditModal = (user: User) => {
    setEditUser(user);
    setNewUser({
      TenKH: user.TenKH || "",
      email: user.email || "",
      password: "",
      Sdt: user.Sdt || "",
      dia_chi: user.dia_chi || "",
      gioi_tinh: user.gioi_tinh || "",
      sinh_nhat: user.sinh_nhat || "",
      active: user.active !== undefined ? user.active : true,
      role: user.role || "user"
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!newUser.TenKH || !newUser.email) {
      toast.error("Vui lòng nhập tên và email!");
      return;
    }
    if (!editUser) {
      const password = newUser.password || "";
      const policy = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
      if (!policy.test(password)) {
        toast.error("Mật khẩu không hợp lệ");
        return;
      }
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      if (editUser) {
        // Sửa user
        const { password, ...userDataToUpdate } = newUser;
        const res = await fetch(getApiUrl(`users/${editUser._id}`), {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userDataToUpdate)
        });
        
        if (!res.ok) throw new Error("Lỗi khi cập nhật user");
        const data = await res.json();
        
        setUsers(prev => prev.map(u => u._id === data._id ? data : u));
        setShowModal(false);
        setEditUser(null);
        setNewUser({ TenKH: "", email: "", password: "", Sdt: "", dia_chi: "", gioi_tinh: "", sinh_nhat: "", active: true, role: "user" });
        toast.success('Đã cập nhật user thành công!');
      } else {
        // Thêm user
        const res = await fetch(getApiUrl('users/add'), {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newUser)
        });
        
        if (!res.ok) throw new Error("Lỗi khi thêm user");
        const data = await res.json();
        
        setUsers(prev => [data, ...prev]);
        setShowModal(false);
        setNewUser({ TenKH: "", email: "", password: "", Sdt: "", dia_chi: "", gioi_tinh: "", sinh_nhat: "", active: true, role: "user" });
        toast.success('Đã thêm user thành công!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(getApiUrl(`users/${deleteId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Lỗi khi xóa user');
      
      setUsers(prev => prev.filter(u => u._id !== deleteId));
      toast.success('Đã xóa user thành công!');
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(getApiUrl(`users/${userId}/toggle-status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Lỗi khi thay đổi trạng thái user');
      const data = await res.json();
      
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, active: data.user.active } : u
      ));
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const token = localStorage.getItem('admin_token');
      
      const res = await fetch(getApiUrl(`users/${userId}/toggle-role`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!res.ok) throw new Error('Lỗi khi thay đổi vai trò user');
      const data = await res.json();
      
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, role: data.user.role } : u
      ));
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  };

  // Lọc người dùng theo các tiêu chí
  const filteredUsers = useMemo(() => {
    let arr = [...users];
    
    // Lọc theo vai trò
    if (roleFilter !== "all") {
      arr = arr.filter(user => user.role === roleFilter);
    }
    
    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        arr = arr.filter(user => user.active === true);
      } else {
        arr = arr.filter(user => user.active === false);
      }
    }
    
    // Sắp xếp theo tiêu chí
    switch (filterOption) {
      case "newest":
        arr = arr.sort((a, b) => {
          if (a.ngay_tao && b.ngay_tao) {
            return new Date(b.ngay_tao).getTime() - new Date(a.ngay_tao).getTime();
          }
          return b._id.localeCompare(a._id);
        });
        break;
      case "oldest":
        arr = arr.sort((a, b) => {
          if (a.ngay_tao && b.ngay_tao) {
            return new Date(a.ngay_tao).getTime() - new Date(b.ngay_tao).getTime();
          }
          return a._id.localeCompare(b._id);
        });
        break;
      case "name_asc":
        arr = arr.sort((a, b) => a.TenKH.localeCompare(b.TenKH));
        break;
      case "name_desc":
        arr = arr.sort((a, b) => b.TenKH.localeCompare(a.TenKH));
        break;
      default:
        break;
    }
    
    return arr;
  }, [users, roleFilter, statusFilter, filterOption]);

  const table = useReactTable({
    data: filteredUsers,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-lg text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-lg text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* <button
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
            title="Trang chủ"
            onClick={() => router.push("/admin")}
          >
            <FaHome className="text-xl text-blue-600" />
          </button> */}
          <h2 className="text-2xl font-semibold text-gray-800">
            Quản lý người dùng
          </h2>
        </div>
        <div className="flex gap-4">
          <select
            className="border rounded px-3 py-2"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
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
            placeholder="Tìm kiếm tên, email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-64"
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => { setShowModal(true); setEditUser(null); }}
          >
            <FaPlus className="mr-2" />
            Thêm user
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
                  className="hover:bg-blue-50 transition"
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
                  <div className="flex flex-col items-center">
                    <FaUser className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500">Chưa có user nào</p>
                    <p className="text-sm text-gray-400">Hãy thêm user đầu tiên để bắt đầu</p>
                  </div>
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

      {/* Modal thêm/sửa user */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[85vh] overflow-y-auto">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{editUser ? "Sửa user" : "Thêm user mới"}</h2>
              <p className="text-gray-600 text-sm mt-1">Quản lý thông tin người dùng</p>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên khách hàng *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Tên khách hàng"
                  value={newUser.TenKH}
                  onChange={e => setNewUser({ ...newUser, TenKH: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu *</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Số điện thoại"
                  value={newUser.Sdt}
                  onChange={e => setNewUser({ ...newUser, Sdt: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Địa chỉ"
                  value={newUser.dia_chi}
                  onChange={e => setNewUser({ ...newUser, dia_chi: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={newUser.active ? "active" : "inactive"}
                  onChange={e => setNewUser({ ...newUser, active: e.target.value === "active" })}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={newUser.gioi_tinh || ""}
                  onChange={e => setNewUser({ ...newUser, gioi_tinh: e.target.value })}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={newUser.sinh_nhat || ""}
                  onChange={e => setNewUser({ ...newUser, sinh_nhat: e.target.value })}
                />
              </div>
            </form>

            {/* Nút đóng */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10" 
              onClick={() => { setShowModal(false); setEditUser(null); }}
            >
              ×
            </button>

            {/* Action buttons */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                onClick={() => { setShowModal(false); setEditUser(null); }}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleSaveUser}
                disabled={!newUser.TenKH || !newUser.email || (!editUser && (!newUser.password || newUser.password.length < 6))}
              >
                {editUser ? 'Cập nhật' : 'Thêm user'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4 text-red-600">Xác nhận xóa user</h3>
            <p className="mb-6 text-black">Bạn có chắc chắn muốn xóa user này không?</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
                onClick={() => setDeleteId(null)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleDeleteUser}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}