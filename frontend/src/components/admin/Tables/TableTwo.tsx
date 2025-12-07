"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/images/no-image.svg';
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/')) return imageUrl;
  return `/images/${imageUrl}`;
};

const FILTER_OPTIONS = [
  { value: "best", label: "Bán chạy nhất" },
  { value: "worst", label: "Bán ít nhất" },
];

const TableTwo = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filterOption, setFilterOption] = useState("best");

  useEffect(() => {
    fetch(`/api/products/top?type=${filterOption}&limit=5`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => setProducts([]));
  }, [filterOption]);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center justify-between px-4 py-6 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Top sản phẩm {filterOption === 'best' ? 'bán chạy' : 'bán ít'}
        </h4>
        <select
          className="border rounded px-3 py-2"
          value={filterOption}
          onChange={e => setFilterOption(e.target.value)}
        >
          {FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-3 flex items-center">
          <p className="font-medium">Tên sản phẩm</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Danh mục</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Lượt bán</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Trạng thái</p>
        </div>
      </div>
      {products.map((product, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={product._id || key}
        >
          <div className="col-span-3 flex items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-12.5 w-15 rounded-md">
                <Image
                  src={getImageUrl(product.hinh)}
                  width={60}
                  height={50}
                  alt={product.TenSP || product.name || "Product"}
                />
              </div>
              <p className="text-sm text-black dark:text-white">
                {product.TenSP || product.name}
              </p>
            </div>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
              {product.categories?.[0]?.ten_danh_muc || product.category || "-"}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{product.ban_chay || 0}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <span className={`text-xs px-2 py-1 rounded-full ${product.an_hien === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {product.an_hien === false ? "Ẩn" : "Hiện"}
            </span>
          </div>
        </div>
      ))}
      {products.length === 0 && (
        <div className="p-4 text-center text-gray-500">Không có sản phẩm nào.</div>
      )}
    </div>
  );
};

export default TableTwo;
