import React from "react";
import News from "@/components/admin/news";
import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {};

const NewsPage = () => {
  return (
    <DefaultLayout>
      <News />
    </DefaultLayout>
  );
};

export default NewsPage;
