import React from "react";
import Variantproduct from "@/components/admin/Variantproduct";
import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {};

const VariantproductPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <DefaultLayout>
      <Variantproduct productId={id} />
    </DefaultLayout>
  );
};

export default VariantproductPage;
