import React from "react";
import Category from "@/components/admin/Category";
import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {};

const CategoryPage = () => {
  return (
    <DefaultLayout>
      <Category />
    </DefaultLayout>
  );
};

export default CategoryPage;
