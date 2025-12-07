// Định nghĩa cấu trúc cho Category
export interface Category {
  _id: string;
  ten_danh_muc: string;
  banner_dm: string;
}

// Định nghĩa cấu trúc cho ProductVariant
export interface ProductVariant {
  _id: string;
  id_san_pham: string;
  hinh: string;
  gia: number;
  gia_goc: number;
  dung_luong: string;
  mau: string;
  kich_thuoc?: string;
  so_luong_hang: number;
  an_hien: boolean;
  phan_tram_giam_gia?: number;
}

// Định nghĩa cấu trúc cho Product
export interface Product {
  gia: number | undefined;
  _id: string;
  TenSP: string;
  Gia: number;
  khuyen_mai?: number;
  Mota?: string;
  hinh: string[];
  video?: string[]; 
  hot?: boolean;
  ban_chay?: number;
  thong_so_ky_thuat: {
    CPU: String,
    Camera: [String],
    GPU: String,
    Cong_nghe_man_hinh: String,
    He_dieu_hanh: String,
    Do_phan_giai: String,
    Ket_noi: [String],
    Kich_thuoc_khoi_luong: [String],
    Kich_thuoc_man_hinh: String,
    Tien_ich_khac: [String],
    Tinh_nang_camera: [String]
  };
  an_hien?: boolean;
  ngay_tao?: string;
  id_danhmuc: string;
  Soluong: number;
  variants?: ProductVariant[];
  chat_lieu?: string;
}

// Định nghĩa Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface Banner {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
}
export interface Logo{
  id: number;
  image: string;
  title: string;
  
}
export interface HomePageData {
  flashSaleProducts: Product[];
  iPhoneProducts: Product[];
  iPadProducts: Product[];
  categories: Category[];
}
export interface Settings {
  _id: string;
  Logo: string;
  Banner: string;
  Page: string;
  So_dien_thoai: string;
  Thong_bao: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface FlashSaleVariantInHomepage {
  id_variant: string;
  gia_flash_sale: number;
  so_luong: number;
  da_ban: number;
  product_name?: string;
  variant_details?: string;
  product_id: string;
  product_image: string | string[];
  phan_tram_giam_gia?: number;
  gia_goc?: number;
}
export interface FlashSale {
  _id: string;
  ten_su_kien: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  an_hien: boolean;
  flashSaleVariants: FlashSaleVariantInHomepage[];
}

// Định nghĩa cấu trúc cho NewsItem
export interface NewsItem {
  _id: string;
  tieu_de: string;
  mo_ta: string;
  noi_dung?: string;
  hinh: string;
  ngay: string;
  luot_xem?: number;
  an_hien?: boolean;
  id_danh_muc?: { _id: string; ten_danh_muc: string };
  id_danhmuc?: string;
}