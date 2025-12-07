"use client";
import ECommerce from "@/components/admin/Dashboard/E-commerce";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </ProtectedRoute>
  );
}
