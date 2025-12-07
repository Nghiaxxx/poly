'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';
import { getVnColorName } from '@/constants/colorMapShared';
import { showWarningAlert } from '@/utils/sweetAlert';

interface ProductVariant {
  _id: string;
  id_san_pham: string;
  hinh: string | string[];
  gia: number;
  gia_goc: number;
  dung_luong: string;
  mau: string;
  so_luong_hang: number;
  an_hien: boolean;
}

interface Product {
  _id: string;
  TenSP: string;
  variants: ProductVariant[];
}

interface FlashSaleVariantData {
  id_variant: string;
  gia_flash_sale: number;
  phan_tram_giam_gia?: number;
  so_luong: number;
  product_name?: string;
  variant_details?: string;
}

interface FlashSale {
  _id: string;
  ten_su_kien: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  an_hien: boolean;
  flashSaleVariants?: FlashSaleVariantData[];
}

interface EditFlashSaleFormProps {
  flashSale: FlashSale;
  onClose: () => void;
  onSuccess: () => void;
}

const formatDateTimeForInput = (isoString: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    // Pad numbers to ensure two digits
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    // Check if date is valid before returning
    if (isNaN(year)) return '';

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    
    return '';
  }
};

const EditFlashSaleForm: React.FC<EditFlashSaleFormProps> = ({ flashSale, onClose, onSuccess }) => {
  const [tenSuKien, setTenSuKien] = useState<string>(flashSale.ten_su_kien);
  const [thoiGianBatDau, setThoiGianBatDau] = useState<string>('');
  const [thoiGianKetThuc, setThoiGianKetThuc] = useState<string>('');
  const [anHien, setAnHien] = useState<boolean>(flashSale.an_hien);
  const [selectedVariants, setSelectedVariants] = useState<FlashSaleVariantData[]>(flashSale.flashSaleVariants || []);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputTypeMap, setInputTypeMap] = useState<Record<string, 'gia' | 'phantram'>>({});

  // Format thời gian từ database để hiển thị trong input datetime-local
  useEffect(() => {
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setThoiGianBatDau(formatDateTime(flashSale.thoi_gian_bat_dau));
    setThoiGianKetThuc(formatDateTime(flashSale.thoi_gian_ket_thuc));
    setSelectedVariants(flashSale.flashSaleVariants || []);
  }, [flashSale]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url;
        if (searchTerm.trim()) {
          // Sử dụng endpoint search với parameter keyword
          url = getApiUrl(`products/find?keyword=${encodeURIComponent(searchTerm.trim())}`);
        } else {
          // Nếu không có search term, lấy tất cả sản phẩm
          url = getApiUrl('products');
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          setProducts(Array.isArray(data) ? data : []);
        } else {
          setError(data.message || "Không thể tìm kiếm sản phẩm.");
        }
      } catch (err) {
        console.error('Search error:', err);
        setError("Không thể tìm kiếm sản phẩm.");
      }
    };
    
    const handler = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Khởi tạo inputTypeMap dựa trên dữ liệu hiện có
  useEffect(() => {
    const initialInputTypeMap: Record<string, 'gia' | 'phantram'> = {};
    selectedVariants.forEach(sv => {
      // Nếu có phan_tram_giam_gia thì sử dụng % giảm, ngược lại sử dụng giá
      if (sv.phan_tram_giam_gia !== undefined && sv.phan_tram_giam_gia !== null) {
        initialInputTypeMap[sv.id_variant] = 'phantram';
      } else {
        initialInputTypeMap[sv.id_variant] = 'gia';
      }
    });
    setInputTypeMap(initialInputTypeMap);
  }, [selectedVariants]);

  const handleAddVariant = (product: Product, variant: ProductVariant) => {
    const exists = selectedVariants.some(sv => sv.id_variant === variant._id);
    if (exists) {
      showWarningAlert('Thông báo', 'Biến thể sản phẩm này đã được thêm vào flash sale.');
      return;
    }

    setSelectedVariants(prev => [
      ...prev,
      {
        id_variant: variant._id,
        gia_flash_sale: variant.gia_goc || variant.gia, // Sử dụng giá gốc làm giá flash sale mặc định
        so_luong: variant.so_luong_hang,
        product_name: product.TenSP,
        variant_details: `${variant.dung_luong} - ${getVnColorName(variant.mau)} (Giá gốc: ${variant.gia_goc || variant.gia})`,
      },
    ]);
  };

  const handleRemoveVariant = (id_variant: string) => {
    setSelectedVariants(prev => prev.filter(sv => sv.id_variant !== id_variant));
  };

  const handleInputTypeChange = (id_variant: string, type: 'gia' | 'phantram') => {
    setInputTypeMap(prev => ({ ...prev, [id_variant]: type }));
    if (type === 'phantram') {
      setSelectedVariants(prev => prev.map(sv => {
        if (sv.id_variant === id_variant) {
          // Lấy giá gốc từ variant gốc
          const variant = products.flatMap(p => p.variants).find(v => v._id === id_variant);
          const gia_goc = variant?.gia_goc || variant?.gia || 0;
          return { ...sv, phan_tram_giam_gia: 0, gia_flash_sale: gia_goc };
        }
        return sv;
      }));
    }
  };

  const handleVariantChange = (id_variant: string, field: string, value: any) => {
    setSelectedVariants(prev =>
      prev.map(sv => {
        if (sv.id_variant !== id_variant) return sv;
        if (field === 'phan_tram_giam_gia') {
          // Lấy giá gốc từ variant gốc thay vì parse từ string
          const variant = products.flatMap(p => p.variants).find(v => v._id === id_variant);
          const gia_goc = variant?.gia_goc || variant?.gia || 0;
          const gia_flash_sale = Math.round(gia_goc * (1 - value / 100));
          // Cập nhật inputTypeMap để hiển thị phần trăm giảm giá
          setInputTypeMap(prev => ({ ...prev, [id_variant]: 'phantram' }));
          return { ...sv, phan_tram_giam_gia: value, gia_flash_sale };
        }
        if (field === 'gia_flash_sale') {
          // Khi thay đổi giá flash sale, tính lại phần trăm giảm giá
          const variant = products.flatMap(p => p.variants).find(v => v._id === id_variant);
          const gia_goc = variant?.gia_goc || variant?.gia || 0;
          const phan_tram_giam_gia = gia_goc > 0 ? Math.round((1 - value / gia_goc) * 100) : 0;
          // Cập nhật inputTypeMap để hiển thị phần trăm giảm giá
          setInputTypeMap(prev => ({ ...prev, [id_variant]: 'phantram' }));
          return { ...sv, gia_flash_sale: value, phan_tram_giam_gia };
        }
        return { ...sv, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedVariants.length === 0) {
      setError("Vui lòng thêm ít nhất một biến thể sản phẩm.");
      setLoading(false);
      return;
    }

    const startDate = new Date(thoiGianBatDau);
    const endDate = new Date(thoiGianKetThuc);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError("Thời gian bắt đầu hoặc kết thúc không hợp lệ.");
      setLoading(false);
      return;
    }

    if (startDate >= endDate) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      setLoading(false);
      return;
    }

    // Validate giá flash sale
    for (const sv of selectedVariants) {
      const variant = products.flatMap(p => p.variants).find(v => v._id === sv.id_variant);
      const gia_goc = variant?.gia_goc || variant?.gia || 0;
      
      if (sv.gia_flash_sale > gia_goc) {
        setError(`Giá flash sale của ${sv.product_name} không được cao hơn giá gốc (${gia_goc.toLocaleString()}₫)`);
        setLoading(false);
        return;
      }
      
      if (sv.gia_flash_sale <= 0) {
        setError(`Giá flash sale của ${sv.product_name} phải lớn hơn 0`);
        setLoading(false);
        return;
      }

      // Validate phần trăm giảm giá nếu có
      if (sv.phan_tram_giam_gia !== undefined && sv.phan_tram_giam_gia !== null) {
        if (sv.phan_tram_giam_gia < 0 || sv.phan_tram_giam_gia > 100) {
          setError(`Phần trăm giảm giá của ${sv.product_name} phải từ 0 đến 100%`);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const flashSaleData = {
        ten_su_kien: tenSuKien,
        thoi_gian_bat_dau: new Date(thoiGianBatDau).toISOString(),
        thoi_gian_ket_thuc: new Date(thoiGianKetThuc).toISOString(),
        an_hien: anHien,
        flashSaleVariants: selectedVariants.map(sv => ({
          id_variant: sv.id_variant,
          gia_flash_sale: sv.gia_flash_sale,
          phan_tram_giam_gia: inputTypeMap[sv.id_variant] === 'phantram' ? sv.phan_tram_giam_gia : null,
          so_luong: sv.so_luong,
        })),
      };

      const response = await fetch(getApiUrl(`flashsales/${flashSale._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flashSaleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi cập nhật Flash Sale.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{overflowY: 'auto'}}>
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{overscrollBehavior: 'contain'}}>
        <div className="flex justify-between items-center p-5 border-b border-stroke dark:border-strokedark">
          <h2 className="text-xl font-bold text-black dark:text-white">Chỉnh Sửa Flash Sale</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-black dark:text-white text-sm font-bold mb-2" htmlFor="tenSuKien">Tên Sự Kiện</label>
              <input
                type="text"
                id="tenSuKien"
                value={tenSuKien}
                onChange={(e) => setTenSuKien(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-black dark:text-white text-sm font-bold mb-2" htmlFor="thoiGianBatDau">Thời Gian Bắt Đầu</label>
              <input
                type="datetime-local"
                id="thoiGianBatDau"
                value={thoiGianBatDau}
                onChange={(e) => setThoiGianBatDau(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-black dark:text-white text-sm font-bold mb-2" htmlFor="thoiGianKetThuc">Thời Gian Kết Thúc</label>
              <input
                type="datetime-local"
                id="thoiGianKetThuc"
                value={thoiGianKetThuc}
                onChange={(e) => setThoiGianKetThuc(e.target.value)}
                min={thoiGianBatDau || new Date().toISOString().slice(0, 16)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                required
              />
            </div>
            <div className="flex items-center mt-4">
              <label className="block text-black dark:text-white text-sm font-bold mr-2" htmlFor="anHien">Hiển Thị</label>
              <input
                type="checkbox"
                id="anHien"
                checked={anHien}
                onChange={(e) => setAnHien(e.target.checked)}
                className="form-checkbox h-5 w-5 text-primary rounded"
              />
            </div>
          </div>

          <div className="border p-4 rounded-lg dark:border-strokedark">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Chọn Biến Thể Sản Phẩm</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
            {products.length > 0 && (
              <div className="max-h-60 overflow-y-auto border rounded dark:border-strokedark mb-4">
                {products.map(product => (
                  <div key={product._id} className="p-3 border-b last:border-b-0 dark:border-strokedark">
                    <h4 className="font-semibold text-black dark:text-white mb-2">{product.TenSP}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.variants.map(variant => (
                        <div key={variant._id} className="flex items-center justify-between bg-gray-50 dark:bg-meta-4 p-2 rounded">
                          <span className="text-sm text-black dark:text-white">
                            {variant.dung_luong} - {getVnColorName(variant.mau)} (Giá gốc: {variant.gia_goc || variant.gia})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddVariant(product, variant)}
                            className="ml-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded"
                          >
                            Thêm
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h4 className="text-md font-bold text-black dark:text-white mb-2">Biến thể đã chọn:</h4>
            {selectedVariants.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Chưa có biến thể nào được chọn.</p>
            ) : (
              <div className="space-y-3">
                {selectedVariants.map((sv) => (
                  <div key={sv.id_variant} className="border p-3 rounded-md dark:border-strokedark flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div>
                      <p className="font-medium text-black dark:text-white">{sv.product_name}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{sv.variant_details}</p>
                      <p className="text-xs text-gray-500">
                        Giá gốc: {(() => {
                          const variant = products.flatMap(p => p.variants).find(v => v._id === sv.id_variant);
                          return (variant?.gia_goc || variant?.gia || 0).toLocaleString();
                        })()}₫
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                      <div className="flex items-center gap-2">
                        <label>
                          <input type="radio" name={`inputType-${sv.id_variant}`} checked={inputTypeMap[sv.id_variant] !== 'phantram'} onChange={() => handleInputTypeChange(sv.id_variant, 'gia')} /> Giá
                        </label>
                        <label>
                          <input type="radio" name={`inputType-${sv.id_variant}`} checked={inputTypeMap[sv.id_variant] === 'phantram'} onChange={() => handleInputTypeChange(sv.id_variant, 'phantram')} /> % Giảm
                        </label>
                      </div>
                      {inputTypeMap[sv.id_variant] === 'phantram' ? (
                        <input
                          type="number"
                          placeholder="% giảm giá"
                          value={sv.phan_tram_giam_gia ?? ''}
                          min={0}
                          max={100}
                          onChange={e => handleVariantChange(sv.id_variant, 'phan_tram_giam_gia', parseFloat(e.target.value))}
                          className="w-full md:w-24 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                          required
                        />
                      ) : (
                        <input
                          type="number"
                          placeholder="Giá Flash Sale"
                          value={sv.gia_flash_sale}
                          onChange={e => handleVariantChange(sv.id_variant, 'gia_flash_sale', parseFloat(e.target.value))}
                          className="w-full md:w-32 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                          required
                        />
                      )}
                      <span className="text-xs text-gray-500">
                        {inputTypeMap[sv.id_variant] === 'phantram' && sv.gia_flash_sale ? (
                          <>
                            Giá gốc: {(() => {
                              const variant = products.flatMap(p => p.variants).find(v => v._id === sv.id_variant);
                              return (variant?.gia_goc || variant?.gia || 0).toLocaleString();
                            })()}₫ → Giá sale: {sv.gia_flash_sale.toLocaleString()}₫
                            {(() => {
                              const variant = products.flatMap(p => p.variants).find(v => v._id === sv.id_variant);
                              const gia_goc = variant?.gia_goc || variant?.gia || 0;
                              const tiet_kiem = gia_goc - sv.gia_flash_sale;
                              return tiet_kiem > 0 ? ` (Tiết kiệm: ${tiet_kiem.toLocaleString()}₫)` : '';
                            })()}
                          </>
                        ) : ''}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                      <input
                        type="number"
                        placeholder="Số lượng"
                        value={sv.so_luong}
                        onChange={(e) => handleVariantChange(sv.id_variant, 'so_luong', parseInt(e.target.value))}
                        className="w-full md:w-24 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(sv.id_variant)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-stroke px-5 py-2.5 text-black hover:bg-gray-200 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật Flash Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFlashSaleForm; 