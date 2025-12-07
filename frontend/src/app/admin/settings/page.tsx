import React from "react";
import Settings from "@/components/admin/Settings";
import { Metadata } from "next";
import DefaultLayout from "@/components/admin/Layouts/DefaultLayout";

export const metadata: Metadata = {};

const SettingsPage = () => {
  return (
    <DefaultLayout>
      <Settings />
    </DefaultLayout>
  );
};

export default SettingsPage;
