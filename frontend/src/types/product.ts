export interface Product {
  _id: string;
  TenSP: string;
  hinh: string;
  khuyen_mai: number;
  an_hien: boolean;
  ngay_tao: string;
  id_danhmuc: string;
  thong_so_ky_thuat?: Record<string, any>;
  video?: any[];
  ban_chay?: number;
  hot?: boolean;
  categories?: any[];
  variants?: Variant[];
  isFlashSale?: boolean;
}


export interface Variant {
  _id: string;
  id_san_pham: string;
  hinh: string[];
  gia: number;
  gia_goc: number;
  dung_luong: string;
  mau: string;
  so_luong_hang: number;
  an_hien: boolean;
  isFlashSale?: boolean;
  flashSaleInfo?: {
    ten_su_kien: string;
    so_luong_con_lai: number;
    phan_tram_giam: number;
  };
} 