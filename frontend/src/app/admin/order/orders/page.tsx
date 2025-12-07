import React from "react";
import Orders from "@/components/admin/Orders";
import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {};

const OrdersPage = () => {
  return (
    <DefaultLayout>
      <Orders />
    </DefaultLayout>
  );
};

export default OrdersPage; 