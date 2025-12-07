"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileSidebar from "@/components/client/profile/ProfileSidebar";
import ProfileContent from "@/components/client/profile/ProfileContent";

function ProfilePageContent() {
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

  // Change tab and update URL
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <ProfileSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ProfileContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-800">Đang tải thông tin profile...</p>
          </div>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}