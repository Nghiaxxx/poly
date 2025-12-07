import React from "react";
import User from "@/components/admin/User";
import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {};

const UserPage = () => {
  return (
    <DefaultLayout>
      <User />
    </DefaultLayout>
  );
};

export default UserPage;
