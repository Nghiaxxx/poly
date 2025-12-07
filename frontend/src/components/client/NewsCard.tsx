import React from "react";
import { getBaseUrl } from "@/config/api";

export interface NewsItem {
  _id: string;
  tieu_de: string;
  mo_ta: string;
  hinh: string;
  ngay: string;
  nguoi_dang?: { TenKH: string };
  id_danh_muc?: { ten_danh_muc: string };
}

export default function NewsCard({ item }: { item: NewsItem }) {
      const imageUrl = item.hinh.startsWith('http') ? item.hinh : `${getBaseUrl()}${item.hinh}`;
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-none border-0 mb-6 flex flex-col">
      <img
        src={imageUrl}
        alt={item.tieu_de}
        className="w-full h-40 object-cover rounded-t-2xl"
      />
      <div className="flex-1 flex flex-col px-4 py-3">
        <h3 className="font-bold text-xl mb-2 line-clamp-2">{item.tieu_de}</h3>
        <div className="flex items-center text-gray-500 text-base mb-2">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(item.ngay).toLocaleDateString()}
        </div>
        {/* <div className="text-gray-600 text-base line-clamp-2">Người đăng: {item.nguoi_dang?.TenKH}</div> <br /> */}

        <div className="text-gray-600 text-base line-clamp-2">{item.mo_ta}</div>
      </div>
    </div>
  );
} 