import Breadcrumb from "@/components/admin/Breadcrumbs/Breadcrumb";
import TableOne from "@/components/admin/Tables/TableOne";
import TableThree from "@/components/admin/Tables/TableThree";
import TableTwo from "@/components/admin/Tables/TableTwo";

import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Next.js Tables | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Tables page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Tables" />

      <div className="flex flex-col gap-10">
        <TableOne />
        <TableTwo />
        <TableThree />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
