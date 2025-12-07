"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileSidebar from "@/components/client/profile/ProfileSidebar";
import ProfileContent from "@/components/client/profile/ProfileContent";

export default function ProfilePageNew() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabQuery || "info");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Sync URL with tab changes
  useEffect(() => {
    const currentTab = tabQuery || "info";
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [tabQuery, activeTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <ProfileSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <ProfileContent activeTab={activeTab} />
    </div>
  );
} 