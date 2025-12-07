"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import "@/css/dashboard-custom.css";
// Import CSS cho client để admin cũng có styles cần thiết
import "../(client)/globals.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/admin/common/Loader";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <html lang="vi">
      <body suppressHydrationWarning={true}>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          <AuthProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10B981',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: '#EF4444',
                  },
                },
              }}
            />
            {loading ? <Loader /> : children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
