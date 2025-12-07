'use client';

import React, { useEffect, useState } from "react";
import { FaApple} from "react-icons/fa";
import NewsCard from "@/components/client/NewsCard";
import Link from "next/link";
import Image from "next/image";
import { getApiUrl, getBaseUrl } from "@/config/api";

// Định nghĩa kiểu dữ liệu
interface Category {
  _id: string;
  ten_danh_muc: string;
}

// Bổ sung an_hien và id_danh_muc có thể có _id
export interface NewsItem {
  _id: string;
  tieu_de: string;
  mo_ta: string;
  hinh: string;
  ngay: string;
  an_hien: boolean;
  id_danh_muc?: { _id: string; ten_danh_muc: string };
}

export default function NewsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    // Gọi API lấy danh mục
          fetch(getApiUrl('newscategory'))
      .then(res => res.json())
      .then((data: Category[]) => setCategories(data));

    // Gọi API lấy tin tức
          fetch(getApiUrl('news'))
      .then(res => res.json())
      .then((data: NewsItem[]) => {
        // Lọc chỉ lấy tin an_hien === true
        setNews(data.filter((item: NewsItem) => item.an_hien));
      })
      .finally(() => setLoading(false));
  }, []);

  // Lấy 3 tin đầu tiên làm featured
  const featuredNews = news.slice(0, 3);
  // News list chỉ lấy từ tin thứ 4 trở đi
  const newsList = news.slice(3);

  // Gom tin tức theo danh mục
  const newsByCategory: { [catId: string]: NewsItem[] } = {};
  categories.forEach(cat => {
    newsByCategory[cat._id] = news.filter(n => n.id_danh_muc && n.id_danh_muc.ten_danh_muc === cat.ten_danh_muc);
  });

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb + Title */}
      <div className="w-full bg-white pt-6 pb-2">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-gray-500 text-sm mb-2">Trang chủ <span className="mx-1">›</span> Tin tức</div>
          <h1 className="text-3xl font-bold text-center mb-2">Tin tức</h1>
        </div>
      </div>
      {/* Featured News */}
      <div className="max-w-5xl mx-auto px-4 mt-2">
        <div className="flex gap-4 mb-6">
          {/* Tin lớn bên trái */}
          {featuredNews[0] && featuredNews[0].id_danh_muc && featuredNews[0].id_danh_muc._id ? (
            <Link href={`/news/${featuredNews[0].id_danh_muc._id}/${featuredNews[0]._id}`} className="flex-1 relative rounded-xl overflow-hidden h-80 flex items-end min-w-0">
              <img
                src={featuredNews[0].hinh.startsWith('http') ? featuredNews[0].hinh : `${getBaseUrl()}${featuredNews[0].hinh}`}
                alt={featuredNews[0].tieu_de}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30" />
              <div className="relative z-10 p-6 w-full">
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{featuredNews[0].tieu_de}</h2>
                <p className="text-white text-base drop-shadow">{featuredNews[0].mo_ta}</p>
              </div>
            </Link>
          ) : null}
          {/* 2 tin nhỏ bên phải */}
          <div className="flex flex-col gap-4 w-[350px] max-w-[40%]">
            {featuredNews.slice(1, 3).map((item) => (
              item.id_danh_muc && item.id_danh_muc._id ? (
                <Link key={item._id} href={`/news/${item.id_danh_muc._id}/${item._id}`} className="relative rounded-xl overflow-hidden h-38 flex items-end min-w-0" style={{ height: 'calc(50% - 0.5rem)' }}>
                  <img
                    src={item.hinh.startsWith('http') ? item.hinh : `${getBaseUrl()}${item.hinh}`}
                    alt={item.tieu_de}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
                  <div className="relative z-10 p-4 w-full">
                    <h3 className="text-lg font-semibold text-white drop-shadow mb-1">{item.tieu_de}</h3>
                    <p className="text-white text-xs drop-shadow">{item.mo_ta}</p>
                  </div>
                </Link>
              ) : null
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-5xl mx-auto px-4 mt-6 flex flex-wrap gap-3 justify-center">
        {categories.map(cat => (
          <Link
            key={cat._id}
            href={`/news/${cat._id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-100 transition text-base font-medium"
          >
            <span className="text-lg"><FaApple /></span>
            {cat.ten_danh_muc}
          </Link>
        ))}
      </div>

      {/* News by Category */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        {categories.map(cat => (
          <div key={cat._id} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{cat.ten_danh_muc}</h2>
              <Link href={`/news/${cat._id}`} className="text-blue-600 text-sm hover:underline">Xem tất cả {cat.ten_danh_muc} &rarr;</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsByCategory[cat._id]?.slice(0, 4).map(item => (
                item.id_danh_muc && item.id_danh_muc._id ? (
                  <Link key={item._id} href={`/news/${item.id_danh_muc._id}/${item._id}`}>
                    <NewsCard item={item} />
                  </Link>
                ) : null
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 