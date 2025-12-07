import React from "react";
import Link from "next/link";
import { NewsItem } from "./cautrucdata";

interface SectionNewsProps {
  news: NewsItem[];
  getImageUrl: (url: string | string[]) => string;
  loading?: boolean;
}

const SectionNews: React.FC<SectionNewsProps> = ({ news, getImageUrl, loading }) => {
  if (loading) return <div>Đang tải tin tức...</div>;
  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-40">
        <h2 className="text-2xl font-bold text-center mb-6">Tin Tức</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {news
            .sort((a, b) => (b.luot_xem || 0) - (a.luot_xem || 0))
            .slice(0, 3)
            .map((item) => (
              <Link
                key={item._id}
                href={`/news/${item.id_danhmuc}/${item._id}`}
                className="bg-white rounded-2xl overflow-hidden shadow border hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                <img
                  src={getImageUrl(item.hinh)}
                  alt={item.tieu_de}
                  className="w-full h-[220px] object-cover"
                />
                <div className="flex-1 flex flex-col p-4">
                  <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {item.tieu_de}
                  </h3>
                  <div className="text-gray-500 text-sm mb-2 line-clamp-2">
                    {item.mo_ta}
                  </div>
                  <div className="text-gray-400 text-xs mt-auto">
                    {new Date(item.ngay).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
        </div>
        <div className="flex justify-center mt-6">
          <a
            href="/news"
            className="text-blue-600 font-medium border border-blue-600 rounded-xl px-6 py-2 hover:bg-blue-50 transition"
          >
            Xem tất cả Tin Tức &rarr;
          </a>
        </div>
      </div>
    </section>
  );
};

export default SectionNews;