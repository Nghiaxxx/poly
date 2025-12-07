"use client";

import { Suspense } from "react";
import SearchResult from "@/components/client/SearchResult";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-800">Đang tải kết quả tìm kiếm...</p>
          </div>
        </div>
      </div>
    }>
      <SearchResult />
    </Suspense>
  );
}