/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaEdit, FaEye, FaEyeSlash, FaPlus, FaTrash } from "react-icons/fa";
import React from "react";
import { colorMap, getVnColorName } from '@/constants/colorMapShared';
import { getApiUrl, getBaseUrl } from '@/config/api';
import { showErrorAlert, showWarningAlert } from '@/utils/sweetAlert';

interface Variant {
  _id: string;
  id_san_pham: string;
  hinh: string[];
  gia: number;
  gia_goc?: number;
  dung_luong?: string;
  mau?: string;
  so_luong_hang?: number;
  an_hien?: boolean; 
}

interface Product {
  _id: string;
  TenSP: string;
  id_danhmuc: string;
  categories?: { ten_danh_muc: string }[];
}

// Danh mục sản phẩm cần bắt buộc dung lượng và màu sắc
// Các sản phẩm khác như Mac, Apple Watch, Phụ kiện, Âm thanh, Camera không bắt buộc
const CATEGORIES_REQUIRE_STORAGE_COLOR = [
  '681d97db2a400db1737e6de3', // iPhone
  '681d97db2a400db1737e6de4', // iPad
  // Có thể thêm các danh mục khác nếu cần:
  // '681d97db2a400db1737e6de5', // Mac (nếu cần bắt buộc dung lượng và màu sắc)
  // '681d97db2a400db1737e6de6', // Apple Watch (nếu cần màu sắc cho dây đeo)
];

export default function VariantProductPage({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImgs, setCurrentImgs] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editVariant, setEditVariant] = useState<Variant | null>(null);
  const [form, setForm] = useState<Partial<Variant>>({
    hinh: [],
    gia: 0,
    gia_goc: 0,
    dung_luong: "",
    mau: "",
    so_luong_hang: 0,
    an_hien: true,
  });
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Kiểm tra xem danh mục có cần bắt buộc dung lượng và màu sắc không
  const requiresStorageAndColor = product ? CATEGORIES_REQUIRE_STORAGE_COLOR.includes(product.id_danhmuc) : true;

  useEffect(() => {
    if (!productId) return;
    
    const fetchData = async () => {
      try {
        // Fetch thông tin sản phẩm
        const productRes = await fetch(getApiUrl(`products/${productId}`));
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
        }

        // Fetch variants - admin cần xem tất cả (bao gồm cả ẩn)
        const variantRes = await fetch(getApiUrl(`variants/by-product/${productId}`));
        if (!variantRes.ok) {
          setVariants([]);
          setCurrentImgs([]);
          setError("");
        } else {
          const variantData = await variantRes.json();
          setVariants(variantData);
          setCurrentImgs(Array(variantData.length).fill(0));
          setError("");
        }
      } catch (error: any) {
        setVariants([]);
        setCurrentImgs([]);
        setError(error.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Mở modal Thêm
  const handleAdd = () => {
    setEditVariant(null);
    setForm({
      hinh: [],
      gia: 0,
      gia_goc: 0,
      dung_luong: "",
      mau: "",
      so_luong_hang: 0,
      an_hien: true,
    });
    setShowModal(true);
  };

  // Mở modal Sửa
  const handleEdit = (variant: Variant) => {
    setEditVariant(variant);
    setForm({ ...variant });
    setShowModal(true);
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Validation có điều kiện
    if (!form.gia) {
      setFormError("Vui lòng nhập giá bán!");
      return;
    }
    
    if (requiresStorageAndColor) {
      if (!form.dung_luong || !form.mau) {
        setFormError("Vui lòng nhập đầy đủ dung lượng và màu sắc cho sản phẩm này!");
        return;
      }
    }

    try {
      let res;
      if (editVariant) {
        res = await fetch(getApiUrl(`variants/${editVariant._id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(getApiUrl('variants'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id_san_pham: productId }),
        });
      }
      if (!res.ok) throw new Error("Lỗi khi lưu biến thể");
      setShowModal(false);
      setEditVariant(null);
      setForm({
        hinh: [],
        gia: 0,
        gia_goc: 0,
        dung_luong: "",
        mau: "",
        so_luong_hang: 0,
        an_hien: true,
      });
      // Refresh lại danh sách
      const data = await fetch(getApiUrl(`variants/by-product/${productId}`)).then(r => r.json());
      setVariants(data);
      setCurrentImgs(Array(data.length).fill(0));
    } catch (err: any) {
      setFormError(err.message || "Lỗi không xác định");
    }
  };

  // Xử lý upload file hình ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const res = await fetch(getApiUrl('variants/upload-image'), {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Lỗi upload hình ảnh");
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      } catch (err) {
        showErrorAlert('Lỗi', "Lỗi upload hình ảnh: " + (err as any).message);
      }
    }
    setForm(f => ({ ...f, hinh: [...(f.hinh as string[] || []), ...uploadedUrls] }));
    setUploading(false);
    e.target.value = ""; // reset input
  };

  if (!productId) return <div>Không tìm thấy sản phẩm!</div>;
  if (loading) return <div>Đang tải biến thể...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Danh sách biến thể sản phẩm</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          onClick={handleAdd}
        >
         Thêm biến thể
        </button>
      </div>
      {/* Modal Thêm/Sửa biến thể */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pt-20 pl-60">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[900px] relative max-h-[90vh] flex flex-col">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-2 text-blue-700">
              {editVariant ? "Sửa biến thể" : "Thêm biến thể mới"}
            </h2>
            {product && !requiresStorageAndColor && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Sản phẩm &quot;{product.TenSP}&quot; thuộc danh mục không yêu cầu dung lượng và màu sắc cố định. 
                  Các trường này là tùy chọn.
                </p>
              </div>
            )}
            {/* Nội dung form cuộn được */}
            <form className="flex flex-row gap-6 flex-1 overflow-y-auto max-h-[70vh]" onSubmit={handleSubmit}>
              {/* Cột trái: hình ảnh */}
              <div className="w-1/3 min-w-[220px] flex flex-col">
                <label className="block font-semibold mb-1">Hình ảnh biến thể</label>
                {/* Input file để upload nhiều hình */}
                                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="mb-2"
                  onChange={handleFileChange}
                />
                {/* Danh sách preview hình và input link */}
                {(form.hinh as string[] || []).length > 0 && (
                  <div className="flex flex-col gap-2 mb-2 max-h-64 overflow-y-auto pr-0">
                    {(form.hinh as string[]).map((img, idx) => (
                      <div key={idx} className="flex items-center gap-2 min-w-0">
                        <img
                          src={getImageUrl(img)}
                          alt={`preview-${idx}`}
                          className="w-16 h-16 object-cover border rounded bg-white flex-shrink-0"
                          onError={e => (e.currentTarget.src = "/images/no-image.svg")}
                        />
                        <input
                          type="text"
                          className="border rounded px-3 py-2 flex-1 min-w-0"
                          style={{overflow: 'hidden', textOverflow: 'ellipsis'}}
                          placeholder={`Link hình #${idx + 1}`}
                          value={img}
                          onChange={e => setForm(f => ({
                            ...f,
                            hinh: (f.hinh as string[]).map((h, i) => i === idx ? e.target.value : h)
                          }))}
                        />
                        {/* Nút di chuyển lên */}
                        <button
                          type="button"
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          disabled={idx === 0}
                          onClick={() => setForm(f => ({
                            ...f,
                            hinh: (() => {
                              const arr = [...(f.hinh as string[])];
                              if (idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                              return arr;
                            })()
                          }))}
                          title="Di chuyển lên"
                        >↑</button>
                        {/* Nút di chuyển xuống */}
                        <button
                          type="button"
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          disabled={idx === (form.hinh as string[]).length - 1}
                          onClick={() => setForm(f => ({
                            ...f,
                            hinh: (() => {
                              const arr = [...(f.hinh as string[])];
                              if (idx < arr.length - 1) [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                              return arr;
                            })()
                          }))}
                          title="Di chuyển xuống"
                        >↓</button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          onClick={() => setForm(f => ({
                            ...f,
                            hinh: (f.hinh as string[]).filter((_, i) => i !== idx)
                          }))}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  onClick={() => setForm(f => ({
                    ...f,
                    hinh: [...(f.hinh as string[] || []), ""]
                  }))}
                >
                  + Thêm hình (bằng link)
                </button>
              </div>
              {/* Cột phải: thông tin biến thể */}
              <div className="pl-10 w-2/3 flex flex-col gap-4">
                <label className="font-semibold mb-1">Giá bán <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="border rounded px-3 py-2"
                  placeholder="Nhập giá bán (VND)"
                  value={form.gia === 0 ? '' : (form.gia ?? '').toString()}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setForm(f => ({ ...f, gia: value === '' ? 0 : Number(value) }));
                    }
                  }}
                  onFocus={e => {
                    if (form.gia === 0) {
                      e.target.select();
                    }
                  }}
                  required
                />
                <label className="font-semibold mb-1">Giá gốc</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2"
                  placeholder="Nhập giá gốc (VND)"
                  value={form.gia_goc === 0 ? '' : (form.gia_goc ?? '').toString()}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setForm(f => ({ ...f, gia_goc: value === '' ? 0 : Number(value) }));
                    }
                  }}
                  onFocus={e => {
                    if (form.gia_goc === 0) {
                      e.target.select();
                    }
                  }}
                />
                <label className="font-semibold mb-1">
                  Dung lượng {requiresStorageAndColor && <span className="text-red-500">*</span>}
                </label>
                <input
                  className={`border rounded px-3 py-2 ${!requiresStorageAndColor ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder={requiresStorageAndColor ? "Nhập dung lượng" : "Không bắt buộc"}
                  value={form.dung_luong ?? ""}
                  onChange={e => setForm(f => ({ ...f, dung_luong: e.target.value }))}
                  required={requiresStorageAndColor}
                  disabled={!requiresStorageAndColor}
                />
                <label className="font-semibold mb-1">
                  Màu sắc {requiresStorageAndColor && <span className="text-red-500">*</span>}
                </label>
                <input
                  className={`border rounded px-3 py-2 ${!requiresStorageAndColor ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder={requiresStorageAndColor ? "Nhập màu sắc (Mã màu sắc)" : "Không bắt buộc"}
                  value={form.mau ?? ""}
                  onChange={e => setForm(f => ({ ...f, mau: e.target.value }))}
                  required={requiresStorageAndColor}
                  disabled={!requiresStorageAndColor}
                />
                <label className="font-semibold mb-1">Số lượng hàng</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2"
                  placeholder="Nhập số lượng tồn kho"
                  value={form.so_luong_hang === 0 ? '' : (form.so_luong_hang ?? '').toString()}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setForm(f => ({ ...f, so_luong_hang: value === '' ? 0 : Number(value) }));
                    }
                  }}
                  onFocus={e => {
                    if (form.so_luong_hang === 0) {
                      e.target.select();
                    }
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={form.an_hien ?? true}
                    onChange={e => setForm(f => ({ ...f, an_hien: e.target.checked }))}
                  />
                  <span>Hiện biến thể</span>
                </div>
                {formError && (
                  <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    {formError}
                  </div>
                )}
                {/* Thanh action luôn cố định dưới */}
                <div className="flex justify-end gap-2 mt-6 sticky bottom-0 bg-white pt-2 pb-1 z-10">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {variants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có biến thể nào</h3>
          <p className="text-gray-500 mb-6">Sản phẩm này chưa có biến thể nào. Hãy tạo biến thể đầu tiên để có thể bán sản phẩm.</p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            onClick={handleAdd}
          >
            <FaPlus className="w-4 h-4" />
            Tạo biến thể đầu tiên
          </button>
        </div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">STT</th>
              <th className="border px-4 py-2">Hình</th>
              <th className="border px-4 py-2">Giá</th>
              <th className="border px-4 py-2">Giá gốc</th>
              <th className="border px-4 py-2">Dung lượng</th>
              <th className="border px-4 py-2">Màu</th>
              <th className="border px-4 py-2">Số lượng</th>
              <th className="border px-4 py-2">Trạng thái</th>
              <th className="border px-4 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, idx) => {
              // Không lọc an_hien, luôn render tất cả biến thể
              const totalImgs = variant.hinh?.length || 0;
              const currentImg = currentImgs[idx] || 0;
              return (
                <tr key={variant._id}>
                  <td className="border px-4 py-2 text-center">{idx + 1}</td>
                  <td className="border px-4 py-2 min-w-[80px]">
                    {totalImgs > 0 ? (
                      <div className="relative flex items-center justify-center w-20 h-20">
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-200 rounded-full px-1 py-0.5 text-xs"
                          onClick={e => {
                            e.stopPropagation();
                            setCurrentImgs(imgs => imgs.map((v, i) => i === idx ? (v - 1 + totalImgs) % totalImgs : v));
                          }}
                          disabled={totalImgs <= 1}
                        >
                          &#8592;
                        </button>
                        <img
                          src={getImageUrl(variant.hinh[currentImg])}
                          alt={`variant-img-${currentImg}`}
                          width={64}
                          height={64}
                          className="rounded object-cover border mx-6"
                        />
                        <button
                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-200 rounded-full px-1 py-0.5 text-xs"
                          onClick={e => {
                            e.stopPropagation();
                            setCurrentImgs(imgs => imgs.map((v, i) => i === idx ? (v + 1) % totalImgs : v));
                          }}
                          disabled={totalImgs <= 1}
                        >
                          &#8594;
                        </button>
                      </div>
                    ) : (
                      <span>Không có ảnh</span>
                    )}
                  </td>
                  <td className="border px-4 py-2">{variant.gia?.toLocaleString()}₫</td>
                  <td className="border px-4 py-2">{variant.gia_goc?.toLocaleString() || "-"}₫</td>
                  <td className="border px-4 py-2">{variant.dung_luong || "-"}</td>
                  <td className="border px-4 py-2">{getVnColorName(variant.mau || "")}</td>
                  <td className="border px-4 py-2">
                    <span className={`font-semibold ${
                      (variant.so_luong_hang ?? 0) === 0 
                        ? 'text-red-600' 
                        : (variant.so_luong_hang ?? 0) <= 5 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                    }`}>
                      {variant.so_luong_hang ?? "-"}
                      {(variant.so_luong_hang ?? 0) === 0 && " (Hết hàng)"}
                      {(variant.so_luong_hang ?? 0) > 0 && (variant.so_luong_hang ?? 0) <= 5 && " (Sắp hết)"}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium inline-block font-semibold ${variant.an_hien ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {variant.an_hien ? "Hiện" : "Ẩn"}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full mr-2"
                      title="Sửa"
                      onClick={() => handleEdit(variant)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`p-2 ${variant.an_hien ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white rounded-full`}
                      title={variant.an_hien ? "Ẩn" : "Hiện"}
                      onClick={async () => {
                        try {
                          const res = await fetch(getApiUrl(`variants/toggle-visibility/${variant._id}`), { method: "PATCH" });
                          if (!res.ok) throw new Error("Lỗi đổi trạng thái");
                          // Refresh lại danh sách
                                  const data = await fetch(getApiUrl(`variants/by-product/${productId}`)).then(r => r.json());
        setVariants(data);
                          setCurrentImgs(Array(data.length).fill(0));
                        } catch (err) {
                          showErrorAlert('Lỗi', 'Lỗi đổi trạng thái biến thể!');
                        }
                      }}
                    >
                      {variant.an_hien ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function getImageUrl(image: string | undefined): string {
  if (!image) return "/images/no-image.svg";
  if (image.startsWith("http")) return image;
  return `${getBaseUrl()}/images/${image.replace(/^\/images\//, "")}`;
}

