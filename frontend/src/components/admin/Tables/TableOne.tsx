"use client";

import { BRAND } from "@/types/brand";
import Image from "next/image";
import { useEffect, useState } from "react";

const brandData: BRAND[] = [
  {
    logo: "/images/brand/brand-01.svg",
    name: "Google",
    visitors: 3.5,
    revenues: "5,768",
    sales: 590,
    conversion: 4.8,
  },
  {
    logo: "/images/brand/brand-02.svg",
    name: "Twitter",
    visitors: 2.2,
    revenues: "4,635",
    sales: 467,
    conversion: 4.3,
  },
  {
    logo: "/images/brand/brand-03.svg",
    name: "Github",
    visitors: 2.1,
    revenues: "4,290",
    sales: 420,
    conversion: 3.7,
  },
  {
    logo: "/images/brand/brand-04.svg",
    name: "Vimeo",
    visitors: 1.5,
    revenues: "3,580",
    sales: 389,
    conversion: 2.5,
  },
  {
    logo: "/images/brand/brand-05.svg",
    name: "Facebook",
    visitors: 3.5,
    revenues: "6,768",
    sales: 390,
    conversion: 4.2,
  },
];

interface PendingOrder {
  _id: string;
  customerInfo: { fullName: string; phone: string; };
  totalAmount: number;
  createdAt: string;
}

const TableOne = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  useEffect(() => {
    fetch("/api/orders/pending")
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Đơn hàng chưa xác nhận
      </h4>
      <div className="flex flex-col">
        <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4">
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Khách hàng</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Số điện thoại</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Tổng tiền</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Ngày tạo</h5></div>
        </div>
        {orders.map((order) => (
          <div className="grid grid-cols-4 border-b border-stroke dark:border-strokedark" key={order._id}>
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{order.customerInfo?.fullName || ""}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{order.customerInfo?.phone || ""}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-meta-3">{order.totalAmount?.toLocaleString()}₫</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="p-4 text-center text-gray-500">Không có đơn hàng nào chưa xác nhận.</div>
        )}
      </div>
    </div>
  );
};

export default TableOne;
